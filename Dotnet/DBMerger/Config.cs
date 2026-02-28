namespace DBMerger
{
    public record Config(
    string NewDBPath,
    string OldDBPath,
    bool Debug,
    bool ImportConfig
    );
}
