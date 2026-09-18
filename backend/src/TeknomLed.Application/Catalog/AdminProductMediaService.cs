using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Application.Catalog.Abstractions;
using TeknomLed.Application.Catalog.Dtos;
using TeknomLed.Application.Options;
using TeknomLed.Application.Persistence;
using TeknomLed.Domain.Entities;

namespace TeknomLed.Application.Catalog;

public sealed class AdminProductMediaService : IAdminProductMediaService
{
    private readonly IAppDbContext _db;
    private readonly IMediaStorage _storage;
    private readonly IMediaPathResolver _paths;
    private readonly MediaOptions _options;
    private readonly ILogger<AdminProductMediaService> _logger;

    public AdminProductMediaService(
        IAppDbContext db,
        IMediaStorage storage,
        IMediaPathResolver paths,
        IOptions<MediaOptions> options,
        ILogger<AdminProductMediaService> logger)
    {
        _db = db;
        _storage = storage;
        _paths = paths;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<ProductMediaDto> UploadAsync(
        Guid productId,
        Stream content,
        string fileName,
        string? contentType,
        long length,
        string type,
        string? altText,
        int? sortOrder,
        CancellationToken ct = default)
    {
        var productExists = await _db.Products.AnyAsync(p => p.Id == productId, ct);
        if (!productExists)
        {
            throw new AuthException("not_found", "Ürün bulunamadı.", 404);
        }

        var mediaType = ProductImageValidator.NormalizeType(type);

        // Buffer header for magic-byte checks without consuming the whole stream twice inefficiently.
        await using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, ct);
        if (buffer.Length == 0)
        {
            throw new AuthException("empty_file", "Dosya boş olamaz.", 400);
        }

        length = buffer.Length;
        buffer.Position = 0;
        var headerBytes = new byte[16];
        var read = buffer.Read(headerBytes, 0, headerBytes.Length);
        buffer.Position = 0;

        var extension = ProductImageValidator.ValidateAndGetExtension(
            fileName,
            contentType,
            length,
            _options.MaxImageBytes,
            headerBytes.AsSpan(0, read));

        var mime = string.IsNullOrWhiteSpace(contentType)
            ? extension switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                _ => "image/jpeg"
            }
            : contentType.Split(';')[0].Trim();

        string relativePath;
        try
        {
            relativePath = await _storage.SaveAsync(productId, buffer, extension, mime, ct);
        }
        catch (AuthException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Media storage save failed for product {ProductId}", productId);
            throw new AuthException("storage_error", "Dosya kaydedilemedi.", 500);
        }

        var maxSort = await _db.ProductMedia
            .Where(m => m.ProductId == productId)
            .Select(m => (int?)m.SortOrder)
            .MaxAsync(ct) ?? -1;

        var entity = new ProductMedia
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            Type = mediaType,
            Path = relativePath,
            AltText = Truncate(altText, 256),
            SortOrder = sortOrder ?? maxSort + 1,
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        try
        {
            _db.ProductMedia.Add(entity);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DB save failed after media upload; cleaning storage {Path}", relativePath);
            await _storage.DeleteAsync(relativePath, ct);
            throw new AuthException("storage_error", "Medya kaydı oluşturulamadı.", 500);
        }

        return Map(entity);
    }

    public async Task<ProductMediaDto> UpdateAsync(
        Guid productId,
        Guid mediaId,
        UpdateProductMediaRequest request,
        CancellationToken ct = default)
    {
        var entity = await _db.ProductMedia
            .FirstOrDefaultAsync(m => m.Id == mediaId && m.ProductId == productId, ct)
            ?? throw new AuthException("not_found", "Medya bulunamadı.", 404);

        entity.Type = ProductImageValidator.NormalizeType(request.Type);
        entity.AltText = Truncate(request.AltText, 256);
        entity.SortOrder = request.SortOrder;
        entity.IsActive = request.IsActive;

        await _db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task DeleteAsync(Guid productId, Guid mediaId, CancellationToken ct = default)
    {
        var entity = await _db.ProductMedia
            .FirstOrDefaultAsync(m => m.Id == mediaId && m.ProductId == productId, ct)
            ?? throw new AuthException("not_found", "Medya bulunamadı.", 404);

        var path = entity.Path;
        _db.ProductMedia.Remove(entity);
        await _db.SaveChangesAsync(ct);

        try
        {
            await _storage.DeleteAsync(path, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Media file cleanup failed for {Path}", path);
        }
    }

    private ProductMediaDto Map(ProductMedia entity) =>
        new(entity.Id, entity.Type, _paths.ResolveUrl(entity.Path), entity.AltText, entity.SortOrder);

    private static string? Truncate(string? value, int max) =>
        string.IsNullOrWhiteSpace(value)
            ? null
            : (value.Trim().Length <= max ? value.Trim() : value.Trim()[..max]);
}
