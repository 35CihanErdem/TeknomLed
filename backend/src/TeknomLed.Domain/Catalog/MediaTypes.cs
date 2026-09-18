namespace TeknomLed.Domain.Catalog;

public static class MediaTypes
{
    public const string Default = "DEFAULT";
    public const string Gallery = "GALLERY";
    public const string LightOn = "LIGHT_ON";
    public const string LightOff = "LIGHT_OFF";
    public const string Application = "APPLICATION";
    public const string Document = "DOCUMENT";
    public const string Video = "VIDEO";

    public static readonly string[] All =
    [
        Default,
        Gallery,
        LightOn,
        LightOff,
        Application,
        Document,
        Video
    ];
}
