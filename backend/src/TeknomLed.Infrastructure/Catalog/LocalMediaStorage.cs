using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TeknomLed.Application.Auth.Dtos;
using TeknomLed.Application.Catalog.Abstractions;
using TeknomLed.Application.Options;

namespace TeknomLed.Infrastructure.Catalog;

public sealed class LocalMediaStorage : IMediaStorage
{
    private readonly string _root;
    private readonly ILogger<LocalMediaStorage> _logger;

    public LocalMediaStorage(
        IOptions<MediaOptions> options,
        IHostEnvironment env,
        ILogger<LocalMediaStorage> logger)
    {
        _logger = logger;
        var configured = options.Value.LocalRoot?.Trim();
        if (string.IsNullOrWhiteSpace(configured))
        {
            configured = "App_Data/media";
        }

        _root = Path.IsPathRooted(configured)
            ? Path.GetFullPath(configured)
            : Path.GetFullPath(Path.Combine(env.ContentRootPath, configured));

        Directory.CreateDirectory(_root);
    }

    public string RootPath => _root;

    public async Task<string> SaveAsync(
        Guid productId,
        Stream content,
        string extension,
        string contentType,
        CancellationToken ct = default)
    {
        var safeExt = NormalizeExtension(extension);
        var fileName = $"{Guid.NewGuid():N}{safeExt}";
        var relative = NormalizeRelativeKey($"products/{productId:D}/{fileName}");
        var absolute = ResolveSafeAbsolute(relative);

        var dir = Path.GetDirectoryName(absolute)!;
        Directory.CreateDirectory(dir);

        await using var fs = new FileStream(
            absolute,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 81920,
            options: FileOptions.Asynchronous | FileOptions.SequentialScan);

        await content.CopyToAsync(fs, ct);
        await fs.FlushAsync(ct);

        _logger.LogInformation("Stored media {Relative} ({ContentType})", relative, contentType);
        return relative.Replace('\\', '/');
    }

    public Task DeleteAsync(string relativePath, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath) || IsLegacyPublicAsset(relativePath))
        {
            return Task.CompletedTask;
        }

        try
        {
            var absolute = ResolveSafeAbsolute(relativePath);
            if (File.Exists(absolute))
            {
                File.Delete(absolute);
            }
        }
        catch (Exception ex) when (ex is AuthException or IOException or UnauthorizedAccessException)
        {
            _logger.LogWarning(ex, "Failed to delete media file {Path}", relativePath);
        }

        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string relativePath, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath) || IsLegacyPublicAsset(relativePath))
        {
            return Task.FromResult(false);
        }

        try
        {
            var absolute = ResolveSafeAbsolute(relativePath);
            return Task.FromResult(File.Exists(absolute));
        }
        catch (AuthException)
        {
            return Task.FromResult(false);
        }
    }

    private string ResolveSafeAbsolute(string relativePath)
    {
        var relative = NormalizeRelativeKey(relativePath);
        var absolute = Path.GetFullPath(Path.Combine(_root, relative));
        var rootFull = Path.GetFullPath(_root)
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
            + Path.DirectorySeparatorChar;

        if (!absolute.StartsWith(rootFull, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(absolute, Path.GetFullPath(_root), StringComparison.OrdinalIgnoreCase))
        {
            throw new AuthException("invalid_path", "Geçersiz medya yolu.", 400);
        }

        return absolute;
    }

    private static string NormalizeRelativeKey(string path)
    {
        var trimmed = path.Replace('\\', '/').Trim().TrimStart('/');
        if (trimmed.Contains("..", StringComparison.Ordinal) ||
            trimmed.Contains(':', StringComparison.Ordinal) ||
            Path.IsPathRooted(path))
        {
            throw new AuthException("invalid_path", "Geçersiz medya yolu.", 400);
        }

        return trimmed.Replace('/', Path.DirectorySeparatorChar);
    }

    private static string NormalizeExtension(string extension)
    {
        var ext = extension.StartsWith('.') ? extension.ToLowerInvariant() : $".{extension.ToLowerInvariant()}";
        return ext is ".jpg" or ".jpeg" or ".png" or ".webp"
            ? (ext == ".jpeg" ? ".jpg" : ext)
            : throw new AuthException("unsupported_file", "Desteklenmeyen uzantı.", 415);
    }

    private static bool IsLegacyPublicAsset(string path) =>
        path.StartsWith("/assets", StringComparison.OrdinalIgnoreCase) ||
        path.StartsWith("assets/", StringComparison.OrdinalIgnoreCase);
}
