using Microsoft.EntityFrameworkCore;
using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Application.Catalog.Abstractions;
using TeknomLed.Application.Catalog.Dtos;
using TeknomLed.Application.Persistence;
using TeknomLed.Domain.Catalog;
using TeknomLed.Domain.Entities;

namespace TeknomLed.Application.Catalog;

public sealed class CatalogService : ICatalogService
{
    public const int MaxPageSize = 48;
    public const int DefaultPageSize = 24;

    private readonly IAppDbContext _db;
    private readonly IMediaPathResolver _media;

    public CatalogService(IAppDbContext db, IMediaPathResolver media)
    {
        _db = db;
        _media = media;
    }

    public async Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductQuery query, CancellationToken ct = default)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize <= 0 ? DefaultPageSize : query.PageSize, 1, MaxPageSize);

        var products = BasePublicProductQuery();

        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            var category = query.Category.Trim().ToLowerInvariant();
            products = products.Where(p => p.Category.Slug == category);
        }

        if (query.ApplicationAreas is { Length: > 0 })
        {
            var areas = query.ApplicationAreas
                .Select(a => a.Trim().ToLowerInvariant())
                .Where(a => a.Length > 0)
                .Distinct()
                .ToArray();
            if (areas.Length > 0)
            {
                products = products.Where(p =>
                    p.ProductApplicationAreas.Any(paa =>
                        paa.ApplicationArea.IsActive &&
                        (areas.Contains(paa.ApplicationArea.Slug) ||
                         areas.Contains(paa.ApplicationArea.Name.ToLower()))));
            }
        }

        if (query.Kelvin is { Length: > 0 })
        {
            var kelvins = query.Kelvin;
            products = products.Where(p =>
                p.Variants.Any(v => v.IsActive && v.Kelvin != null && kelvins.Contains(v.Kelvin.Value)));
        }

        if (query.PowerRanges is { Length: > 0 })
        {
            products = ApplyPowerRanges(products, query.PowerRanges);
        }

        if (query.Ip is { Length: > 0 })
        {
            var ips = query.Ip.Select(x => x.Trim().ToUpperInvariant()).ToArray();
            products = products.Where(p =>
                p.Specifications.Any(s =>
                    s.Name == "IP" && ips.Contains(s.Value.ToUpper())));
        }

        if (query.PriceRanges is { Length: > 0 })
        {
            products = ApplyPriceRanges(products, query.PriceRanges);
        }

        if (query.MinPrice is decimal minPrice)
        {
            products = products.Where(p =>
                p.Variants.Where(v => v.IsActive).Min(v => (decimal?)v.Price) >= minPrice);
        }

        if (query.MaxPrice is decimal maxPrice)
        {
            products = products.Where(p =>
                p.Variants.Where(v => v.IsActive).Min(v => (decimal?)v.Price) <= maxPrice);
        }

        if (query.Featured == true)
        {
            products = products.Where(p => p.IsFeatured);
        }

        var totalItems = await products.CountAsync(ct);
        var sort = (query.Sort ?? "recommended").Trim().ToLowerInvariant();

        products = sort switch
        {
            "price-asc" => products.OrderBy(p => p.Variants.Where(v => v.IsActive).Min(v => v.Price)).ThenBy(p => p.Name),
            "price-desc" => products.OrderByDescending(p => p.Variants.Where(v => v.IsActive).Min(v => v.Price)).ThenBy(p => p.Name),
            "name-asc" => products.OrderBy(p => p.Name),
            _ => products.OrderByDescending(p => p.IsFeatured).ThenBy(p => p.Name)
        };

        var pageEntities = await products
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(p => p.Category)
            .Include(p => p.Variants.Where(v => v.IsActive))
            .Include(p => p.Specifications)
            .Include(p => p.Media.Where(m => m.IsActive))
            .Include(p => p.ProductApplicationAreas)
                .ThenInclude(paa => paa.ApplicationArea)
            .ToListAsync(ct);

        var items = pageEntities.Select(MapListItem).ToList();
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

        return new PagedResult<ProductListItemDto>(items, page, pageSize, totalItems, totalPages);
    }

    public async Task<ProductDetailDto> GetProductBySlugAsync(string slug, CancellationToken ct = default)
    {
        var normalized = (slug ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new AuthException("not_found", "Ürün bulunamadı.", 404);
        }

        var product = await BasePublicProductQuery()
            .Include(p => p.Category)
            .Include(p => p.Variants.Where(v => v.IsActive))
            .Include(p => p.Specifications)
            .Include(p => p.Media.Where(m => m.IsActive))
            .Include(p => p.ProductApplicationAreas)
                .ThenInclude(paa => paa.ApplicationArea)
            .FirstOrDefaultAsync(p => p.Slug == normalized, ct);

        if (product is null)
        {
            throw new AuthException("not_found", "Ürün bulunamadı.", 404);
        }

        return MapDetail(product);
    }

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        return await _db.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Slug, c.Name, c.Description, c.SortOrder))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ApplicationAreaDto>> GetApplicationAreasAsync(CancellationToken ct = default)
    {
        return await _db.ApplicationAreas
            .AsNoTracking()
            .Where(a => a.IsActive)
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Name)
            .Select(a => new ApplicationAreaDto(a.Id, a.Slug, a.Name, a.SortOrder))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ProductListItemDto>> GetFeaturedProductsAsync(int limit = 8, CancellationToken ct = default)
    {
        limit = Math.Clamp(limit, 1, MaxPageSize);
        var result = await GetProductsAsync(new ProductQuery
        {
            Featured = true,
            Sort = "recommended",
            Page = 1,
            PageSize = limit
        }, ct);
        return result.Items;
    }

    public async Task<IReadOnlyList<ProductListItemDto>> GetRelatedProductsAsync(string slug, int limit = 3, CancellationToken ct = default)
    {
        limit = Math.Clamp(limit, 1, 12);
        var product = await BasePublicProductQuery()
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.ProductApplicationAreas)
            .FirstOrDefaultAsync(p => p.Slug == slug.Trim().ToLowerInvariant(), ct);

        if (product is null)
        {
            return [];
        }

        var areaIds = product.ProductApplicationAreas.Select(x => x.ApplicationAreaId).ToList();

        var related = await BasePublicProductQuery()
            .AsNoTracking()
            .Where(p => p.Id != product.Id)
            .Where(p =>
                p.CategoryId == product.CategoryId ||
                p.ProductApplicationAreas.Any(paa => areaIds.Contains(paa.ApplicationAreaId)))
            .OrderByDescending(p => p.CategoryId == product.CategoryId)
            .ThenByDescending(p => p.IsFeatured)
            .ThenBy(p => p.Name)
            .Take(limit)
            .Include(p => p.Category)
            .Include(p => p.Variants.Where(v => v.IsActive))
            .Include(p => p.Specifications)
            .Include(p => p.Media.Where(m => m.IsActive))
            .Include(p => p.ProductApplicationAreas)
                .ThenInclude(paa => paa.ApplicationArea)
            .ToListAsync(ct);

        return related.Select(MapListItem).ToList();
    }

    public async Task<IReadOnlyList<ProductDetailDto>> GetProductsByIdsAsync(IReadOnlyList<Guid> ids, CancellationToken ct = default)
    {
        if (ids.Count == 0)
        {
            return [];
        }

        var unique = ids.Distinct().ToList();
        var products = await BasePublicProductQuery()
            .AsNoTracking()
            .Where(p => unique.Contains(p.Id))
            .Include(p => p.Category)
            .Include(p => p.Variants.Where(v => v.IsActive))
            .Include(p => p.Specifications)
            .Include(p => p.Media.Where(m => m.IsActive))
            .Include(p => p.ProductApplicationAreas)
                .ThenInclude(paa => paa.ApplicationArea)
            .ToListAsync(ct);

        return products.Select(MapDetail).ToList();
    }

    private IQueryable<Product> BasePublicProductQuery() =>
        _db.Products
            .AsNoTracking()
            .Where(p => p.IsActive && p.Category.IsActive)
            .Where(p => p.Variants.Any(v => v.IsActive));

    private static IQueryable<Product> ApplyPowerRanges(IQueryable<Product> products, string[] ranges)
    {
        var normalized = ranges.Select(r => r.Trim()).Where(r => r.Length > 0).Distinct().ToArray();
        if (normalized.Length == 0)
        {
            return products;
        }

        return products.Where(p => p.Variants.Any(v =>
            v.IsActive &&
            v.Watt != null &&
            (
                (normalized.Contains("0-10") && v.Watt >= 0 && v.Watt <= 10) ||
                (normalized.Contains("11-20") && v.Watt >= 11 && v.Watt <= 20) ||
                (normalized.Contains("21-40") && v.Watt >= 21 && v.Watt <= 40) ||
                (normalized.Contains("40+") && v.Watt > 40)
            )));
    }

    private static IQueryable<Product> ApplyPriceRanges(IQueryable<Product> products, string[] ranges)
    {
        var normalized = ranges.Select(r => r.Trim()).Where(r => r.Length > 0).Distinct().ToArray();
        if (normalized.Length == 0)
        {
            return products;
        }

        return products.Where(p =>
            (
                (normalized.Contains("0-1000") &&
                 p.Variants.Where(v => v.IsActive).Min(v => v.Price) >= 0 &&
                 p.Variants.Where(v => v.IsActive).Min(v => v.Price) <= 1000) ||
                (normalized.Contains("1000-2500") &&
                 p.Variants.Where(v => v.IsActive).Min(v => v.Price) > 1000 &&
                 p.Variants.Where(v => v.IsActive).Min(v => v.Price) <= 2500) ||
                (normalized.Contains("2500-5000") &&
                 p.Variants.Where(v => v.IsActive).Min(v => v.Price) > 2500 &&
                 p.Variants.Where(v => v.IsActive).Min(v => v.Price) <= 5000) ||
                (normalized.Contains("5000+") &&
                 p.Variants.Where(v => v.IsActive).Min(v => v.Price) > 5000)
            ));
    }

    private ProductListItemDto MapListItem(Product product)
    {
        var activeVariants = product.Variants.Where(v => v.IsActive).ToList();
        var primary = product.Media
            .Where(m => m.IsActive)
            .OrderBy(m => m.Type == MediaTypes.Default ? 0 : 1)
            .ThenBy(m => m.SortOrder)
            .FirstOrDefault();

        var ip = product.Specifications.FirstOrDefault(s => s.Name == "IP")?.Value;

        return new ProductListItemDto(
            product.Id,
            product.Slug,
            product.Name,
            product.ShortDescription,
            new CategoryDto(
                product.Category.Id,
                product.Category.Slug,
                product.Category.Name,
                product.Category.Description,
                product.Category.SortOrder),
            product.ProductApplicationAreas
                .Where(paa => paa.ApplicationArea.IsActive)
                .OrderBy(paa => paa.ApplicationArea.SortOrder)
                .Select(paa => paa.ApplicationArea.Name)
                .ToList(),
            primary is null ? null : _media.ResolveUrl(primary.Path),
            primary?.AltText,
            ip,
            activeVariants.Count == 0 ? 0 : activeVariants.Min(v => v.Price),
            activeVariants.Where(v => v.Watt != null).Select(v => v.Watt!.Value).Distinct().OrderBy(x => x).ToList(),
            activeVariants.Where(v => v.Kelvin != null).Select(v => v.Kelvin!.Value).Distinct().OrderBy(x => x).ToList(),
            product.IsFeatured);
    }

    private ProductDetailDto MapDetail(Product product)
    {
        return new ProductDetailDto(
            product.Id,
            product.Slug,
            product.Name,
            product.ShortDescription,
            product.Description,
            new CategoryDto(
                product.Category.Id,
                product.Category.Slug,
                product.Category.Name,
                product.Category.Description,
                product.Category.SortOrder),
            product.ProductApplicationAreas
                .Where(paa => paa.ApplicationArea.IsActive)
                .OrderBy(paa => paa.ApplicationArea.SortOrder)
                .Select(paa => paa.ApplicationArea.Name)
                .ToList(),
            product.Media
                .Where(m => m.IsActive)
                .OrderBy(m => m.SortOrder)
                .Select(m => new ProductMediaDto(
                    m.Id,
                    m.Type,
                    _media.ResolveUrl(m.Path),
                    m.AltText,
                    m.SortOrder))
                .ToList(),
            product.Specifications
                .OrderBy(s => s.SortOrder)
                .Select(s => new ProductSpecificationDto(s.Id, s.Name, s.Value, s.Unit, s.SortOrder))
                .ToList(),
            product.Variants
                .Where(v => v.IsActive)
                .OrderBy(v => v.Price)
                .ThenBy(v => v.Sku)
                .Select(v => new ProductVariantDto(
                    v.Id,
                    v.Sku,
                    v.Watt,
                    v.Lumen,
                    v.Kelvin,
                    v.Color,
                    v.Dimensions,
                    v.Price,
                    v.Stock))
                .ToList(),
            product.IsFeatured);
    }
}
