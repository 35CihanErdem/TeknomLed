using TeknomLed.Application.Catalog.Abstractions;

namespace TeknomLed.Infrastructure.Catalog;

/// <summary>
/// Dev/local resolver: returns the stored path as-is (e.g. /assets/...).
/// Replace with S3/R2/CDN resolver in a later phase.
/// </summary>
public sealed class PassthroughMediaPathResolver : IMediaPathResolver
{
    public string ResolveUrl(string path) => path;
}
