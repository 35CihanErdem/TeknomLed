namespace TeknomLed.Domain.Entities;

public class ProductSpecification
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public int SortOrder { get; set; }

    public Product Product { get; set; } = null!;
}
