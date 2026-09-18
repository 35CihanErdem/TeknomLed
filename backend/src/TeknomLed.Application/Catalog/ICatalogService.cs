using TeknomLed.Application.Catalog.Dtos;

namespace TeknomLed.Application.Catalog;

public interface ICatalogService
{
    Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductQuery query, CancellationToken ct = default);
    Task<ProductDetailDto> GetProductBySlugAsync(string slug, CancellationToken ct = default);
    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ApplicationAreaDto>> GetApplicationAreasAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ProductListItemDto>> GetFeaturedProductsAsync(int limit = 8, CancellationToken ct = default);
    Task<IReadOnlyList<ProductListItemDto>> GetRelatedProductsAsync(string slug, int limit = 3, CancellationToken ct = default);
    Task<IReadOnlyList<ProductDetailDto>> GetProductsByIdsAsync(IReadOnlyList<Guid> ids, CancellationToken ct = default);
}

public interface IAdminCatalogService
{
    Task<ProductDetailDto> CreateProductAsync(CreateProductRequest request, CancellationToken ct = default);
    Task<ProductDetailDto> UpdateProductAsync(Guid id, UpdateProductRequest request, CancellationToken ct = default);
    Task DeactivateProductAsync(Guid id, CancellationToken ct = default);
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken ct = default);
    Task<CategoryDto> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request, CancellationToken ct = default);
}
