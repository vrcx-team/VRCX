namespace DBMerger
{
    public class Config(string newDBPath, string oldDBPath, bool debug, bool importConfig)
    {
        public string NewDBPath { get; } = newDBPath;
        public string OldDBPath { get; } = oldDBPath;
        public bool Debug { get; } = debug;
        public bool ImportConfig { get; } = importConfig;
    }
}
