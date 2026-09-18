namespace TeknomLed.Application.Catalog.Dtos;

public sealed record UploadProductMediaRequest(
    string Type,
    string? AltText,
    int? SortOrder);

public sealed record UpdateProductMediaRequest(
    string Type,
    string? AltText,
    int SortOrder,
    bool IsActive);
