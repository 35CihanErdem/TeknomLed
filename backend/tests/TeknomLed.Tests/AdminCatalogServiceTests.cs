using Microsoft.EntityFrameworkCore;
using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Application.Catalog;
using TeknomLed.Application.Catalog.Dtos;
using TeknomLed.Infrastructure.Catalog;
using TeknomLed.Infrastructure.Persistence;

namespace TeknomLed.Tests;

public class AdminCatalogServiceTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<(AppDbContext Db, AdminCatalogService Admin, CatalogService Public)> CreateSutsAsync()
    {
        var db = CreateDb();
        await CatalogSeed.SeedAsync(db);
        var media = new PassthroughMediaPathResolver();
        return (db, new AdminCatalogService(db, media), new CatalogService(db, media));
    }

    [Fact]
    public async Task AdminGetProducts_IncludesInactive()
    {
        var (db, admin, publicCatalog) = await CreateSutsAsync();
        await using (db)
        {
            var product = await db.Products.FirstAsync(p => p.Slug == "arc-wall");
            product.IsActive = false;
            await db.SaveChangesAsync();

            var adminList = await admin.GetProductsAsync(new AdminProductQuery { Search = "arc-wall" });
            Assert.Contains(adminList.Items, i => i.Slug == "arc-wall" && !i.IsActive);

            var publicList = await publicCatalog.GetProductsAsync(new ProductQuery());
            Assert.DoesNotContain(publicList.Items, i => i.Slug == "arc-wall");
        }
    }

    [Fact]
    public async Task PublicApi_ExcludesInactive_DetailAndRelated()
    {
        var (db, admin, publicCatalog) = await CreateSutsAsync();
        await using (db)
        {
            var categoryId = (await admin.GetCategoriesAsync()).First().Id;
            var created = await admin.CreateProductAsync(BuildCreateRequest(
                "phase9b-draft",
                categoryId,
                [],
                isActive: false));

            var list = await publicCatalog.GetProductsAsync(new ProductQuery());
            Assert.DoesNotContain(list.Items, i => i.Slug == "phase9b-draft");

            var ex = await Assert.ThrowsAsync<AuthException>(() =>
                publicCatalog.GetProductBySlugAsync("phase9b-draft"));
            Assert.Equal(404, ex.StatusCode);

            var related = await publicCatalog.GetRelatedProductsAsync("line-wall-120", 8);
            Assert.DoesNotContain(related, r => r.Id == created.Id);
        }
    }

    [Fact]
    public async Task CreateValidProduct_PersistsAreasVariantsSpecs()
    {
        var (db, admin, _) = await CreateSutsAsync();
        await using (db)
        {
            var categoryId = (await admin.GetCategoriesAsync()).First(c => c.IsActive).Id;
            var areaIds = (await admin.GetApplicationAreasAsync()).Take(2).Select(a => a.Id).ToList();

            var created = await admin.CreateProductAsync(BuildCreateRequest(
                "phase9b-valid",
                categoryId,
                areaIds,
                isActive: true));

            Assert.Equal("phase9b-valid", created.Slug);
            Assert.Equal(2, created.ApplicationAreaIds.Count);
            Assert.Single(created.Variants);
            Assert.Contains(created.Specifications, s => s.Name == "IP" && s.Value == "IP65");

            var loaded = await admin.GetProductByIdAsync(created.Id);
            Assert.Equal(created.Id, loaded.Id);
            Assert.Equal(areaIds.OrderBy(x => x), loaded.ApplicationAreaIds.OrderBy(x => x));
        }
    }

    [Fact]
    public async Task DuplicateSlug_Rejected()
    {
        var (db, admin, _) = await CreateSutsAsync();
        await using (db)
        {
            var categoryId = (await admin.GetCategoriesAsync()).First().Id;
            var request = BuildCreateRequest("line-wall-120", categoryId, [], isActive: false);
            var ex = await Assert.ThrowsAsync<AuthException>(() => admin.CreateProductAsync(request));
            Assert.Equal("slug_taken", ex.Code);
            Assert.Equal(409, ex.StatusCode);
        }
    }

    [Fact]
    public async Task InvalidCategory_Rejected()
    {
        var (db, admin, _) = await CreateSutsAsync();
        await using (db)
        {
            var request = BuildCreateRequest("bad-category-prod", Guid.NewGuid(), [], isActive: false);
            var ex = await Assert.ThrowsAsync<AuthException>(() => admin.CreateProductAsync(request));
            Assert.Equal("validation_error", ex.Code);
            Assert.Contains("kategori", ex.Message, StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public async Task VariantValidation_RejectsNegativeStockAndPrice()
    {
        var (db, admin, _) = await CreateSutsAsync();
        await using (db)
        {
            var categoryId = (await admin.GetCategoriesAsync()).First().Id;

            var negStock = BuildCreateRequest("neg-stock", categoryId, [], isActive: false) with
            {
                Variants = [new AdminVariantInput(null, "NEG-STK", 10, 100, 3000, null, null, 100m, -1, true)]
            };
            var stockEx = await Assert.ThrowsAsync<AuthException>(() => admin.CreateProductAsync(negStock));
            Assert.Equal("validation_error", stockEx.Code);

            var negPrice = BuildCreateRequest("neg-price", categoryId, [], isActive: false) with
            {
                Variants = [new AdminVariantInput(null, "NEG-PRC", 10, 100, 3000, null, null, -5m, 1, true)]
            };
            var priceEx = await Assert.ThrowsAsync<AuthException>(() => admin.CreateProductAsync(negPrice));
            Assert.Equal("validation_error", priceEx.Code);
        }
    }

    [Fact]
    public async Task UpdateProduct_ChangesFieldsAndActivates()
    {
        var (db, admin, publicCatalog) = await CreateSutsAsync();
        await using (db)
        {
            var categoryId = (await admin.GetCategoriesAsync()).First().Id;
            var areaId = (await admin.GetApplicationAreasAsync()).First().Id;
            var created = await admin.CreateProductAsync(BuildCreateRequest(
                "phase9b-update",
                categoryId,
                [areaId],
                isActive: false));

            var updated = await admin.UpdateProductAsync(created.Id, new UpdateProductRequest(
                "phase9b-update",
                "PHASE9B UPDATED",
                "Updated short",
                "Longer description",
                categoryId,
                true,
                true,
                [areaId],
                [new AdminVariantInput(created.Variants[0].Id, "P9B-UPD-1", 12, 600, 4000, "Black", "100mm", 1500m, 8, true)],
                [new AdminSpecificationInput(null, "Material", "Aluminium", null, 0)],
                []));

            Assert.Equal("PHASE9B UPDATED", updated.Name);
            Assert.True(updated.IsActive);
            Assert.True(updated.IsFeatured);
            Assert.Equal(1500m, updated.Variants[0].Price);

            var publicDetail = await publicCatalog.GetProductBySlugAsync("phase9b-update");
            Assert.Equal("PHASE9B UPDATED", publicDetail.Name);
            Assert.Contains(publicDetail.Specifications, s => s.Name == "Material");
        }
    }

    [Fact]
    public async Task DeactivateProduct_HidesFromPublic_StillInAdmin()
    {
        var (db, admin, publicCatalog) = await CreateSutsAsync();
        await using (db)
        {
            var categoryId = (await admin.GetCategoriesAsync()).First().Id;
            var created = await admin.CreateProductAsync(BuildCreateRequest(
                "phase9b-deact",
                categoryId,
                [],
                isActive: true));

            await admin.DeactivateProductAsync(created.Id);

            var adminItem = await admin.GetProductByIdAsync(created.Id);
            Assert.False(adminItem.IsActive);

            var ex = await Assert.ThrowsAsync<AuthException>(() =>
                publicCatalog.GetProductBySlugAsync("phase9b-deact"));
            Assert.Equal(404, ex.StatusCode);
        }
    }

    [Fact]
    public async Task ApplicationArea_CreateRejectsDuplicateSlug()
    {
        var (db, admin, _) = await CreateSutsAsync();
        await using (db)
        {
            var existing = (await admin.GetApplicationAreasAsync()).First();
            var ex = await Assert.ThrowsAsync<AuthException>(() =>
                admin.CreateApplicationAreaAsync(new CreateApplicationAreaRequest(
                    existing.Slug, "Other Name", 99, true)));
            Assert.Equal("slug_taken", ex.Code);
            Assert.Equal(409, ex.StatusCode);
        }
    }

    [Fact]
    public async Task Category_CannotDeactivateWhileActiveProductsExist()
    {
        var (db, admin, _) = await CreateSutsAsync();
        await using (db)
        {
            var category = (await admin.GetCategoriesAsync()).First(c => c.IsActive);
            var hasActive = await db.Products.AnyAsync(p => p.CategoryId == category.Id && p.IsActive);
            Assert.True(hasActive);

            var ex = await Assert.ThrowsAsync<AuthException>(() =>
                admin.UpdateCategoryAsync(category.Id, new UpdateCategoryRequest(
                    category.Slug, category.Name, category.Description, category.SortOrder, false)));
            Assert.Equal("category_in_use", ex.Code);
            Assert.Equal(409, ex.StatusCode);
        }
    }

    private static CreateProductRequest BuildCreateRequest(
        string slug,
        Guid categoryId,
        IReadOnlyList<Guid> areaIds,
        bool isActive) =>
        new(
            slug,
            slug.ToUpperInvariant(),
            "Short description",
            null,
            categoryId,
            false,
            isActive,
            areaIds,
            [new AdminVariantInput(null, $"SKU-{slug.ToUpperInvariant()}", 10, 500, 3000, null, null, 999m, 5, true)],
            [new AdminSpecificationInput(null, "IP", "IP65", null, 0)],
            []);
}
