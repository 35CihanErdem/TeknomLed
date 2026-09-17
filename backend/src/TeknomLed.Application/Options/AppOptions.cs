namespace TeknomLed.Application.Options;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "TeknomLed";
    public string Audience { get; set; } = "TeknomLed.Storefront";
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 14;
}

public sealed class GoogleAuthOptions
{
    public const string SectionName = "Google";

    public string ClientId { get; set; } = string.Empty;
}

public sealed class CorsOptions
{
    public const string SectionName = "Cors";

    public string[] AllowedOrigins { get; set; } = [];
}
