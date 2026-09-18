using Microsoft.Extensions.Options;
using TeknomLed.Application.Catalog.Abstractions;
using TeknomLed.Application.Options;

namespace TeknomLed.Infrastructure.Catalog;

/// <summary>
/// Resolves ProductMedia.Path to a browser URL.
/// Legacy seed paths under /assets pass through; storage keys map to PublicBasePath.
/// </summary>
public sealed class ConfiguredMediaPathResolver : IMediaPathResolver
{
    private readonly string _publicBase;

    public ConfiguredMediaPathResolver(IOptions<MediaOptions> options)
    {
        _publicBase = NormalizeBase(options.Value.PublicBasePath);
    }

    public string ResolveUrl(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return string.Empty;
        }

        var trimmed = path.Trim().Replace('\\', '/');

        if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        if (trimmed.StartsWith("/assets", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        if (trimmed.StartsWith("assets/", StringComparison.OrdinalIgnoreCase))
        {
            return "/" + trimmed;
        }

        if (trimmed.StartsWith(_publicBase + "/", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(trimmed, _publicBase, StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        var key = trimmed.TrimStart('/');
        return $"{_publicBase}/{key}";
    }

    private static string NormalizeBase(string? value)
    {
        var basePath = string.IsNullOrWhiteSpace(value) ? "/media" : value.Trim().Replace('\\', '/');
        if (!basePath.StartsWith('/'))
        {
            basePath = "/" + basePath;
        }

        return basePath.TrimEnd('/');
    }
}
