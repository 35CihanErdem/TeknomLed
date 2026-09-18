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

    [HttpGet("products")]
    [RequirePermission(PermissionNames.ProductView)]
    public Task<PagedResult<AdminProductListItemDto>> GetProducts(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] bool? isActive,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = AdminCatalogService.DefaultPageSize,
        CancellationToken ct = default) =>
        _admin.GetProductsAsync(new AdminProductQuery
        {
            Search = search,
            Category = category,
            IsActive = isActive,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        }, ct);

    [HttpGet("products/{id:guid}")]
    [RequirePermission(PermissionNames.ProductView)]
    public Task<AdminProductDetailDto> GetProduct(Guid id, CancellationToken ct) =>
        _admin.GetProductByIdAsync(id, ct);

    [HttpPost("products")]
    [RequirePermission(PermissionNames.ProductCreate)]
    public Task<AdminProductDetailDto> CreateProduct([FromBody] CreateProductRequest request, CancellationToken ct) =>
        _admin.CreateProductAsync(request, ct);

    [HttpPut("products/{id:guid}")]
    [RequirePermission(PermissionNames.ProductUpdate)]
    public Task<AdminProductDetailDto> UpdateProduct(
        Guid id,
        [FromBody] UpdateProductRequest request,
        CancellationToken ct) =>
        _admin.UpdateProductAsync(id, request, ct);

    [HttpDelete("products/{id:guid}")]
    [RequirePermission(PermissionNames.ProductUpdate)]
    public async Task<IActionResult> DeactivateProduct(Guid id, CancellationToken ct)
    {
        await _admin.DeactivateProductAsync(id, ct);
        return NoContent();
    }

    [HttpGet("categories")]
    [RequirePermission(PermissionNames.ProductView)]
    public Task<IReadOnlyList<AdminCategoryDto>> GetCategories(CancellationToken ct) =>
        _admin.GetCategoriesAsync(ct);

    [HttpPost("categories")]
    [RequirePermission(PermissionNames.ProductCreate)]
    public Task<AdminCategoryDto> CreateCategory([FromBody] CreateCategoryRequest request, CancellationToken ct) =>
        _admin.CreateCategoryAsync(request, ct);

    [HttpPut("categories/{id:guid}")]
    [RequirePermission(PermissionNames.ProductUpdate)]
    public Task<AdminCategoryDto> UpdateCategory(
        Guid id,
        [FromBody] UpdateCategoryRequest request,
        CancellationToken ct) =>
        _admin.UpdateCategoryAsync(id, request, ct);

    [HttpGet("application-areas")]
    [RequirePermission(PermissionNames.ProductView)]
    public Task<IReadOnlyList<AdminApplicationAreaDto>> GetApplicationAreas(CancellationToken ct) =>
        _admin.GetApplicationAreasAsync(ct);

    [HttpPost("application-areas")]
    [RequirePermission(PermissionNames.ProductCreate)]
    public Task<AdminApplicationAreaDto> CreateApplicationArea(
        [FromBody] CreateApplicationAreaRequest request,
        CancellationToken ct) =>
        _admin.CreateApplicationAreaAsync(request, ct);

    [HttpPut("application-areas/{id:guid}")]
    [RequirePermission(PermissionNames.ProductUpdate)]
    public Task<AdminApplicationAreaDto> UpdateApplicationArea(
        Guid id,
        [FromBody] UpdateApplicationAreaRequest request,
        CancellationToken ct) =>
        _admin.UpdateApplicationAreaAsync(id, request, ct);
}
