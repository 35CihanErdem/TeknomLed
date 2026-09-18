using Microsoft.EntityFrameworkCore;
using TeknomLed.Application.Catalog;
using TeknomLed.Application.Catalog.Dtos;
using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Infrastructure.Catalog;
using TeknomLed.Infrastructure.Persistence;

namespace TeknomLed.Tests;

public class CatalogServiceTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<(AppDbContext Db, CatalogService Sut)> CreateSutAsync()
    {
        var db = CreateDb();
        await CatalogSeed.SeedAsync(db);
        var sut = new CatalogService(db, new PassthroughMediaPathResolver());
        return (db, sut);
    }

    [Fact]
    public async Task GetProducts_ReturnsSeededDevCatalog()
    {
        var (db, sut) = await CreateSutAsync();
        await using (db)
        {
            var result = await sut.GetProductsAsync(new ProductQuery { Page = 1, PageSize = 24 });
            Assert.Equal(12, result.TotalItems);
            Assert.Equal(12, result.Items.Count);
            Assert.Equal(1, result.Page);
            Assert.True(result.TotalPages >= 1);
        }
    }

    [Fact]
    public async Task GetProducts_PaginatesAndBoundsPageSize()
    {
        var (db, sut) = await CreateSutAsync();
        await using (db)
        {
            var page1 = await sut.GetProductsAsync(new ProductQuery { Page = 1, PageSize = 5 });
            Assert.Equal(5, page1.Items.Count);
            Assert.Equal(12, page1.TotalItems);
            Assert.Equal(3, page1.TotalPages);

            var huge = await sut.GetProductsAsync(new ProductQuery { Page = 1, PageSize = 999999 });
            Assert.True(huge.PageSize <= CatalogService.MaxPageSize);
            Assert.True(huge.Items.Count <= CatalogService.MaxPageSize);
        }
    }

    [Fact]
    public async Task GetProductBySlug_ReturnsDetailWithVariants()
    {
        var (db, sut) = await CreateSutAsync();
        await using (db)
        {
            var detail = await sut.GetProductBySlugAsync("line-wall-120");
            Assert.Equal("LINE WALL 120", detail.Name);
            Assert.True(detail.Variants.Count >= 2);
            Assert.Contains(detail.Media, m => m.Type == "DEFAULT");
            Assert.Contains(detail.Specifications, s => s.Name == "IP" && s.Value == "IP65");
        }
    }

    [Fact]
    public async Task GetProductBySlug_Invalid_ThrowsNotFound()
    {
        var (db, sut) = await CreateSutAsync();
        await using (db)
        {
            var ex = await Assert.ThrowsAsync<AuthException>(() => sut.GetProductBySlugAsync("missing-product"));
            Assert.Equal("not_found", ex.Code);
            Assert.Equal(404, ex.StatusCode);
        }
    }

    [Fact]
    public async Task GetProducts_FiltersByCategoryKelvinIpAndPrice()
    {
        var (db, sut) = await CreateSutAsync();
        await using (db)
        {
            var byCategory = await sut.GetProductsAsync(new ProductQuery { Category = "duvar-aplikleri" });
            Assert.All(byCategory.Items, i => Assert.Equal("duvar-aplikleri", i.Category.Slug));

            var byKelvin = await sut.GetProductsAsync(new ProductQuery { Kelvin = [6500] });
            Assert.All(byKelvin.Items, i => Assert.Contains(6500, i.Kelvins));

            var byIp = await sut.GetProductsAsync(new ProductQuery { Ip = ["IP67"] });
            Assert.All(byIp.Items, i => Assert.Equal("IP67", i.IpRating));

            var byPrice = await sut.GetProductsAsync(new ProductQuery { PriceRanges = ["5000+"] });
            Assert.All(byPrice.Items, i => Assert.True(i.StartingPrice > 5000));
        }
    }

    [Fact]
    public async Task GetProducts_FiltersByApplicationArea()
    {
        var (db, sut) = await CreateSutAsync();
        await using (db)
        {
            var result = await sut.GetProductsAsync(new ProductQuery { ApplicationAreas = ["bahce"] });
            Assert.NotEmpty(result.Items);
            Assert.All(result.Items, i => Assert.Contains("Bahçe", i.ApplicationAreas));
        }
    }

    [Fact]
    public async Task InactiveProducts_AreNotPublic()
    {
        var (db, sut) = await CreateSutAsync();
        await using (db)
        {
            var product = await db.Products.FirstAsync(p => p.Slug == "arc-wall");
            product.IsActive = false;
            await db.SaveChangesAsync();

            var list = await sut.GetProductsAsync(new ProductQuery());
            Assert.DoesNotContain(list.Items, i => i.Slug == "arc-wall");

            var ex = await Assert.ThrowsAsync<AuthException>(() => sut.GetProductBySlugAsync("arc-wall"));
            Assert.Equal("not_found", ex.Code);
        }
    }

    [Fact]
    public async Task FeaturedAndRelated_Work()
    {
        var (db, sut) = await CreateSutAsync();
        await using (db)
        {
            var featured = await sut.GetFeaturedProductsAsync(8);
            Assert.NotEmpty(featured);
            Assert.All(featured, i => Assert.True(i.Featured));

            var related = await sut.GetRelatedProductsAsync("line-wall-120", 3);
            Assert.True(related.Count <= 3);
            Assert.DoesNotContain(related, r => r.Slug == "line-wall-120");
        }
    }

    [Fact]
    public async Task AdminCreate_RequiresUniqueSlug_AndDeactivateHides()
    {
        var db = CreateDb();
        await using (db)
        {
            await CatalogSeed.SeedAsync(db);
            var admin = new AdminCatalogService(db, new PassthroughMediaPathResolver());
            var catalog = new CatalogService(db, new PassthroughMediaPathResolver());

            var categoryId = (await catalog.GetCategoriesAsync()).First().Id;
            var areaId = (await catalog.GetApplicationAreasAsync()).First().Id;

            var created = await admin.CreateProductAsync(new CreateProductRequest(
                "dev-test-fixture",
                "DEV TEST FIXTURE",
                "Test only",
                null,
                categoryId,
                false,
                true,
                [areaId],
                [new AdminVariantInput(null, "DEV-TEST-SKU-1", 10, 500, 3000, null, null, 999m, 5, true)],
                [new AdminSpecificationInput(null, "IP", "IP65", null, 0)],
                [new AdminMediaInput(null, "DEFAULT", "/assets/images/home/product-wall.jpg", "test", 0, true)]));

            Assert.Equal("dev-test-fixture", created.Slug);

            await admin.DeactivateProductAsync(created.Id);
            var ex = await Assert.ThrowsAsync<AuthException>(() => catalog.GetProductBySlugAsync("dev-test-fixture"));
            Assert.Equal("not_found", ex.Code);
        }
    }
}
