namespace TeknomLed.Domain.Entities;

public class ProductApplicationArea
{
    public Guid ProductId { get; set; }
    public Guid ApplicationAreaId { get; set; }

    public Product Product { get; set; } = null!;
    public ApplicationArea ApplicationArea { get; set; } = null!;
}
