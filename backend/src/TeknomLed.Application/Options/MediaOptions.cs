namespace TeknomLed.Application.Options;

public sealed class MediaOptions
{
    public const string SectionName = "Media";

    /// <summary>Local | (future) S3</summary>
    public string Provider { get; set; } = "Local";

    /// <summary>
    /// Root directory for Local provider. Relative paths resolve against ContentRoot.
    /// Do not use machine-specific absolute paths in tracked config.
    /// </summary>
    public string LocalRoot { get; set; } = "App_Data/media";

    /// <summary>Public URL prefix served by the API (e.g. /media).</summary>
    public string PublicBasePath { get; set; } = "/media";

    /// <summary>Maximum accepted image upload size in bytes.</summary>
    public long MaxImageBytes { get; set; } = 5 * 1024 * 1024;
}
