using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace VRCX
{
    public class WorldDataRequestResponse
    {
        /// <summary>
        /// Gets or sets a value indicating whether the request was successful.
        /// </summary>
        [JsonProperty("ok")]
        public bool OK { get; set; }
        /// <summary>
        /// Gets or sets the error message if the request was not successful.
        /// </summary>
        [JsonProperty("error")]
        public string Error { get; set; }
        /// <summary>
        /// Gets or sets the data returned by the request.
        /// </summary>
        [JsonProperty("data")]
        public string Data { get; set; }
        /// <summary>
        /// Gets or sets the response code.
        /// </summary>
        /// <value></value>
        [JsonProperty("statusCode")]
        public int StatusCode { get; set; }
        [JsonProperty("connectionKey")]
        public string ConnectionKey { get; set; }

        public WorldDataRequestResponse(bool ok, string error, string data)
        {
            OK = ok;
            Error = error;
            Data = data;
        }
    }

    public class WorldDataRequest
    {
        [JsonProperty("requestType")]
        public string RequestType;
        [JsonProperty("connectionKey")]
        public string ConnectionKey;
        [JsonProperty("key")]
        public string Key;
        [JsonProperty("value")]
        public string Value;
    }
}
