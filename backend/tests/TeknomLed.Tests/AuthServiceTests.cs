using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TeknomLed.Application.Auth;
using TeknomLed.Application.Auth.Abstractions;
using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Application.Options;
using TeknomLed.Domain.Auth;
using TeknomLed.Infrastructure.Auth;
using TeknomLed.Infrastructure.Persistence;

namespace TeknomLed.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task Register_CreatesCustomerAndDoesNotExposePasswordHash()
    {
        await using var db = CreateDb();
        await IdentitySeed.SeedAsync(db);
        var sut = CreateSut(db);

        var result = await sut.RegisterAsync(
            new RegisterRequest("Cihan Test", "cihan@example.com", "5321234567", "password123"),
            "test-agent",
            "127.0.0.1");

        Assert.Equal("cihan@example.com", result.User.Email);
        Assert.Contains(RoleNames.Customer, result.User.Roles);
        Assert.True(result.User.ProfileComplete);
        Assert.False(string.IsNullOrWhiteSpace(result.AccessToken));
        Assert.DoesNotContain("PasswordHash", result.AccessToken, StringComparison.OrdinalIgnoreCase);

        var stored = await db.Users.SingleAsync();
        Assert.False(string.IsNullOrWhiteSpace(stored.PasswordHash));
        Assert.NotEqual("password123", stored.PasswordHash);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Rejected()
    {
        await using var db = CreateDb();
        await IdentitySeed.SeedAsync(db);
        var sut = CreateSut(db);

        await sut.RegisterAsync(
            new RegisterRequest("One", "dup@example.com", "5321234567", "password123"),
            null,
            null);

        var ex = await Assert.ThrowsAsync<AuthException>(() =>
            sut.RegisterAsync(
                new RegisterRequest("Two", "dup@example.com", "5329876543", "password123"),
                null,
                null));

        Assert.Equal("email_taken", ex.Code);
    }

    [Fact]
    public async Task Login_InvalidPassword_UsesGenericError()
    {
        await using var db = CreateDb();
        await IdentitySeed.SeedAsync(db);
        var sut = CreateSut(db);

        await sut.RegisterAsync(
            new RegisterRequest("One", "user@example.com", "5321234567", "password123"),
            null,
            null);

        var ex = await Assert.ThrowsAsync<AuthException>(() =>
            sut.LoginAsync(new LoginRequest("user@example.com", "wrong-password"), null, null));

        Assert.Equal("invalid_credentials", ex.Code);
        Assert.Equal("E-posta veya şifre hatalı.", ex.Message);
    }

    [Fact]
    public async Task Login_InactiveUser_Rejected()
    {
        await using var db = CreateDb();
        await IdentitySeed.SeedAsync(db);
        var sut = CreateSut(db);

        var created = await sut.RegisterAsync(
            new RegisterRequest("One", "inactive@example.com", "5321234567", "password123"),
            null,
            null);

        var user = await db.Users.SingleAsync(u => u.Id == created.User.Id);
        user.IsActive = false;
        await db.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<AuthException>(() =>
            sut.LoginAsync(new LoginRequest("inactive@example.com", "password123"), null, null));

        Assert.Equal("inactive_account", ex.Code);
    }

    [Fact]
    public async Task Google_FirstLogin_CreatesCustomer_ProfileIncompleteWithoutPhone()
    {
        await using var db = CreateDb();
        await IdentitySeed.SeedAsync(db);
        var sut = CreateSut(db, new FakeGoogleValidator(new GoogleIdentity(
            "google-sub-1",
            "google.user@example.com",
            true,
            "Google User")));

        var result = await sut.LoginWithGoogleAsync(new GoogleAuthRequest("credential"), null, null);

        Assert.Contains(RoleNames.Customer, result.User.Roles);
        Assert.False(result.User.ProfileComplete);
        Assert.Null(result.User.Phone);
        Assert.Equal(1, await db.Users.CountAsync());
        Assert.Equal(1, await db.ExternalLogins.CountAsync());
    }

    [Fact]
    public async Task Google_RepeatedLogin_DoesNotDuplicateUser()
    {
        await using var db = CreateDb();
        await IdentitySeed.SeedAsync(db);
        var sut = CreateSut(db, new FakeGoogleValidator(new GoogleIdentity(
            "google-sub-2",
            "repeat@example.com",
            true,
            "Repeat User")));

        await sut.LoginWithGoogleAsync(new GoogleAuthRequest("credential"), null, null);
        await sut.LoginWithGoogleAsync(new GoogleAuthRequest("credential"), null, null);

        Assert.Equal(1, await db.Users.CountAsync());
        Assert.Equal(1, await db.ExternalLogins.CountAsync());
    }

    [Fact]
    public async Task Google_LinksToExistingPasswordAccountByVerifiedEmail()
    {
        await using var db = CreateDb();
        await IdentitySeed.SeedAsync(db);
        var sut = CreateSut(db, new FakeGoogleValidator(new GoogleIdentity(
            "google-sub-3",
            "link@example.com",
            true,
            "Linked")));

        await sut.RegisterAsync(
            new RegisterRequest("Local", "link@example.com", "5321234567", "password123"),
            null,
            null);

        var result = await sut.LoginWithGoogleAsync(new GoogleAuthRequest("credential"), null, null);

        Assert.Equal(1, await db.Users.CountAsync());
        Assert.Equal(1, await db.ExternalLogins.CountAsync());
        Assert.True(result.User.ProfileComplete);
    }

    [Fact]
    public async Task Profile_UpdatePhone_CompletesProfile()
    {
        await using var db = CreateDb();
        await IdentitySeed.SeedAsync(db);
        var sut = CreateSut(db, new FakeGoogleValidator(new GoogleIdentity(
            "google-sub-4",
            "phone@example.com",
            true,
            "Phone User")));

        var auth = await sut.LoginWithGoogleAsync(new GoogleAuthRequest("credential"), null, null);
        var updated = await sut.UpdateProfileAsync(auth.User.Id, new UpdateProfileRequest("5551112233", null));

        Assert.True(updated.ProfileComplete);
        Assert.Equal("5551112233", updated.Phone);
    }

    [Fact]
    public async Task Refresh_RotatesSession_AndRevokedRejected()
    {
        await using var db = CreateDb();
        await IdentitySeed.SeedAsync(db);
        var sut = CreateSut(db);

        var first = await sut.RegisterAsync(
            new RegisterRequest("One", "refresh@example.com", "5321234567", "password123"),
            null,
            null);

        var second = await sut.RefreshAsync(first.RefreshToken, null, null);
        Assert.NotEqual(first.RefreshToken, second.RefreshToken);

        var ex = await Assert.ThrowsAsync<AuthException>(() =>
            sut.RefreshAsync(first.RefreshToken, null, null));
        Assert.Equal("invalid_refresh", ex.Code);
    }

    [Fact]
    public async Task Logout_RevokesRefreshSession()
    {
        await using var db = CreateDb();
        await IdentitySeed.SeedAsync(db);
        var sut = CreateSut(db);

        var auth = await sut.RegisterAsync(
            new RegisterRequest("One", "logout@example.com", "5321234567", "password123"),
            null,
            null);

        await sut.LogoutAsync(auth.RefreshToken);

        var ex = await Assert.ThrowsAsync<AuthException>(() =>
            sut.RefreshAsync(auth.RefreshToken, null, null));
        Assert.Equal("invalid_refresh", ex.Code);
    }

    [Fact]
    public async Task Google_InvalidCredential_Rejected()
    {
        await using var db = CreateDb();
        await IdentitySeed.SeedAsync(db);
        var sut = CreateSut(db, new ThrowingGoogleValidator());

        var ex = await Assert.ThrowsAsync<AuthException>(() =>
            sut.LoginWithGoogleAsync(new GoogleAuthRequest("bad"), null, null));

        Assert.Equal("invalid_google_credential", ex.Code);
    }

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static AuthService CreateSut(AppDbContext db, IGoogleTokenValidator? google = null)
    {
        var jwt = Options.Create(new JwtOptions
        {
            Issuer = "TeknomLed",
            Audience = "TeknomLed.Storefront",
            SigningKey = "test-signing-key-at-least-32-characters-long",
            AccessTokenMinutes = 15,
            RefreshTokenDays = 14
        });

        return new AuthService(
            db,
            new PasswordHasherService(),
            new TokenService(jwt),
            google ?? new FakeGoogleValidator(new GoogleIdentity("sub", "x@example.com", true, "X")),
            jwt);
    }

    private sealed class FakeGoogleValidator : IGoogleTokenValidator
    {
        private readonly GoogleIdentity _identity;

        public FakeGoogleValidator(GoogleIdentity identity) => _identity = identity;

        public Task<GoogleIdentity> ValidateAsync(string credential, CancellationToken ct = default)
            => Task.FromResult(_identity);
    }

    private sealed class ThrowingGoogleValidator : IGoogleTokenValidator
    {
        public Task<GoogleIdentity> ValidateAsync(string credential, CancellationToken ct = default)
            => throw new InvalidOperationException("invalid");
    }
}
