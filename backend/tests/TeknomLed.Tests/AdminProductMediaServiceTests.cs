using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Application.Catalog;
using TeknomLed.Application.Catalog.Dtos;
using TeknomLed.Application.Options;
using TeknomLed.Domain.Catalog;
using TeknomLed.Infrastructure.Catalog;
using TeknomLed.Infrastructure.Persistence;

namespace TeknomLed.Tests;

public class AdminProductMediaServiceTests : IDisposable
{
    private readonly string _tempRoot;
    private readonly AppDbContext _db;
    private readonly LocalMediaStorage _storage;
    private readonly ConfiguredMediaPathResolver _paths;
    private readonly AdminProductMediaService _media;
    private readonly AdminCatalogService _admin;
    private readonly CatalogService _public;

    public AdminProductMediaServiceTests()
    {
        _tempRoot = Path.Combine(Path.GetTempPath(), "teknomled-media-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempRoot);

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        var mediaOptions = Options.Create(new MediaOptions
        {
            Provider = "Local",
            LocalRoot = _tempRoot,
            PublicBasePath = "/media",
            MaxImageBytes = 1024 * 100
        });

        _storage = new LocalMediaStorage(
            mediaOptions,
            new TestHostEnvironment(Path.GetTempPath()),
            NullLogger<LocalMediaStorage>.Instance);
        _paths = new ConfiguredMediaPathResolver(mediaOptions);
        _media = new AdminProductMediaService(
            _db,
            _storage,
            _paths,
            mediaOptions,
            NullLogger<AdminProductMediaService>.Instance);
        _admin = new AdminCatalogService(_db, _paths);
        _public = new CatalogService(_db, _paths);
    }

    public void Dispose()
    {
        _db.Dispose();
        try
        {
            if (Directory.Exists(_tempRoot))
            {
                Directory.Delete(_tempRoot, recursive: true);
            }
        }
        catch
        {
            // best-effort cleanup
        }
    }

    [Fact]
    public async Task Upload_ValidJpeg_AttachesToProduct_AndResolvesPublicUrl()
    {
        await CatalogSeed.SeedAsync(_db);
        var productId = await CreateDraftProductAsync();

        await using var jpeg = CreateJpegStream();
        var dto = await _media.UploadAsync(
            productId,
            jpeg,
            "photo.jpg",
            "image/jpeg",
            jpeg.Length,
            MediaTypes.Default,
            "Ana görsel",
            0);

        Assert.Equal(MediaTypes.Default, dto.Type);
        Assert.StartsWith("/media/products/", dto.Url, StringComparison.OrdinalIgnoreCase);
        Assert.EndsWith(".jpg", dto.Url, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("Ana görsel", dto.AltText);

        var row = await _db.ProductMedia.SingleAsync(m => m.Id == dto.Id);
        Assert.Equal(productId, row.ProductId);
        Assert.False(row.Path.Contains('\\'));
        Assert.True(await _storage.ExistsAsync(row.Path));
    }

    [Fact]
    public async Task Upload_UnsupportedExtension_Rejected()
    {
        await CatalogSeed.SeedAsync(_db);
        var productId = await CreateDraftProductAsync();
        await using var stream = new MemoryStream("not-an-image"u8.ToArray());

        var ex = await Assert.ThrowsAsync<AuthException>(() =>
            _media.UploadAsync(productId, stream, "evil.exe", "application/octet-stream", stream.Length, MediaTypes.Default, null, null));
        Assert.Equal(415, ex.StatusCode);
    }

    [Fact]
    public async Task Upload_EmptyFile_Rejected()
    {
        await CatalogSeed.SeedAsync(_db);
        var productId = await CreateDraftProductAsync();
        await using var stream = new MemoryStream();

        var ex = await Assert.ThrowsAsync<AuthException>(() =>
            _media.UploadAsync(productId, stream, "empty.jpg", "image/jpeg", 0, MediaTypes.Default, null, null));
        Assert.Equal("empty_file", ex.Code);
    }

    [Fact]
    public async Task Upload_Oversized_Rejected()
    {
        await CatalogSeed.SeedAsync(_db);
        var productId = await CreateDraftProductAsync();
        var bytes = new byte[1024 * 100 + 10];
        bytes[0] = 0xFF;
        bytes[1] = 0xD8;
        bytes[2] = 0xFF;
        await using var stream = new MemoryStream(bytes);

        var ex = await Assert.ThrowsAsync<AuthException>(() =>
            _media.UploadAsync(productId, stream, "big.jpg", "image/jpeg", stream.Length, MediaTypes.Default, null, null));
        Assert.Equal("file_too_large", ex.Code);
    }

    [Fact]
    public async Task Delete_RemovesMetadata_AndBlocksCrossProduct()
    {
        await CatalogSeed.SeedAsync(_db);
        var productA = await CreateDraftProductAsync("media-a");
        var productB = await CreateDraftProductAsync("media-b");

        await using var jpeg = CreateJpegStream();
        var uploaded = await _media.UploadAsync(
            productA, jpeg, "a.jpg", "image/jpeg", jpeg.Length, MediaTypes.Gallery, null, null);

        var cross = await Assert.ThrowsAsync<AuthException>(() =>
            _media.DeleteAsync(productB, uploaded.Id));
        Assert.Equal(404, cross.StatusCode);
        Assert.True(await _db.ProductMedia.AnyAsync(m => m.Id == uploaded.Id));

        await _media.DeleteAsync(productA, uploaded.Id);
        Assert.False(await _db.ProductMedia.AnyAsync(m => m.Id == uploaded.Id));
    }

    [Fact]
    public async Task InactiveProduct_MediaDoesNotExposeProductPublicly()
    {
        await CatalogSeed.SeedAsync(_db);
        var productId = await CreateDraftProductAsync();
        await using var jpeg = CreateJpegStream();
        await _media.UploadAsync(productId, jpeg, "d.jpg", "image/jpeg", jpeg.Length, MediaTypes.Default, null, null);

        var product = await _db.Products.SingleAsync(p => p.Id == productId);
        Assert.False(product.IsActive);

        var list = await _public.GetProductsAsync(new ProductQuery());
        Assert.DoesNotContain(list.Items, i => i.Id == productId);
    }

    [Fact]
    public async Task LightOnOff_MetadataPreserved_AndUrlResolved()
    {
        await CatalogSeed.SeedAsync(_db);
        var productId = await CreateDraftProductAsync();

        await using var off = CreateJpegStream();
        var offDto = await _media.UploadAsync(
            productId, off, "off.jpg", "image/jpeg", off.Length, MediaTypes.LightOff, "kapalı", 1);

        await using var on = CreateJpegStream();
        var onDto = await _media.UploadAsync(
            productId, on, "on.jpg", "image/jpeg", on.Length, MediaTypes.LightOn, "açık", 2);

        Assert.Equal(MediaTypes.LightOff, offDto.Type);
        Assert.Equal(MediaTypes.LightOn, onDto.Type);
        Assert.NotEqual(offDto.Url, onDto.Url);
        Assert.StartsWith("/media/", offDto.Url);
        Assert.StartsWith("/media/", onDto.Url);

        var updated = await _media.UpdateAsync(
            productId,
            onDto.Id,
            new UpdateProductMediaRequest(MediaTypes.LightOn, "açık-rev", 5, true));
        Assert.Equal("açık-rev", updated.AltText);
        Assert.Equal(5, updated.SortOrder);
    }

    [Fact]
    public void MediaPathResolver_MapsStorageKey_AndPassesAssets()
    {
        Assert.Equal("/media/products/x/a.jpg", _paths.ResolveUrl("products/x/a.jpg"));
        Assert.Equal("/assets/images/home/product.jpg", _paths.ResolveUrl("/assets/images/home/product.jpg"));
    }

    private async Task<Guid> CreateDraftProductAsync(string slug = "media-draft")
    {
        var categoryId = (await _admin.GetCategoriesAsync()).First().Id;
        var created = await _admin.CreateProductAsync(new CreateProductRequest(
            slug,
            slug.ToUpperInvariant(),
            "Short",
            null,
            categoryId,
            false,
            false,
            [],
            [new AdminVariantInput(null, $"SKU-{slug.ToUpperInvariant()}", 10, 100, 3000, null, null, 100m, 1, true)],
            [],
            []));
        return created.Id;
    }

    private static MemoryStream CreateJpegStream()
    {
        // Minimal JPEG SOI + EOI with padding so length > 0 and magic matches.
        var bytes = new byte[]
        {
            0xFF, 0xD8, 0xFF, 0xD9, 0x00, 0x01, 0x02, 0x03
        };
        return new MemoryStream(bytes);
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public TestHostEnvironment(string contentRoot) => ContentRootPath = contentRoot;

        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "Tests";
        public string ContentRootPath { get; set; }
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
