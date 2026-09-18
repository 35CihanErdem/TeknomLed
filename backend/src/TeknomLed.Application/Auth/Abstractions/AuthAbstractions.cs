using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Domain.Entities;

namespace TeknomLed.Application.Auth.Abstractions;

public interface IAuthService
{
    Task<AuthTokensResult> RegisterAsync(RegisterRequest request, string? userAgent, string? ipAddress, CancellationToken ct = default);
    Task<AuthTokensResult> LoginAsync(LoginRequest request, string? userAgent, string? ipAddress, CancellationToken ct = default);
    Task<AuthTokensResult> LoginWithGoogleAsync(GoogleAuthRequest request, string? userAgent, string? ipAddress, CancellationToken ct = default);
    Task<AuthTokensResult> RefreshAsync(string refreshToken, string? userAgent, string? ipAddress, CancellationToken ct = default);
    Task LogoutAsync(string? refreshToken, CancellationToken ct = default);
    Task<AuthUserDto> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
    Task<AuthUserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default);
}

public interface IPasswordHasherService
{
    string HashPassword(string password);
    bool VerifyPassword(string hashedPassword, string providedPassword);
}

public interface ITokenService
{
    (string Token, DateTimeOffset ExpiresAt) CreateAccessToken(
        User user,
        IEnumerable<string> roles,
        IEnumerable<string> permissions);
    string CreateRefreshToken();
    string HashRefreshToken(string refreshToken);
}

public interface IGoogleTokenValidator
{
    Task<GoogleIdentity> ValidateAsync(string credential, CancellationToken ct = default);
}

public sealed record GoogleIdentity(
    string Subject,
    string Email,
    bool EmailVerified,
    string? Name);
