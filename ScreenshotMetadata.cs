using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace VRCX
{
    public class ScreenshotMetadata
    {
        /// <summary>
        /// Name of the application writing to the screenshot. Should be VRCX.
        /// </summary>
        public string Application { get; set; }

        /// <summary>
        /// The version of this schema. If the format changes, this number should change.
        /// </summary>
        public int Version { get; set; }

        /// <summary>
        /// The details of the user that took the picture.
        /// </summary>
        public AuthorDetail Author { get; set; }

        /// <summary>
        /// Information about the world the picture was taken in.
        /// </summary>
        public WorldDetail World { get; set; }

        /// <summary>
        /// A list of players in the world at the time the picture was taken.
        /// </summary>
        public List<PlayerDetail> Players { get; set; }

        /// <summary>
        /// If this class was serialized from a file, this should be the path to the file.
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        internal string SourceFile;

        public ScreenshotMetadata()
        {
            Application = "VRCX";
            Version = 1;
            Author = new AuthorDetail();
            World = new WorldDetail();
            Players = new List<PlayerDetail>();
        }

        public bool ContainsPlayerID(string id)
        {
            return Players.Any(p => p.Id == id);
        }

        public bool ContainsPlayerName(string playerName, bool partial, bool ignoreCase)
        {
            var comparisonType = ignoreCase ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;

            if (partial)
            {
                return Players.Any(p => p.DisplayName.IndexOf(playerName, comparisonType) != -1);
            }

            return Players.Any(p => p.DisplayName.Equals(playerName, comparisonType));
        }

        public class AuthorDetail
        {
            /// <summary>
            /// The ID of the user.
            /// </summary>
            public string Id { get; set; }

            /// <summary>
            /// The display name of the user.
            /// </summary>
            public string DisplayName { get; set; }
        }

        public class WorldDetail
        {
            /// <summary>
            /// The ID of the world.
            /// </summary>
            public string Id { get; set; }

            /// <summary>
            /// The name of the world.
            /// </summary>
            public string Name { get; set; }

            /// <summary>
            /// The full ID of the game instance.
            /// </summary>
            public string InstanceId { get; set; }
        }

        public class PlayerDetail
        {
            /// <summary>
            /// The ID of the player in the world.
            /// </summary>
            public string Id { get; set; }

            /// <summary>
            /// The display name of the player in the world.
            /// </summary>
            public string DisplayName { get; set; }
        }
    }
}
