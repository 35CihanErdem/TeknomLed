namespace TeknomLed.Domain.Entities;

/// <summary>
/// IsActive = publicly visible (published). Inactive products are drafts / hidden from the storefront.
/// </summary>
public class Product
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CategoryId { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }

    public Category Category { get; set; } = null!;
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<ProductSpecification> Specifications { get; set; } = new List<ProductSpecification>();
    public ICollection<ProductMedia> Media { get; set; } = new List<ProductMedia>();
    public ICollection<ProductApplicationArea> ProductApplicationAreas { get; set; } = new List<ProductApplicationArea>();
}
