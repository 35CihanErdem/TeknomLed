using Microsoft.EntityFrameworkCore;
using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Application.Catalog.Abstractions;
using TeknomLed.Application.Catalog.Dtos;
using TeknomLed.Application.Persistence;
using TeknomLed.Domain.Catalog;
using TeknomLed.Domain.Entities;

namespace TeknomLed.Application.Catalog;

public sealed class AdminCatalogService : IAdminCatalogService
{
    public const int MaxPageSize = 100;
    public const int DefaultPageSize = 24;

    private readonly IAppDbContext _db;
    private readonly IMediaPathResolver _media;

    public AdminCatalogService(IAppDbContext db, IMediaPathResolver media)
    {
        _db = db;
        _media = media;
    }

    public async Task<PagedResult<AdminProductListItemDto>> GetProductsAsync(
        AdminProductQuery query,
        CancellationToken ct = default)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize <= 0 ? DefaultPageSize : query.PageSize, 1, MaxPageSize);

        var products = _db.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLowerInvariant();
            products = products.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Slug.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            var category = query.Category.Trim().ToLowerInvariant();
            products = products.Where(p =>
                p.Category.Slug == category ||
                p.CategoryId.ToString().ToLower() == category);
        }

        if (query.IsActive is bool active)
        {
            products = products.Where(p => p.IsActive == active);
        }

        var totalItems = await products.CountAsync(ct);
        var sort = (query.Sort ?? "updated-desc").Trim().ToLowerInvariant();

        products = sort switch
        {
            "name-asc" => products.OrderBy(p => p.Name),
            "name-desc" => products.OrderByDescending(p => p.Name),
            "updated-asc" => products.OrderBy(p => p.UpdatedAtUtc),
            _ => products.OrderByDescending(p => p.UpdatedAtUtc)
        };

        var items = await products
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new AdminProductListItemDto(
                p.Id,
                p.Slug,
                p.Name,
                p.Category.Name,
                p.Category.Slug,
                p.Variants.Count(v => v.IsActive),
                p.IsActive,
                p.IsFeatured,
                p.UpdatedAtUtc))
            .ToListAsync(ct);

        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
        return new PagedResult<AdminProductListItemDto>(items, page, pageSize, totalItems, totalPages);
    }

    public async Task<AdminProductDetailDto> GetProductByIdAsync(Guid id, CancellationToken ct = default)
    {
        var product = await LoadProductGraphAsync(id, tracking: false, ct)
            ?? throw new AuthException("not_found", "Ürün bulunamadı.", 404);
        return MapAdminDetail(product);
    }

    public async Task<AdminProductDetailDto> CreateProductAsync(CreateProductRequest request, CancellationToken ct = default)
    {
        await ValidateProductRequestAsync(
            request.Slug,
            request.Name,
            request.ShortDescription,
            request.CategoryId,
            request.ApplicationAreaIds,
            request.Variants,
            null,
            ct);

        var now = DateTimeOffset.UtcNow;
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Slug = NormalizeSlug(request.Slug),
            Name = request.Name.Trim(),
            ShortDescription = request.ShortDescription.Trim(),
            Description = Truncate(request.Description, 8000),
            CategoryId = request.CategoryId,
            IsFeatured = request.IsFeatured,
            IsActive = request.IsActive,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        ApplyChildren(
            product,
            request.ApplicationAreaIds ?? [],
            request.Variants,
            request.Specifications ?? [],
            request.Media ?? [],
            now,
            replace: true);

        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);
        ClearChangeTracker();
        return await GetProductByIdAsync(product.Id, ct);
    }

    public async Task<AdminProductDetailDto> UpdateProductAsync(
        Guid id,
        UpdateProductRequest request,
        CancellationToken ct = default)
    {
        var product = await LoadProductGraphAsync(id, tracking: true, ct)
            ?? throw new AuthException("not_found", "Ürün bulunamadı.", 404);

        await ValidateProductRequestAsync(
            request.Slug,
            request.Name,
            request.ShortDescription,
            request.CategoryId,
            request.ApplicationAreaIds,
            request.Variants,
            id,
            ct);

        product.Slug = NormalizeSlug(request.Slug);
        product.Name = request.Name.Trim();
        product.ShortDescription = request.ShortDescription.Trim();
        product.Description = Truncate(request.Description, 8000);
        product.CategoryId = request.CategoryId;
        product.IsFeatured = request.IsFeatured;
        product.IsActive = request.IsActive;
        product.UpdatedAtUtc = DateTimeOffset.UtcNow;

        ApplyChildren(
            product,
            request.ApplicationAreaIds ?? [],
            request.Variants,
            request.Specifications ?? [],
            request.Media ?? [],
            product.UpdatedAtUtc,
            replace: true);

        await _db.SaveChangesAsync(ct);
        ClearChangeTracker();
        return await GetProductByIdAsync(product.Id, ct);
    }

    public async Task DeactivateProductAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new AuthException("not_found", "Ürün bulunamadı.", 404);

        product.IsActive = false;
        product.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<AdminCategoryDto>> GetCategoriesAsync(CancellationToken ct = default)
    {
        return await _db.Categories
            .AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new AdminCategoryDto(
                c.Id, c.Slug, c.Name, c.Description, c.SortOrder, c.IsActive, c.UpdatedAtUtc))
            .ToListAsync(ct);
    }

    public async Task<AdminCategoryDto> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken ct = default)
    {
        var slug = NormalizeSlug(request.Slug);
        var name = (request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(slug) || string.IsNullOrWhiteSpace(name))
        {
            throw new AuthException("validation_error", "Kategori slug ve adı zorunludur.");
        }

        if (await _db.Categories.AnyAsync(c => c.Slug == slug, ct))
        {
            throw new AuthException("slug_taken", "Bu kategori slug zaten kullanılıyor.", 409);
        }

        var now = DateTimeOffset.UtcNow;
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Slug = slug,
            Name = name,
            Description = Truncate(request.Description, 2000),
            SortOrder = request.SortOrder,
            IsActive = request.IsActive,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync(ct);
        return new AdminCategoryDto(
            category.Id, category.Slug, category.Name, category.Description,
            category.SortOrder, category.IsActive, category.UpdatedAtUtc);
    }

    public async Task<AdminCategoryDto> UpdateCategoryAsync(
        Guid id,
        UpdateCategoryRequest request,
        CancellationToken ct = default)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new AuthException("not_found", "Kategori bulunamadı.", 404);

        var slug = NormalizeSlug(request.Slug);
        var name = (request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(slug) || string.IsNullOrWhiteSpace(name))
        {
            throw new AuthException("validation_error", "Kategori slug ve adı zorunludur.");
        }

        if (await _db.Categories.AnyAsync(c => c.Slug == slug && c.Id != id, ct))
        {
            throw new AuthException("slug_taken", "Bu kategori slug zaten kullanılıyor.", 409);
        }

        if (!request.IsActive)
        {
            var hasActiveProducts = await _db.Products.AnyAsync(p => p.CategoryId == id && p.IsActive, ct);
            if (hasActiveProducts)
            {
                throw new AuthException(
                    "category_in_use",
                    "Aktif ürünleri olan kategori pasifleştirilemez.",
                    409);
            }
        }

        category.Slug = slug;
        category.Name = name;
        category.Description = Truncate(request.Description, 2000);
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;
        category.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(ct);
        return new AdminCategoryDto(
            category.Id, category.Slug, category.Name, category.Description,
            category.SortOrder, category.IsActive, category.UpdatedAtUtc);
    }

    public async Task<IReadOnlyList<AdminApplicationAreaDto>> GetApplicationAreasAsync(CancellationToken ct = default)
    {
        return await _db.ApplicationAreas
            .AsNoTracking()
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Name)
            .Select(a => new AdminApplicationAreaDto(a.Id, a.Slug, a.Name, a.SortOrder, a.IsActive))
            .ToListAsync(ct);
    }

    public async Task<AdminApplicationAreaDto> CreateApplicationAreaAsync(
        CreateApplicationAreaRequest request,
        CancellationToken ct = default)
    {
        var slug = NormalizeSlug(request.Slug);
        var name = (request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(slug) || string.IsNullOrWhiteSpace(name))
        {
            throw new AuthException("validation_error", "Uygulama alanı slug ve adı zorunludur.");
        }

        if (await _db.ApplicationAreas.AnyAsync(a => a.Slug == slug || a.Name.ToLower() == name.ToLower(), ct))
        {
            throw new AuthException("slug_taken", "Bu uygulama alanı zaten mevcut.", 409);
        }

        var area = new ApplicationArea
        {
            Id = Guid.NewGuid(),
            Slug = slug,
            Name = name,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive
        };

        _db.ApplicationAreas.Add(area);
        await _db.SaveChangesAsync(ct);
        return new AdminApplicationAreaDto(area.Id, area.Slug, area.Name, area.SortOrder, area.IsActive);
    }

    public async Task<AdminApplicationAreaDto> UpdateApplicationAreaAsync(
        Guid id,
        UpdateApplicationAreaRequest request,
        CancellationToken ct = default)
    {
        var area = await _db.ApplicationAreas.FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new AuthException("not_found", "Uygulama alanı bulunamadı.", 404);

        var slug = NormalizeSlug(request.Slug);
        var name = (request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(slug) || string.IsNullOrWhiteSpace(name))
        {
            throw new AuthException("validation_error", "Uygulama alanı slug ve adı zorunludur.");
        }

        if (await _db.ApplicationAreas.AnyAsync(
                a => a.Id != id && (a.Slug == slug || a.Name.ToLower() == name.ToLower()),
                ct))
        {
            throw new AuthException("slug_taken", "Bu uygulama alanı zaten mevcut.", 409);
        }

        area.Slug = slug;
        area.Name = name;
        area.SortOrder = request.SortOrder;
        area.IsActive = request.IsActive;
        await _db.SaveChangesAsync(ct);
        return new AdminApplicationAreaDto(area.Id, area.Slug, area.Name, area.SortOrder, area.IsActive);
    }

    private async Task ValidateProductRequestAsync(
        string slug,
        string name,
        string shortDescription,
        Guid categoryId,
        IReadOnlyList<Guid>? applicationAreaIds,
        IReadOnlyList<AdminVariantInput> variants,
        Guid? excludeProductId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(slug))
        {
            throw new AuthException("validation_error", "Ürün adı ve slug zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(shortDescription))
        {
            throw new AuthException("validation_error", "Kısa açıklama zorunludur.");
        }

        var normalizedSlug = NormalizeSlug(slug);
        var slugTaken = await _db.Products.AnyAsync(
            p => p.Slug == normalizedSlug && (excludeProductId == null || p.Id != excludeProductId),
            ct);
        if (slugTaken)
        {
            throw new AuthException("slug_taken", "Bu ürün slug zaten kullanılıyor.", 409);
        }

        if (!await _db.Categories.AnyAsync(c => c.Id == categoryId, ct))
        {
            throw new AuthException("validation_error", "Geçersiz kategori.");
        }

        var areaIds = (applicationAreaIds ?? []).Distinct().ToList();
        if (areaIds.Count > 0)
        {
            var existingCount = await _db.ApplicationAreas.CountAsync(a => areaIds.Contains(a.Id), ct);
            if (existingCount != areaIds.Count)
            {
                throw new AuthException("validation_error", "Geçersiz uygulama alanı.");
            }
        }

        if (variants is null || variants.Count == 0)
        {
            throw new AuthException("validation_error", "En az bir varyant gerekli.");
        }

        var skuSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var variant in variants)
        {
            if (string.IsNullOrWhiteSpace(variant.Sku))
            {
                throw new AuthException("validation_error", "Varyant SKU zorunludur.");
            }

            if (variant.Price < 0)
            {
                throw new AuthException("validation_error", "Fiyat negatif olamaz.");
            }

            if (variant.Stock < 0)
            {
                throw new AuthException("validation_error", "Stok negatif olamaz.");
            }

            var sku = variant.Sku.Trim().ToUpperInvariant();
            if (!skuSet.Add(sku))
            {
                throw new AuthException("validation_error", $"Tekrarlayan SKU: {sku}");
            }

            var skuTaken = await _db.ProductVariants.AnyAsync(
                v => v.Sku == sku && (variant.Id == null || v.Id != variant.Id),
                ct);
            if (skuTaken)
            {
                throw new AuthException("sku_taken", $"SKU zaten kullanılıyor: {sku}", 409);
            }
        }
    }

    private void ApplyChildren(
        Product product,
        IReadOnlyList<Guid> applicationAreaIds,
        IReadOnlyList<AdminVariantInput> variants,
        IReadOnlyList<AdminSpecificationInput> specifications,
        IReadOnlyList<AdminMediaInput> media,
        DateTimeOffset now,
        bool replace)
    {
        var desiredAreas = applicationAreaIds.Distinct().ToHashSet();
        foreach (var existing in product.ProductApplicationAreas
                     .Where(paa => !desiredAreas.Contains(paa.ApplicationAreaId))
                     .ToList())
        {
            product.ProductApplicationAreas.Remove(existing);
        }

        foreach (var areaId in desiredAreas.Where(id =>
                     product.ProductApplicationAreas.All(paa => paa.ApplicationAreaId != id)))
        {
            var link = new ProductApplicationArea
            {
                ProductId = product.Id,
                ApplicationAreaId = areaId
            };
            product.ProductApplicationAreas.Add(link);
            _db.ProductApplicationAreas.Add(link);
        }

        if (replace)
        {
            var specsToRemove = product.Specifications.ToList();
            if (specsToRemove.Count > 0)
            {
                _db.ProductSpecifications.RemoveRange(specsToRemove);
                product.Specifications.Clear();
            }

            var incomingVariantIds = variants.Where(v => v.Id.HasValue).Select(v => v.Id!.Value).ToHashSet();
            foreach (var existing in product.Variants.Where(v => !incomingVariantIds.Contains(v.Id)).ToList())
            {
                existing.IsActive = false;
                existing.UpdatedAtUtc = now;
            }

            // Empty media on update preserves existing rows (Phase 9C owns uploads).
            if (media.Count > 0)
            {
                var incomingMediaIds = media.Where(m => m.Id.HasValue).Select(m => m.Id!.Value).ToHashSet();
                foreach (var existing in product.Media.Where(m => !incomingMediaIds.Contains(m.Id)).ToList())
                {
                    existing.IsActive = false;
                }
            }
        }

        foreach (var input in variants)
        {
            var sku = input.Sku.Trim().ToUpperInvariant();
            if (input.Id is Guid existingId)
            {
                var existing = product.Variants.FirstOrDefault(v => v.Id == existingId)
                    ?? throw new AuthException("validation_error", "Geçersiz varyant kimliği.");

                existing.Sku = sku;
                existing.Watt = input.Watt;
                existing.Lumen = input.Lumen;
                existing.Kelvin = input.Kelvin;
                existing.Color = Truncate(input.Color, 64);
                existing.Dimensions = Truncate(input.Dimensions, 128);
                existing.Price = input.Price;
                existing.Stock = Math.Max(0, input.Stock);
                existing.IsActive = input.IsActive;
                existing.UpdatedAtUtc = now;
            }
            else
            {
                var createdVariant = new ProductVariant
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    Sku = sku,
                    Watt = input.Watt,
                    Lumen = input.Lumen,
                    Kelvin = input.Kelvin,
                    Color = Truncate(input.Color, 64),
                    Dimensions = Truncate(input.Dimensions, 128),
                    Price = input.Price,
                    Stock = Math.Max(0, input.Stock),
                    IsActive = input.IsActive,
                    CreatedAtUtc = now,
                    UpdatedAtUtc = now
                };
                product.Variants.Add(createdVariant);
                _db.ProductVariants.Add(createdVariant);
            }
        }

        foreach (var spec in specifications)
        {
            if (string.IsNullOrWhiteSpace(spec.Name) || string.IsNullOrWhiteSpace(spec.Value))
            {
                continue;
            }

            var createdSpec = new ProductSpecification
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                Name = spec.Name.Trim(),
                Value = spec.Value.Trim(),
                Unit = Truncate(spec.Unit, 32),
                SortOrder = spec.SortOrder
            };
            product.Specifications.Add(createdSpec);
            _db.ProductSpecifications.Add(createdSpec);
        }

        foreach (var item in media)
        {
            if (string.IsNullOrWhiteSpace(item.Path))
            {
                continue;
            }

            var type = item.Type.Trim().ToUpperInvariant();
            if (!MediaTypes.All.Contains(type))
            {
                throw new AuthException("validation_error", $"Geçersiz medya tipi: {item.Type}");
            }

            if (item.Id is Guid existingId)
            {
                var existing = product.Media.FirstOrDefault(m => m.Id == existingId)
                    ?? throw new AuthException("validation_error", "Geçersiz medya kimliği.");

                existing.Type = type;
                existing.Path = item.Path.Trim();
                existing.AltText = Truncate(item.AltText, 256);
                existing.SortOrder = item.SortOrder;
                existing.IsActive = item.IsActive;
            }
            else
            {
                var createdMedia = new ProductMedia
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    Type = type,
                    Path = item.Path.Trim(),
                    AltText = Truncate(item.AltText, 256),
                    SortOrder = item.SortOrder,
                    IsActive = item.IsActive,
                    CreatedAtUtc = now
                };
                product.Media.Add(createdMedia);
                _db.ProductMedia.Add(createdMedia);
            }
        }
    }

    private void ClearChangeTracker()
    {
        if (_db is DbContext ctx)
        {
            ctx.ChangeTracker.Clear();
        }
    }

    private async Task<Product?> LoadProductGraphAsync(Guid id, bool tracking, CancellationToken ct)
    {
        IQueryable<Product> query = tracking ? _db.Products : _db.Products.AsNoTracking();
        query = query
            .Include(p => p.Variants)
            .Include(p => p.Specifications)
            .Include(p => p.Media)
            .Include(p => p.ProductApplicationAreas);

        if (!tracking)
        {
            query = query
                .Include(p => p.Category)
                .Include(p => p.ProductApplicationAreas)
                    .ThenInclude(paa => paa.ApplicationArea);
        }

        return await query.FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    private AdminProductDetailDto MapAdminDetail(Product product)
    {
        return new AdminProductDetailDto(
            product.Id,
            product.Slug,
            product.Name,
            product.ShortDescription,
            product.Description,
            product.CategoryId,
            new CategoryDto(
                product.Category.Id,
                product.Category.Slug,
                product.Category.Name,
                product.Category.Description,
                product.Category.SortOrder),
            product.ProductApplicationAreas.Select(paa => paa.ApplicationAreaId).ToList(),
            product.ProductApplicationAreas
                .OrderBy(paa => paa.ApplicationArea.SortOrder)
                .Select(paa => paa.ApplicationArea.Name)
                .ToList(),
            product.Media
                .Where(m => m.IsActive)
                .OrderBy(m => m.SortOrder)
                .Select(m => new ProductMediaDto(m.Id, m.Type, _media.ResolveUrl(m.Path), m.AltText, m.SortOrder))
                .ToList(),
            product.Specifications
                .OrderBy(s => s.SortOrder)
                .Select(s => new ProductSpecificationDto(s.Id, s.Name, s.Value, s.Unit, s.SortOrder))
                .ToList(),
            product.Variants
                .OrderByDescending(v => v.IsActive)
                .ThenBy(v => v.Price)
                .Select(v => new AdminVariantDto(
                    v.Id, v.Sku, v.Watt, v.Lumen, v.Kelvin, v.Color, v.Dimensions, v.Price, v.Stock, v.IsActive))
                .ToList(),
            product.IsFeatured,
            product.IsActive,
            product.CreatedAtUtc,
            product.UpdatedAtUtc);
    }

    private static string NormalizeSlug(string slug) =>
        (slug ?? string.Empty).Trim().ToLowerInvariant();

    private static string? Truncate(string? value, int max) =>
        string.IsNullOrWhiteSpace(value)
            ? null
            : (value.Trim().Length <= max ? value.Trim() : value.Trim()[..max]);
}
