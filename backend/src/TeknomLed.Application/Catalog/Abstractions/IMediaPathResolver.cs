namespace TeknomLed.Application.Catalog.Abstractions;

/// <summary>
/// Resolves stored media paths to client-facing URLs.
/// Swap implementation later for S3/R2/CDN without changing Product domain logic.
/// </summary>
public interface IMediaPathResolver
{
    string ResolveUrl(string path);
}
