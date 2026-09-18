namespace TeknomLed.Application.Catalog.Abstractions;

/// <summary>
/// Object/file storage for product media binaries.
/// Catalog domain stores only the returned relative key in ProductMedia.Path.
/// </summary>
public interface IMediaStorage
{
    /// <summary>
    /// Persist file bytes under a product-scoped key. Returns the storage-relative path
    /// (e.g. products/{productId}/{unique}.jpg) — never a physical OS path.
    /// </summary>
    Task<string> SaveAsync(
        Guid productId,
        Stream content,
        string extension,
        string contentType,
        CancellationToken ct = default);

    /// <summary>Delete by storage-relative path. Missing files are ignored.</summary>
    Task DeleteAsync(string relativePath, CancellationToken ct = default);

    Task<bool> ExistsAsync(string relativePath, CancellationToken ct = default);
}
