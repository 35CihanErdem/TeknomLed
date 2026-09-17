using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using TeknomLed.Application.Auth.Abstractions;
using TeknomLed.Application.Options;

namespace TeknomLed.Infrastructure.Auth;

public sealed class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly GoogleAuthOptions _options;

    public GoogleTokenValidator(IOptions<GoogleAuthOptions> options)
    {
        _options = options.Value;
    }

    public async Task<GoogleIdentity> ValidateAsync(string credential, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId))
        {
            throw new InvalidOperationException("Google:ClientId is not configured.");
        }

        var payload = await GoogleJsonWebSignature.ValidateAsync(
            credential,
            new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_options.ClientId]
            });

        return new GoogleIdentity(
            payload.Subject,
            payload.Email,
            payload.EmailVerified,
            payload.Name);
    }
}
