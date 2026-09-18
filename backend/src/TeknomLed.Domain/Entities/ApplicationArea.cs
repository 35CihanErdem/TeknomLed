namespace TeknomLed.Domain.Entities;

public class ApplicationArea
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public ICollection<ProductApplicationArea> ProductApplicationAreas { get; set; } = new List<ProductApplicationArea>();
}
