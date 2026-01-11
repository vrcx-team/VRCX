using System.Text.Json.Serialization;

namespace VRCX;

public class OverlayMessage
{
    public OverlayMessageType Type { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? FunctionName { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] 
    public string? Data { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] 
    public OverlayVars? OverlayVars { get; set; }
}