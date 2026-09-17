namespace TeknomLed.Application.Auth.Dtos;

public sealed record RegisterRequest(string FullName, string Email, string Phone, string Password);

public sealed record LoginRequest(string Email, string Password);

public sealed record GoogleAuthRequest(string Credential);

public sealed record UpdateProfileRequest(string Phone, string? FullName);

public sealed record AuthUserDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    bool PhoneVerified,
    bool EmailVerified,
    bool ProfileComplete,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions);

public sealed record AuthTokensResult(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAt,
    DateTimeOffset RefreshTokenExpiresAt,
    AuthUserDto User);

public sealed class AuthException : Exception
{
    public AuthException(string code, string message, int statusCode = 400)
        : base(message)
    {
        Code = code;
        StatusCode = statusCode;
    }

    public string Code { get; }
    public int StatusCode { get; }
}
