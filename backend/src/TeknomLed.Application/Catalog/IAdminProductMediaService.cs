using TeknomLed.Application.Catalog.Dtos;
using TeknomLed.Application.Auth.Dtos;

namespace TeknomLed.Application.Catalog;

public interface IAdminProductMediaService
{
    Task<ProductMediaDto> UploadAsync(
        Guid productId,
        Stream content,
        string fileName,
        string? contentType,
        long length,
        string type,
        string? altText,
        int? sortOrder,
        CancellationToken ct = default);

    Task<ProductMediaDto> UpdateAsync(
        Guid productId,
        Guid mediaId,
        UpdateProductMediaRequest request,
        CancellationToken ct = default);

    Task DeleteAsync(Guid productId, Guid mediaId, CancellationToken ct = default);
}
