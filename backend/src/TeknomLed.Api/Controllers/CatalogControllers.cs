using Microsoft.AspNetCore.Mvc;
using TeknomLed.Application.Catalog;
using TeknomLed.Application.Catalog.Dtos;

namespace TeknomLed.Api.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController : ControllerBase
{
    private readonly ICatalogService _catalog;

    public ProductsController(ICatalogService catalog)
    {
        _catalog = catalog;
    }

    [HttpGet]
    public Task<PagedResult<ProductListItemDto>> GetProducts(
        [FromQuery] string? category,
        [FromQuery] string[]? applicationArea,
        [FromQuery] int[]? kelvin,
        [FromQuery] string[]? powerRanges,
        [FromQuery] string[]? ip,
        [FromQuery] string[]? priceRanges,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] bool? featured,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = CatalogService.DefaultPageSize,
        CancellationToken ct = default)
    {
        return _catalog.GetProductsAsync(new ProductQuery
        {
            Category = category,
            ApplicationAreas = applicationArea,
            Kelvin = kelvin,
            PowerRanges = powerRanges,
            Ip = ip,
            PriceRanges = priceRanges,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            Featured = featured,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        }, ct);
    }

    [HttpGet("{slug}")]
    public Task<ProductDetailDto> GetBySlug(string slug, CancellationToken ct = default) =>
        _catalog.GetProductBySlugAsync(slug, ct);

    [HttpGet("{slug}/related")]
    public Task<IReadOnlyList<ProductListItemDto>> GetRelated(
        string slug,
        [FromQuery] int limit = 3,
        CancellationToken ct = default) =>
        _catalog.GetRelatedProductsAsync(slug, limit, ct);

    [HttpPost("batch")]
    public Task<IReadOnlyList<ProductDetailDto>> Batch(
        [FromBody] Guid[] ids,
        CancellationToken ct = default) =>
        _catalog.GetProductsByIdsAsync(ids ?? [], ct);
}

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController : ControllerBase
{
    private readonly ICatalogService _catalog;

    public CategoriesController(ICatalogService catalog) => _catalog = catalog;

    [HttpGet]
    public Task<IReadOnlyList<CategoryDto>> Get(CancellationToken ct = default) =>
        _catalog.GetCategoriesAsync(ct);
}

[ApiController]
[Route("api/application-areas")]
public sealed class ApplicationAreasController : ControllerBase
{
    private readonly ICatalogService _catalog;

    public ApplicationAreasController(ICatalogService catalog) => _catalog = catalog;

    [HttpGet]
    public Task<IReadOnlyList<ApplicationAreaDto>> Get(CancellationToken ct = default) =>
        _catalog.GetApplicationAreasAsync(ct);
}
