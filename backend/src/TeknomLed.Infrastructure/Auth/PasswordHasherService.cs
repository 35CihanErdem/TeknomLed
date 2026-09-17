using Microsoft.AspNetCore.Identity;
using TeknomLed.Application.Auth.Abstractions;
using TeknomLed.Domain.Entities;

namespace TeknomLed.Infrastructure.Auth;

public sealed class PasswordHasherService : IPasswordHasherService
{
    private readonly PasswordHasher<User> _hasher = new();

    public string HashPassword(string password)
        => _hasher.HashPassword(null!, password);

    public bool VerifyPassword(string hashedPassword, string providedPassword)
    {
        var result = _hasher.VerifyHashedPassword(null!, hashedPassword, providedPassword);
        return result is PasswordVerificationResult.Success
            or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
