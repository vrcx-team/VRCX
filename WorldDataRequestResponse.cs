using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VRCX
{
    public class WorldDataRequestResponse
    {
        /// <summary>
        /// Gets or sets a value indicating whether the request was successful.
        /// </summary>
        public bool OK { get; set; }
        /// <summary>
        /// Gets or sets the error message if the request was not successful.
        /// </summary>
        public string Error { get; set; }
        /// <summary>
        /// Gets or sets the data returned by the request.
        /// </summary>
        public string Data { get; set; }
        /// <summary>
        /// Gets or sets the response code.
        /// </summary>
        /// <value></value>
        public int StatusCode { get; set; }

        public WorldDataRequestResponse(bool ok, string error, string data)
        {
            OK = ok;
            Error = error;
            Data = data;
        }
    }
}
