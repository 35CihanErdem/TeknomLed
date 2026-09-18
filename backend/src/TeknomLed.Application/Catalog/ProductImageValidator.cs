using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Domain.Catalog;

namespace TeknomLed.Application.Catalog;

/// <summary>Server-side image upload validation (MIME, extension, magic bytes, size).</summary>
public static class ProductImageValidator
{
    public static readonly HashSet<string> AllowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        MediaTypes.Default,
        MediaTypes.Gallery,
        MediaTypes.LightOn,
        MediaTypes.LightOff,
        MediaTypes.Application
    };

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

    public static string NormalizeType(string? type)
    {
        var normalized = (type ?? string.Empty).Trim().ToUpperInvariant();
        if (!AllowedImageTypes.Contains(normalized))
        {
            throw new AuthException(
                "unsupported_media_type",
                "Geçersiz medya tipi. İzin verilenler: DEFAULT, GALLERY, LIGHT_ON, LIGHT_OFF, APPLICATION.",
                400);
        }

        return normalized;
    }

    public static string ValidateAndGetExtension(
        string? fileName,
        string? contentType,
        long length,
        long maxBytes,
        ReadOnlySpan<byte> header)
    {
        if (length <= 0)
        {
            throw new AuthException("empty_file", "Dosya boş olamaz.", 400);
        }

        if (length > maxBytes)
        {
            throw new AuthException(
                "file_too_large",
                $"Dosya boyutu en fazla {maxBytes / (1024 * 1024)} MB olabilir.",
                400);
        }

        var extension = Path.GetExtension(fileName ?? string.Empty).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            throw new AuthException(
                "unsupported_file",
                "Desteklenmeyen dosya uzantısı. JPEG, PNG veya WebP yükleyin.",
                415);
        }

        var mime = (contentType ?? string.Empty).Split(';')[0].Trim();
        if (!string.IsNullOrWhiteSpace(mime) && !AllowedContentTypes.Contains(mime))
        {
            throw new AuthException(
                "unsupported_file",
                "Desteklenmeyen içerik tipi. JPEG, PNG veya WebP yükleyin.",
                415);
        }

        var detected = DetectImageFormat(header);
        if (detected is null)
        {
            throw new AuthException(
                "unsupported_file",
                "Dosya imzası geçerli bir JPEG/PNG/WebP değil.",
                415);
        }

        // Extension must agree with magic bytes (spoofing defense).
        var expectedExt = detected switch
        {
            "image/jpeg" => new[] { ".jpg", ".jpeg" },
            "image/png" => new[] { ".png" },
            "image/webp" => new[] { ".webp" },
            _ => Array.Empty<string>()
        };

        if (!expectedExt.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            throw new AuthException(
                "unsupported_file",
                "Dosya uzantısı içerikle uyuşmuyor.",
                415);
        }

        if (!string.IsNullOrWhiteSpace(mime) &&
            !string.Equals(mime, detected, StringComparison.OrdinalIgnoreCase))
        {
            // Be lenient if browser sent empty/octet-stream but magic is valid — already checked non-empty mismatch.
            if (!mime.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase))
            {
                throw new AuthException(
                    "unsupported_file",
                    "Bildirilen MIME tipi dosya imzasıyla uyuşmuyor.",
                    415);
            }
        }

        return extension == ".jpeg" ? ".jpg" : extension;
    }

    private static string? DetectImageFormat(ReadOnlySpan<byte> header)
    {
        if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
        {
            return "image/jpeg";
        }

        if (header.Length >= 8 &&
            header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47 &&
            header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A)
        {
            return "image/png";
        }

        // RIFF....WEBP
        if (header.Length >= 12 &&
            header[0] == (byte)'R' && header[1] == (byte)'I' && header[2] == (byte)'F' && header[3] == (byte)'F' &&
            header[8] == (byte)'W' && header[9] == (byte)'E' && header[10] == (byte)'B' && header[11] == (byte)'P')
        {
            return "image/webp";
        }

        return null;
    }
}
