namespace TeknomLed.Application.Catalog.Dtos;

public sealed record CategoryDto(Guid Id, string Slug, string Name, string? Description, int SortOrder);

public sealed record ApplicationAreaDto(Guid Id, string Slug, string Name, int SortOrder);

public sealed record ProductMediaDto(Guid Id, string Type, string Url, string? AltText, int SortOrder);

public sealed record ProductVariantDto(
    Guid Id,
    string Sku,
    int? Watt,
    int? Lumen,
    int? Kelvin,
    string? Color,
    string? Dimensions,
    decimal Price,
    int Stock);

public sealed record ProductSpecificationDto(
    Guid Id,
    string Name,
    string Value,
    string? Unit,
    int SortOrder);

public sealed record ProductListItemDto(
    Guid Id,
    string Slug,
    string Name,
    string ShortDescription,
    CategoryDto Category,
    IReadOnlyList<string> ApplicationAreas,
    string? PrimaryImageUrl,
    string? PrimaryImageAlt,
    string? IpRating,
    decimal StartingPrice,
    IReadOnlyList<int> Watts,
    IReadOnlyList<int> Kelvins,
    bool Featured);

public sealed record ProductDetailDto(
    Guid Id,
    string Slug,
    string Name,
    string ShortDescription,
    string? Description,
    CategoryDto Category,
    IReadOnlyList<string> ApplicationAreas,
    IReadOnlyList<ProductMediaDto> Media,
    IReadOnlyList<ProductSpecificationDto> Specifications,
    IReadOnlyList<ProductVariantDto> Variants,
    bool Featured);

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);

public sealed class ProductQuery
{
    public string? Category { get; set; }
    public string[]? ApplicationAreas { get; set; }
    public int[]? Kelvin { get; set; }
    public string[]? PowerRanges { get; set; }
    public string[]? Ip { get; set; }
    public string[]? PriceRanges { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? Featured { get; set; }
    public string? Sort { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 24;
}

public sealed record CreateCategoryRequest(string Slug, string Name, string? Description, int SortOrder, bool IsActive = true);
public sealed record UpdateCategoryRequest(string Slug, string Name, string? Description, int SortOrder, bool IsActive);

public sealed record AdminVariantInput(
    Guid? Id,
    string Sku,
    int? Watt,
    int? Lumen,
    int? Kelvin,
    string? Color,
    string? Dimensions,
    decimal Price,
    int Stock,
    bool IsActive = true);

public sealed record AdminSpecificationInput(
    Guid? Id,
    string Name,
    string Value,
    string? Unit,
    int SortOrder);

public sealed record AdminMediaInput(
    Guid? Id,
    string Type,
    string Path,
    string? AltText,
    int SortOrder,
    bool IsActive = true);

public sealed record CreateProductRequest(
    string Slug,
    string Name,
    string ShortDescription,
    string? Description,
    Guid CategoryId,
    bool IsFeatured,
    bool IsActive,
    IReadOnlyList<Guid> ApplicationAreaIds,
    IReadOnlyList<AdminVariantInput> Variants,
    IReadOnlyList<AdminSpecificationInput> Specifications,
    IReadOnlyList<AdminMediaInput> Media);

public sealed record UpdateProductRequest(
    string Slug,
    string Name,
    string ShortDescription,
    string? Description,
    Guid CategoryId,
    bool IsFeatured,
    bool IsActive,
    IReadOnlyList<Guid> ApplicationAreaIds,
    IReadOnlyList<AdminVariantInput> Variants,
    IReadOnlyList<AdminSpecificationInput> Specifications,
    IReadOnlyList<AdminMediaInput> Media);
