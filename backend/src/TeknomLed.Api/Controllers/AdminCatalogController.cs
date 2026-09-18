using Microsoft.AspNetCore.Mvc;
using TeknomLed.Api.Authorization;
using TeknomLed.Application.Catalog;
using TeknomLed.Application.Catalog.Dtos;

namespace TeknomLed.Api.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminCatalogController : ControllerBase
{
    private readonly IAdminCatalogService _admin;

    public AdminCatalogController(IAdminCatalogService admin)
    {
        _admin = admin;
    }

    [HttpPost("products")]
    [RequirePermission(PermissionNames.ProductCreate)]
    public Task<ProductDetailDto> CreateProduct([FromBody] CreateProductRequest request, CancellationToken ct) =>
        _admin.CreateProductAsync(request, ct);

    [HttpPut("products/{id:guid}")]
    [RequirePermission(PermissionNames.ProductUpdate)]
    public Task<ProductDetailDto> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request, CancellationToken ct) =>
        _admin.UpdateProductAsync(id, request, ct);

    [HttpDelete("products/{id:guid}")]
    [RequirePermission(PermissionNames.ProductUpdate)]
    public async Task<IActionResult> DeactivateProduct(Guid id, CancellationToken ct)
    {
        await _admin.DeactivateProductAsync(id, ct);
        return NoContent();
    }

    [HttpPost("categories")]
    [RequirePermission(PermissionNames.ProductCreate)]
    public Task<CategoryDto> CreateCategory([FromBody] CreateCategoryRequest request, CancellationToken ct) =>
        _admin.CreateCategoryAsync(request, ct);

    [HttpPut("categories/{id:guid}")]
    [RequirePermission(PermissionNames.ProductUpdate)]
    public Task<CategoryDto> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequest request, CancellationToken ct) =>
        _admin.UpdateCategoryAsync(id, request, ct);
}
