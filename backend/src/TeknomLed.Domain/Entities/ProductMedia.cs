namespace TeknomLed.Domain.Entities;

/// <summary>
/// Stores logical path/URL metadata only — never image binaries.
/// Object storage / CDN resolution is handled outside the domain.
/// </summary>
public class ProductMedia
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; }

    public Product Product { get; set; } = null!;
}
