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
    private readonly IAppDbContext _db;
    private readonly IMediaPathResolver _media;

    public AdminCatalogService(IAppDbContext db, IMediaPathResolver media)
    {
        _db = db;
        _media = media;
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken ct = default)
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

        return new CategoryDto(category.Id, category.Slug, category.Name, category.Description, category.SortOrder);
    }

    public async Task<CategoryDto> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request, CancellationToken ct = default)
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

        category.Slug = slug;
        category.Name = name;
        category.Description = Truncate(request.Description, 2000);
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;
        category.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(ct);
        return new CategoryDto(category.Id, category.Slug, category.Name, category.Description, category.SortOrder);
    }

    public async Task<ProductDetailDto> CreateProductAsync(CreateProductRequest request, CancellationToken ct = default)
    {
        await ValidateProductRequestAsync(request.Slug, request.Name, request.CategoryId, request.Variants, null, ct);

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

        ApplyChildren(product, request.ApplicationAreaIds, request.Variants, request.Specifications, request.Media, now, replace: true);

        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);

        return await LoadDetailAsync(product.Id, ct);
    }

    public async Task<ProductDetailDto> UpdateProductAsync(Guid id, UpdateProductRequest request, CancellationToken ct = default)
    {
        var product = await _db.Products
            .Include(p => p.Variants)
            .Include(p => p.Specifications)
            .Include(p => p.Media)
            .Include(p => p.ProductApplicationAreas)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new AuthException("not_found", "Ürün bulunamadı.", 404);

        await ValidateProductRequestAsync(request.Slug, request.Name, request.CategoryId, request.Variants, id, ct);

        product.Slug = NormalizeSlug(request.Slug);
        product.Name = request.Name.Trim();
        product.ShortDescription = request.ShortDescription.Trim();
        product.Description = Truncate(request.Description, 8000);
        product.CategoryId = request.CategoryId;
        product.IsFeatured = request.IsFeatured;
        product.IsActive = request.IsActive;
        product.UpdatedAtUtc = DateTimeOffset.UtcNow;

        ApplyChildren(product, request.ApplicationAreaIds, request.Variants, request.Specifications, request.Media, product.UpdatedAtUtc, replace: true);

        await _db.SaveChangesAsync(ct);
        return await LoadDetailAsync(product.Id, ct);
    }

    public async Task DeactivateProductAsync(Guid id, CancellationToken ct = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new AuthException("not_found", "Ürün bulunamadı.", 404);

        product.IsActive = false;
        product.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    private async Task ValidateProductRequestAsync(
        string slug,
        string name,
        Guid categoryId,
        IReadOnlyList<AdminVariantInput> variants,
        Guid? excludeProductId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(slug))
        {
            throw new AuthException("validation_error", "Ürün adı ve slug zorunludur.");
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

        if (variants.Count == 0)
        {
            throw new AuthException("validation_error", "En az bir varyant gerekli.");
        }

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

            var sku = variant.Sku.Trim().ToUpperInvariant();
            var skuTaken = await _db.ProductVariants.AnyAsync(
                v => v.Sku == sku && (variant.Id == null || v.Id != variant.Id),
                ct);
            if (skuTaken)
            {
                throw new AuthException("sku_taken", $"SKU zaten kullanılıyor: {sku}", 409);
            }
        }
    }

    private static void ApplyChildren(
        Product product,
        IReadOnlyList<Guid> applicationAreaIds,
        IReadOnlyList<AdminVariantInput> variants,
        IReadOnlyList<AdminSpecificationInput> specifications,
        IReadOnlyList<AdminMediaInput> media,
        DateTimeOffset now,
        bool replace)
    {
        if (replace)
        {
            product.ProductApplicationAreas.Clear();
            product.Specifications.Clear();

            var incomingVariantIds = variants.Where(v => v.Id.HasValue).Select(v => v.Id!.Value).ToHashSet();
            foreach (var existing in product.Variants.Where(v => !incomingVariantIds.Contains(v.Id)).ToList())
            {
                existing.IsActive = false;
                existing.UpdatedAtUtc = now;
            }

            var incomingMediaIds = media.Where(m => m.Id.HasValue).Select(m => m.Id!.Value).ToHashSet();
            foreach (var existing in product.Media.Where(m => !incomingMediaIds.Contains(m.Id)).ToList())
            {
                existing.IsActive = false;
            }
        }

        foreach (var areaId in applicationAreaIds.Distinct())
        {
            product.ProductApplicationAreas.Add(new ProductApplicationArea
            {
                ProductId = product.Id,
                ApplicationAreaId = areaId
            });
        }

        foreach (var input in variants)
        {
            var sku = input.Sku.Trim().ToUpperInvariant();
            if (input.Id is Guid existingId)
            {
                var existing = product.Variants.FirstOrDefault(v => v.Id == existingId);
                if (existing is null)
                {
                    throw new AuthException("validation_error", "Geçersiz varyant kimliği.");
                }

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
                product.Variants.Add(new ProductVariant
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
                });
            }
        }

        foreach (var spec in specifications)
        {
            product.Specifications.Add(new ProductSpecification
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                Name = spec.Name.Trim(),
                Value = spec.Value.Trim(),
                Unit = Truncate(spec.Unit, 32),
                SortOrder = spec.SortOrder
            });
        }

        foreach (var item in media)
        {
            var type = item.Type.Trim().ToUpperInvariant();
            if (!MediaTypes.All.Contains(type))
            {
                throw new AuthException("validation_error", $"Geçersiz medya tipi: {item.Type}");
            }

            if (item.Id is Guid existingId)
            {
                var existing = product.Media.FirstOrDefault(m => m.Id == existingId);
                if (existing is null)
                {
                    throw new AuthException("validation_error", "Geçersiz medya kimliği.");
                }

                existing.Type = type;
                existing.Path = item.Path.Trim();
                existing.AltText = Truncate(item.AltText, 256);
                existing.SortOrder = item.SortOrder;
                existing.IsActive = item.IsActive;
            }
            else
            {
                product.Media.Add(new ProductMedia
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    Type = type,
                    Path = item.Path.Trim(),
                    AltText = Truncate(item.AltText, 256),
                    SortOrder = item.SortOrder,
                    IsActive = item.IsActive,
                    CreatedAtUtc = now
                });
            }
        }
    }

    private async Task<ProductDetailDto> LoadDetailAsync(Guid id, CancellationToken ct)
    {
        var product = await _db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .Include(p => p.Specifications)
            .Include(p => p.Media)
            .Include(p => p.ProductApplicationAreas)
                .ThenInclude(paa => paa.ApplicationArea)
            .FirstAsync(p => p.Id == id, ct);

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
                .Where(v => v.IsActive)
                .OrderBy(v => v.Price)
                .Select(v => new ProductVariantDto(
                    v.Id, v.Sku, v.Watt, v.Lumen, v.Kelvin, v.Color, v.Dimensions, v.Price, v.Stock))
                .ToList(),
            product.IsFeatured);
    }

    private static string NormalizeSlug(string slug) =>
        (slug ?? string.Empty).Trim().ToLowerInvariant();

    private static string? Truncate(string? value, int max) =>
        string.IsNullOrWhiteSpace(value) ? null : (value.Trim().Length <= max ? value.Trim() : value.Trim()[..max]);
}
