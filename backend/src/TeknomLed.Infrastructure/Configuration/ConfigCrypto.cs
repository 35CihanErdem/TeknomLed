using System.Security.Cryptography;
using System.Text;

namespace TeknomLed.Infrastructure.Configuration;

/// <summary>
/// Lightweight obfuscation for local/dev secrets in config files.
/// Format: enc:&lt;base64(nonce|tag|ciphertext)&gt;
/// Not a substitute for User Secrets / Key Vault — the unwrap key lives in the binary.
/// Plaintext values (without the enc: prefix) are returned unchanged.
/// </summary>
public static class ConfigCrypto
{
    public const string Prefix = "enc:";

    // 32-byte AES key (base64). Rotate by regenerating + re-protecting config values.
    private static readonly byte[] Key = Convert.FromBase64String(
        "8qR2nF0vLxYwKp7ZsH3mTdUcBeAaGfIjKlMnOpQrStU=");

    public static string Protect(string plaintext)
    {
        ArgumentException.ThrowIfNullOrEmpty(plaintext);

        var nonce = RandomNumberGenerator.GetBytes(12);
        var plainBytes = Encoding.UTF8.GetBytes(plaintext);
        var cipherBytes = new byte[plainBytes.Length];
        var tag = new byte[16];

        using var aes = new AesGcm(Key, tag.Length);
        aes.Encrypt(nonce, plainBytes, cipherBytes, tag);

        var packed = new byte[nonce.Length + tag.Length + cipherBytes.Length];
        Buffer.BlockCopy(nonce, 0, packed, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, packed, nonce.Length, tag.Length);
        Buffer.BlockCopy(cipherBytes, 0, packed, nonce.Length + tag.Length, cipherBytes.Length);

        return Prefix + Convert.ToBase64String(packed);
    }

    public static string UnprotectIfNeeded(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value ?? string.Empty;
        }

        if (!value.StartsWith(Prefix, StringComparison.Ordinal))
        {
            return value;
        }

        var packed = Convert.FromBase64String(value[Prefix.Length..]);
        if (packed.Length < 12 + 16 + 1)
        {
            throw new InvalidOperationException("Encrypted config value is invalid.");
        }

        var nonce = packed.AsSpan(0, 12);
        var tag = packed.AsSpan(12, 16);
        var cipher = packed.AsSpan(28);
        var plain = new byte[cipher.Length];

        using var aes = new AesGcm(Key, 16);
        aes.Decrypt(nonce, cipher, tag, plain);

        return Encoding.UTF8.GetString(plain);
    }
}
