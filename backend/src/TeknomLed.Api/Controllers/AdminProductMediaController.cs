using Microsoft.AspNetCore.Mvc;
using TeknomLed.Api.Authorization;
using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Application.Catalog;
using TeknomLed.Application.Catalog.Dtos;

namespace TeknomLed.Api.Controllers;

[ApiController]
[Route("api/admin/products/{productId:guid}/media")]
public sealed class AdminProductMediaController : ControllerBase
{
    private readonly IAdminProductMediaService _media;

    public AdminProductMediaController(IAdminProductMediaService media)
    {
        _media = media;
    }

    /// <summary>multipart/form-data: file, type, altText?, sortOrder?</summary>
    [HttpPost]
    [RequirePermission(PermissionNames.ProductUpdate)]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
    public async Task<ProductMediaDto> Upload(
        Guid productId,
        IFormFile? file,
        [FromForm] string type,
        [FromForm] string? altText,
        [FromForm] int? sortOrder,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            throw new AuthException("empty_file", "Dosya boş olamaz.", 400);
        }

        await using var stream = file.OpenReadStream();
        return await _media.UploadAsync(
            productId,
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            type,
            altText,
            sortOrder,
            ct);
    }

    [HttpPut("{mediaId:guid}")]
    [RequirePermission(PermissionNames.ProductUpdate)]
    public Task<ProductMediaDto> Update(
        Guid productId,
        Guid mediaId,
        [FromBody] UpdateProductMediaRequest request,
        CancellationToken ct) =>
        _media.UpdateAsync(productId, mediaId, request, ct);

    [HttpDelete("{mediaId:guid}")]
    [RequirePermission(PermissionNames.ProductUpdate)]
    public async Task<IActionResult> Delete(Guid productId, Guid mediaId, CancellationToken ct)
    {
        await _media.DeleteAsync(productId, mediaId, ct);
        return NoContent();
    }
}
