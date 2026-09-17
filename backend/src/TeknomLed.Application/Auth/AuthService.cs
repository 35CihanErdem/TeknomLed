using System.Text.RegularExpressions;
using TeknomLed.Application.Auth.Abstractions;
using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Application.Options;
using TeknomLed.Domain.Auth;
using TeknomLed.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace TeknomLed.Application.Auth;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<ExternalLogin> ExternalLogins { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<RefreshSession> RefreshSessions { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public sealed class AuthService : IAuthService
{
    private static readonly Regex PhoneRegex = new(@"^5\d{9}$", RegexOptions.Compiled);

    private readonly IAppDbContext _db;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IGoogleTokenValidator _googleTokenValidator;
    private readonly JwtOptions _jwtOptions;

    public AuthService(
        IAppDbContext db,
        IPasswordHasherService passwordHasher,
        ITokenService tokenService,
        IGoogleTokenValidator googleTokenValidator,
        IOptions<JwtOptions> jwtOptions)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _googleTokenValidator = googleTokenValidator;
        _jwtOptions = jwtOptions.Value;
    }

    public async Task<AuthTokensResult> RegisterAsync(
        RegisterRequest request,
        string? userAgent,
        string? ipAddress,
        CancellationToken ct = default)
    {
        var fullName = (request.FullName ?? string.Empty).Trim();
        var email = NormalizeEmail(request.Email);
        var phone = NormalizePhone(request.Phone);
        var password = request.Password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new AuthException("validation_error", "Ad soyad zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            throw new AuthException("validation_error", "Geçerli bir e-posta adresi girin.");
        }

        if (!IsValidPhone(phone))
        {
            throw new AuthException("validation_error", "Geçerli bir telefon numarası girin.");
        }

        if (!IsValidPassword(password))
        {
            throw new AuthException("validation_error", "Şifre en az 8 karakter olmalıdır.");
        }

        var exists = await _db.Users.AnyAsync(u => u.NormalizedEmail == email, ct);
        if (exists)
        {
            throw new AuthException("email_taken", "Bu e-posta ile kayıt olunamaz.", 409);
        }

        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.Trim(),
            NormalizedEmail = email,
            PasswordHash = _passwordHasher.HashPassword(password),
            FullName = fullName,
            Phone = phone,
            PhoneVerified = false,
            EmailVerified = false,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Users.Add(user);
        await AssignCustomerRoleAsync(user.Id, ct);
        await _db.SaveChangesAsync(ct);

        return await IssueSessionAsync(user.Id, userAgent, ipAddress, ct);
    }

    public async Task<AuthTokensResult> LoginAsync(
        LoginRequest request,
        string? userAgent,
        string? ipAddress,
        CancellationToken ct = default)
    {
        var email = NormalizeEmail(request.Email);
        var password = request.Password ?? string.Empty;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == email, ct);
        if (user is null || string.IsNullOrEmpty(user.PasswordHash) ||
            !_passwordHasher.VerifyPassword(user.PasswordHash, password))
        {
            throw new AuthException("invalid_credentials", "E-posta veya şifre hatalı.", 401);
        }

        if (!user.IsActive)
        {
            throw new AuthException("inactive_account", "E-posta veya şifre hatalı.", 401);
        }

        return await IssueSessionAsync(user.Id, userAgent, ipAddress, ct);
    }

    public async Task<AuthTokensResult> LoginWithGoogleAsync(
        GoogleAuthRequest request,
        string? userAgent,
        string? ipAddress,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Credential))
        {
            throw new AuthException("invalid_google_credential", "Google kimlik bilgisi geçersiz.", 401);
        }

        GoogleIdentity identity;
        try
        {
            identity = await _googleTokenValidator.ValidateAsync(request.Credential, ct);
        }
        catch
        {
            throw new AuthException("invalid_google_credential", "Google kimlik bilgisi doğrulanamadı.", 401);
        }

        if (string.IsNullOrWhiteSpace(identity.Subject))
        {
            throw new AuthException("invalid_google_credential", "Google kimlik bilgisi doğrulanamadı.", 401);
        }

        var existingLogin = await _db.ExternalLogins
            .Include(x => x.User)
            .FirstOrDefaultAsync(
                x => x.Provider == ExternalProviders.Google && x.ProviderSubject == identity.Subject,
                ct);

        if (existingLogin is not null)
        {
            if (!existingLogin.User.IsActive)
            {
                throw new AuthException("inactive_account", "Hesap aktif değil.", 401);
            }

            return await IssueSessionAsync(existingLogin.UserId, userAgent, ipAddress, ct);
        }

        User user;
        var normalizedEmail = NormalizeEmail(identity.Email);

        // Safe linking: only after Google credential verification.
        // If a local account already has this verified email and no Google link yet, attach ProviderSubject.
        var existingByEmail = await _db.Users
            .Include(u => u.ExternalLogins)
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, ct);

        if (existingByEmail is not null)
        {
            var alreadyHasGoogle = existingByEmail.ExternalLogins.Any(x => x.Provider == ExternalProviders.Google);
            if (alreadyHasGoogle)
            {
                throw new AuthException("account_conflict", "Bu e-posta için hesap çakışması oluştu.", 409);
            }

            if (!existingByEmail.IsActive)
            {
                throw new AuthException("inactive_account", "Hesap aktif değil.", 401);
            }

            user = existingByEmail;
            if (identity.EmailVerified)
            {
                user.EmailVerified = true;
            }

            if (string.IsNullOrWhiteSpace(user.FullName) && !string.IsNullOrWhiteSpace(identity.Name))
            {
                user.FullName = identity.Name.Trim();
            }

            user.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            var now = DateTimeOffset.UtcNow;
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = identity.Email.Trim(),
                NormalizedEmail = normalizedEmail,
                PasswordHash = null,
                FullName = string.IsNullOrWhiteSpace(identity.Name) ? identity.Email.Split('@')[0] : identity.Name.Trim(),
                Phone = null,
                PhoneVerified = false,
                EmailVerified = identity.EmailVerified,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };
            _db.Users.Add(user);
            await AssignCustomerRoleAsync(user.Id, ct);
        }

        _db.ExternalLogins.Add(new ExternalLogin
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Provider = ExternalProviders.Google,
            ProviderSubject = identity.Subject,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await _db.SaveChangesAsync(ct);
        return await IssueSessionAsync(user.Id, userAgent, ipAddress, ct);
    }

    public async Task<AuthTokensResult> RefreshAsync(
        string refreshToken,
        string? userAgent,
        string? ipAddress,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new AuthException("invalid_refresh", "Oturum yenilenemedi.", 401);
        }

        var hash = _tokenService.HashRefreshToken(refreshToken);
        var session = await _db.RefreshSessions
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.TokenHash == hash, ct);

        if (session is null || session.RevokedAt is not null || session.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            throw new AuthException("invalid_refresh", "Oturum yenilenemedi.", 401);
        }

        if (!session.User.IsActive)
        {
            throw new AuthException("inactive_account", "Oturum yenilenemedi.", 401);
        }

        session.RevokedAt = DateTimeOffset.UtcNow;
        var result = await IssueSessionAsync(session.UserId, userAgent, ipAddress, ct, session.Id);
        return result;
    }

    public async Task LogoutAsync(string? refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var hash = _tokenService.HashRefreshToken(refreshToken);
        var session = await _db.RefreshSessions.FirstOrDefaultAsync(s => s.TokenHash == hash, ct);
        if (session is null || session.RevokedAt is not null)
        {
            return;
        }

        session.RevokedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<AuthUserDto> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await LoadUserGraphAsync(userId, ct)
            ?? throw new AuthException("not_found", "Kullanıcı bulunamadı.", 404);

        return MapUser(user);
    }

    public async Task<AuthUserDto> UpdateProfileAsync(
        Guid userId,
        UpdateProfileRequest request,
        CancellationToken ct = default)
    {
        var user = await LoadUserGraphAsync(userId, ct)
            ?? throw new AuthException("not_found", "Kullanıcı bulunamadı.", 404);

        var phone = NormalizePhone(request.Phone);
        if (!IsValidPhone(phone))
        {
            throw new AuthException("validation_error", "Geçerli bir telefon numarası girin.");
        }

        user.Phone = phone;
        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            user.FullName = request.FullName.Trim();
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);

        return MapUser(user);
    }

    private async Task<AuthTokensResult> IssueSessionAsync(
        Guid userId,
        string? userAgent,
        string? ipAddress,
        CancellationToken ct,
        Guid? replacedSessionId = null)
    {
        var user = await LoadUserGraphAsync(userId, ct)
            ?? throw new AuthException("not_found", "Kullanıcı bulunamadı.", 404);

        var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().OrderBy(x => x).ToList();
        var (accessToken, accessExpires) = _tokenService.CreateAccessToken(user, roles);
        var refreshToken = _tokenService.CreateRefreshToken();
        var refreshExpires = DateTimeOffset.UtcNow.AddDays(Math.Max(1, _jwtOptions.RefreshTokenDays));

        var session = new RefreshSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _tokenService.HashRefreshToken(refreshToken),
            ExpiresAt = refreshExpires,
            CreatedAt = DateTimeOffset.UtcNow,
            UserAgent = Truncate(userAgent, 256),
            IpAddress = Truncate(ipAddress, 64)
        };

        _db.RefreshSessions.Add(session);

        if (replacedSessionId is Guid previousId)
        {
            var previous = await _db.RefreshSessions.FirstOrDefaultAsync(s => s.Id == previousId, ct);
            if (previous is not null)
            {
                previous.ReplacedBySessionId = session.Id;
            }
        }

        await _db.SaveChangesAsync(ct);

        return new AuthTokensResult(
            accessToken,
            refreshToken,
            accessExpires,
            refreshExpires,
            MapUser(user));
    }

    private async Task AssignCustomerRoleAsync(Guid userId, CancellationToken ct)
    {
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.NormalizedName == RoleNames.Customer, ct)
            ?? throw new AuthException("role_missing", "CUSTOMER rolü tanımlı değil.", 500);

        _db.UserRoles.Add(new UserRole
        {
            UserId = userId,
            RoleId = role.Id
        });
    }

    private async Task<User?> LoadUserGraphAsync(Guid userId, CancellationToken ct)
    {
        return await _db.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
    }

    private static AuthUserDto MapUser(User user)
    {
        var roles = user.UserRoles
            .Select(ur => ur.Role.Name)
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Name)
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        var profileComplete = !string.IsNullOrWhiteSpace(user.Phone) && IsValidPhone(NormalizePhone(user.Phone));

        return new AuthUserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Phone,
            user.PhoneVerified,
            user.EmailVerified,
            profileComplete,
            roles,
            permissions);
    }

    private static string NormalizeEmail(string? email)
        => (email ?? string.Empty).Trim().ToUpperInvariant();

    private static string NormalizePhone(string? phone)
    {
        var digits = new string((phone ?? string.Empty).Where(char.IsDigit).ToArray());
        if (digits.StartsWith("90") && digits.Length >= 12)
        {
            digits = digits[2..12];
        }
        else if (digits.StartsWith('0') && digits.Length >= 11)
        {
            digits = digits[1..11];
        }

        return digits.Length > 10 ? digits[..10] : digits;
    }

    private static bool IsValidPhone(string phone) => PhoneRegex.IsMatch(phone);

    private static bool IsValidPassword(string password) => password.Length >= 8;

    private static string? Truncate(string? value, int max)
        => string.IsNullOrEmpty(value) ? value : (value.Length <= max ? value : value[..max]);
}
