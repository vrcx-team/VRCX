using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace VRCX;

// See http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html 4.2.3
// Basic PNG Chunk Structure: Length(int, 4 bytes) | Type (string, 4 bytes) | chunk data (x bytes) | 32-bit CRC code (4 bytes)
public class PNGFile : IDisposable
{
    private FileStream fileStream;
    private List<PNGChunk> metadataChunkCache = new List<PNGChunk>();
    
    private static readonly byte[] pngSignatureBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
    private const int MAX_CHUNKS_TO_READ = 16;
    private const int CHUNK_FIELD_SIZE = 4;
    private const int CHUNK_NONDATA_SIZE = 12;

    /// <summary>
    /// Initializes a new instance of <see cref="PNGFile"/> class with the specified file path.
    /// Opens the PNG file for reading and writing.
    /// </summary>
    /// <param name="filePath">The path to the PNG file to open for reading and writing.</param>
    /// <param name="writeAccess">Open file with write permissions.</param>
    public PNGFile(string filePath, bool writeAccess)
    {
        fileStream = new FileStream(filePath, FileMode.Open, writeAccess ? FileAccess.ReadWrite : FileAccess.Read, FileShare.ReadWrite, 4096);
    }
    
    public PNGFile(string filePath, int bufferSize)
    {
        fileStream = new FileStream(filePath, FileMode.Open, FileAccess.ReadWrite, FileShare.ReadWrite, bufferSize);
    }

    /// <summary>
    /// Retrieves the first PNG chunk of the specified type from the file, or null if none were found.
    /// </summary>
    /// <param name="chunkTypeFilter">The type of chunk to search for.</param>
    /// <returns>The first chunk of the specified type, or null if none were found.</returns>
    public PNGChunk? GetChunk(PNGChunkTypeFilter chunkTypeFilter)
    {
        ReadAndCacheMetadata();
        
        var chunk = metadataChunkCache.FirstOrDefault((chunk) => chunkTypeFilter.HasFlag(chunk.ChunkTypeEnum));
        if (chunk == null || chunk.IsZero())
            return null;

        return chunk;
    }
    
    /// <summary>
    /// Retrieves a PNG chunk of the specified type by searching from the last 8KB of the file to the end of the file.
    /// </summary>
    /// <param name="chunkTypeFilter">The type of chunk to search for.</param>
    /// <returns>The first chunk of the specified type found, or <c>null</c> if no such chunk exists or the chunk is empty.</returns>
    /// <remarks>
    /// This method is only intended to be used to find chunks added by legacy vrc mods that append data at the end of the file.
    /// </remarks>
    public PNGChunk? GetChunkReverse(PNGChunkTypeFilter chunkTypeFilter)
    {
        var chunk = ReadChunkReverse(chunkTypeFilter);
        if (chunk == null || chunk.IsZero())
            return null;

        return chunk;
    }
    
    /// <summary>
    /// Retrieves a list of all PNG metadata chunks read from the file, in order.
    /// </summary>
    /// <returns>A list of <see cref="PNGChunk"/> objects, which represent PNG metadata chunks.</returns>
    /// <remarks>
    /// If the metadata cache is empty, it will first populate the cache by reading from the file.
    /// </remarks>
    public List<PNGChunk> GetChunks()
    {
        ReadAndCacheMetadata();
        
        return metadataChunkCache.ToList();
    }

    /// <summary>
    /// Writes a new PNG chunk at the position immediately following the last cached PNG metadata chunk(before the first IDAT).
    /// </summary>
    /// <param name="chunk">The PNGChunk to write to the file stream.</param>
    /// <returns>True if the chunk was successfully written, otherwise false if the metadata cache is empty or the last chunk is invalid.</returns>
    public bool WriteChunk(PNGChunk chunk)
    {
        ReadAndCacheMetadata();
        
        if (metadataChunkCache.Count == 0)
            return false;
        
        var lastChunk = metadataChunkCache.LastOrDefault();
        if (lastChunk.IsZero())
            return false;

        int newChunkPosition = lastChunk.Index + CHUNK_NONDATA_SIZE + lastChunk.Length;
        fileStream.Seek((long)newChunkPosition, SeekOrigin.Begin);
        
        byte[] fileBytes = new byte[fileStream.Length - newChunkPosition];
        fileStream.ReadExactly(fileBytes, 0, (int)(fileStream.Length - newChunkPosition));
        fileStream.Seek(newChunkPosition, SeekOrigin.Begin);
        
        // Write new chunk, append rest of file
        var chunkBytes = chunk.GetBytes();
        fileStream.SetLength(fileStream.Length + CHUNK_NONDATA_SIZE + chunk.Length);
        fileStream.Write(chunkBytes, 0, chunkBytes.Length);
        fileStream.Write(fileBytes, 0, fileBytes.Length);
        
        return true;
    }

    /// <summary>
    /// Deletes a PNG chunk from the file.
    /// </summary>
    /// <param name="chunk">The PNG chunk to delete. Needs a valid index set.</param>
    /// <returns>True if the chunk was successfully deleted, otherwise false.</returns>
    public bool DeleteChunk(PNGChunk chunk)
    {
        if (!chunk.ExistsInFile(fileStream))
            return false;
        
        int bufferSize = 128 * 1024;
        int deleteStart = chunk.Index;
        int deleteLength = chunk.Length + CHUNK_NONDATA_SIZE;

        long sourcePos = deleteStart + deleteLength;
        long destPos = deleteStart;
        byte[] buffer = new byte[bufferSize];

        // Copy everything after the deleted section forward
        while (sourcePos < fileStream.Length)
        {
            fileStream.Seek(sourcePos, SeekOrigin.Begin);
            int bytesRead = fileStream.Read(buffer, 0, Math.Min(buffer.Length, (int)(fileStream.Length - sourcePos)));

            if (bytesRead == 0)
                break;

            fileStream.Seek(destPos, SeekOrigin.Begin);
            fileStream.Write(buffer, 0, bytesRead);

            sourcePos += bytesRead;
            destPos += bytesRead;
        }

        fileStream.SetLength(fileStream.Length - deleteLength);

        metadataChunkCache.Remove(chunk);
        
        // Update the index of cached chunks
        for (int i = 0; i < metadataChunkCache.Count; i++)
        {
            var cachedChunk = metadataChunkCache[i];
            if (cachedChunk.Index > deleteStart)
                cachedChunk.Index -= deleteLength;
        }

        return true;
    }
    

    /// <summary>
    /// Retrieves all PNG metadata chunks of a specified type
    /// </summary>
    /// <param name="chunkTypeFilter">The type of chunk to search for.</param>
    /// <returns>A list of <see cref="PNGChunk"/> objects that match the specified type.</returns>
    /// <remarks>
    /// If the metadata cache is empty, it will first populate the cache by reading from the file.
    /// </remarks>
    public List<PNGChunk> GetChunksOfType(PNGChunkTypeFilter chunkTypeFilter)
    {
        ReadAndCacheMetadata();
        
        return metadataChunkCache.FindAll((chunk) => chunk.ChunkTypeEnum.HasFlag(chunkTypeFilter));
    }
    
    /// <summary>
    /// Reads PNG metadata chunks
    /// </summary>
    /// <returns>An enumerable collection of <see cref="PNGChunk"/> objects found in the file.</returns>
    /// <remarks>
    /// Each chunk is represented by a <see cref="PNGChunk"/> object containing its length, type, and data.
    /// This method reads chunks sequentially from the start of the file, up to a maximum of 
    /// <see cref="MAX_CHUNKS_TO_READ"/> chunks. It stops on encountering the "IDAT" or "IEND".
    /// </remarks>
    private IEnumerable<PNGChunk> ReadChunks()
    {
        int currentIndex = pngSignatureBytes.Length;
        int chunksRead = 0;
        byte[] buffer = new byte[4];

        while (currentIndex < fileStream.Length)
        {
            if (chunksRead >= MAX_CHUNKS_TO_READ)
                yield break;
            
            chunksRead++;
            fileStream.Seek(currentIndex, SeekOrigin.Begin);

            // Read chunk length
            fileStream.ReadExactly(buffer, 0, CHUNK_FIELD_SIZE);

            // Convert from big endian to system endian
            if (BitConverter.IsLittleEndian)
                Array.Reverse(buffer, 0, 4);

            int chunkLength = BitConverter.ToInt32(buffer, 0);
            if (chunkLength < 0 || chunkLength > fileStream.Length - currentIndex - CHUNK_NONDATA_SIZE)
                yield break;

            // Read chunk type
            fileStream.ReadExactly(buffer, 0, CHUNK_FIELD_SIZE);

            string chunkType = Encoding.ASCII.GetString(buffer, 0, CHUNK_FIELD_SIZE);
            
            // Stop on start of image data
            if (chunkType == "IDAT")
                yield break;
            
            // Stop if we've reached IEND somehow
            if (chunkType == "IEND")
                yield break;

            // Read chunk data (we could make a class for PNGChunk and lazy load this instead... but the performance/memory impact of the allocations is negligible compared to IO sooo not worth. also im lazy)
            byte[] chunkData = new byte[chunkLength];
            fileStream.ReadExactly(chunkData, 0, chunkLength);

            // Skip CRC (4 bytes)
            // fileStream.Seek(CHUNK_FIELD_SIZE, SeekOrigin.Current);

            PNGChunk chunk = new PNGChunk
            {
                Length = chunkLength,
                ChunkType = chunkType,
                ChunkTypeEnum = ChunkNameToEnum(chunkType),
                Data = chunkData,
                Index = currentIndex
            };

            yield return chunk;

            // Move to next chunk
            currentIndex += CHUNK_NONDATA_SIZE + chunkLength;
        }
    }
    
    
    /// <summary>
    /// Reads a PNG chunk from the end of the file, backtracking and bruteforce matching to find the first chunk of the given type.
    /// </summary>
    /// <param name="chunkTypeFilter">The type of chunk to search for.</param>
    /// <returns>The first chunk of the given type, if any were found, or <c>null</c> if none were found.</returns>
    /// <remarks>
    /// This method is used to find chunks added by mods that do not follow the PNG spec and append chunks to the end of the file.
    /// </remarks>
    private PNGChunk? ReadChunkReverse(PNGChunkTypeFilter chunkTypeFilter)
    {
        if (fileStream.Length < 8300)
            return null;
        
        byte[] searchChunkBytes = Encoding.ASCII.GetBytes(ChunkTypeEnumToChunkName(chunkTypeFilter));
        
        // Read last 8KB of file minus IEND length, which should be enough to find any trailing chunks added by mods not following spec.
        fileStream.Seek(fileStream.Length - 8192 - CHUNK_NONDATA_SIZE, SeekOrigin.Begin);
        
        byte[] trailingBytesBuffer = new byte[8192];
        fileStream.ReadExactly(trailingBytesBuffer, 0, 8192);
        
        for (int i = 0; i < trailingBytesBuffer.Length - searchChunkBytes.Length; i++)
        {
            if (trailingBytesBuffer[i] == searchChunkBytes[0] &&
                trailingBytesBuffer[i + 1] == searchChunkBytes[1] &&
                trailingBytesBuffer[i + 2] == searchChunkBytes[2] &&
                trailingBytesBuffer[i + 3] == searchChunkBytes[3])
            {
                fileStream.Seek(fileStream.Length - trailingBytesBuffer.Length - CHUNK_NONDATA_SIZE + i - CHUNK_FIELD_SIZE, SeekOrigin.Begin);

                byte[] buffer = new byte[4];

                // Read chunk length
                fileStream.ReadExactly(buffer, 0, CHUNK_FIELD_SIZE);

                // Convert from big endian to system endian
                if (BitConverter.IsLittleEndian)
                    Array.Reverse(buffer, 0, 4);

                int chunkLength = BitConverter.ToInt32(buffer, 0);
                if (chunkLength < 0 || chunkLength > fileStream.Length - i - CHUNK_NONDATA_SIZE)
                    return null;

                // Read chunk type
                fileStream.ReadExactly(buffer, 0, CHUNK_FIELD_SIZE);

                string chunkType = Encoding.ASCII.GetString(buffer, 0, CHUNK_FIELD_SIZE);

                // Read chunk data (we could make a class for PNGChunk and lazy load this instead... but the performance/memory impact of the allocations is negligible compared to IO sooo not worth. also im lazy)
                byte[] chunkData = new byte[chunkLength];
                fileStream.ReadExactly(chunkData, 0, chunkLength);

                // Skip CRC (4 bytes)
                fileStream.Seek(CHUNK_FIELD_SIZE, SeekOrigin.Current);

                PNGChunk chunk = new PNGChunk
                {
                    Length = chunkLength,
                    ChunkType = chunkType,
                    ChunkTypeEnum = ChunkNameToEnum(chunkType),
                    Data = chunkData,
                };

                return chunk;
            }
        }

        return null;
    }
    
    /// <summary>
    /// Reads PNG metadata chunks from the file and caches them for later use.
    /// </summary>
    /// <remarks>
    /// This method populates <see cref="metadataChunkCache"/> with PNG chunks from <see cref="ReadChunks"/>.
    /// The method is intended to ensure that the metadata is available for multiple operations and avoid unnecessary IO.
    /// </remarks>
    private void ReadAndCacheMetadata()
    {
        if (metadataChunkCache.Count > 0)
            return;

        if (!IsValid())
            return;
        
        // literally only here because I abandoned the original usage of the enumerable impl rip
        metadataChunkCache.AddRange(ReadChunks());
    }
    
    private bool FilterHasChunkType(string chunkTypeStr, PNGChunkTypeFilter chunkType)
    {
        switch (chunkTypeStr)
        {
            case "IHDR":
                return chunkType.HasFlag(PNGChunkTypeFilter.IHDR);
            case "sRGB":
                return chunkType.HasFlag(PNGChunkTypeFilter.sRGB);
            case "iTXt":
                return chunkType.HasFlag(PNGChunkTypeFilter.iTXt);
            case "IDAT":
                return chunkType.HasFlag(PNGChunkTypeFilter.IDAT);
            case "IEND":
                return chunkType.HasFlag(PNGChunkTypeFilter.IEND);
                
        }

        return false;
    }
    
    private PNGChunkTypeFilter ChunkNameToEnum(string chunkType)
    {
        switch (chunkType)
        {
            case "IHDR":
                return PNGChunkTypeFilter.IHDR;
            case "sRGB":
                return PNGChunkTypeFilter.sRGB;
            case "iTXt":
                return  PNGChunkTypeFilter.iTXt;
            case "IDAT":
                return  PNGChunkTypeFilter.IDAT;
            case "IEND":
                return  PNGChunkTypeFilter.IEND;
                
        }

        return PNGChunkTypeFilter.UNKNOWN;
    }

    private string ChunkTypeEnumToChunkName(PNGChunkTypeFilter chunkType)
    {
        switch (chunkType)
        {
            case PNGChunkTypeFilter.IHDR:
                return "IHDR";
            case PNGChunkTypeFilter.sRGB:
                return "sRGB";
            case PNGChunkTypeFilter.iTXt:
                return "iTXt";
            case PNGChunkTypeFilter.IDAT:
                return "IDAT";
            case PNGChunkTypeFilter.IEND:
                return "IEND";
        }

        return null;
    }

    /// <summary>
    ///     Determines whether this is a valid PNG file. We do this by checking if the first 8 bytes in the file path match the PNG signature and the file is a minimum size of 57 bytes.
    /// </summary>
    /// <returns></returns>
    public bool IsValid()
    {
        if (fileStream.Length < 57)
            return false; // Ignore files smaller than the absolute minimum size any PNG file could theoretically be (Signature + IHDR + IDAT + IEND)

        var signature = new byte[8];
        if (fileStream.Read(signature, 0, 8) < 8) return false;

        return signature.SequenceEqual(pngSignatureBytes);
    }

    /// <summary>
    ///     Disposes of the file stream.
    /// </summary>
    public void Dispose()
    {
        fileStream.Dispose();
    }
}