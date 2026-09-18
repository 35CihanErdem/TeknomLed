namespace TeknomLed.Domain.Entities;

public class ProductVariant
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public int? Watt { get; set; }
    public int? Lumen { get; set; }
    public int? Kelvin { get; set; }
    public string? Color { get; set; }
    public string? Dimensions { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }

    public Product Product { get; set; } = null!;
}
