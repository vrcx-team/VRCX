using System;
using System.Buffers.Binary;
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
    
    public PNGFile(string filePath)
    {
        fileStream = new FileStream(filePath, FileMode.Open, FileAccess.ReadWrite, FileShare.ReadWrite, 4096);
    }

    public PNGChunk? GetChunk(PNGChunkTypeFilter chunkTypeFilter)
    {
        if (metadataChunkCache.Count == 0)
            ReadAndCacheMetadata();
        
        var chunk = metadataChunkCache.FirstOrDefault((chunk) => chunkTypeFilter.HasFlag(chunk.ChunkTypeEnum));
        if (chunk.IsZero())
            return null;

        return chunk;
    }
    
    public List<PNGChunk> GetChunks()
    {
        if (metadataChunkCache.Count == 0)
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
        fileStream.Write(chunkBytes, 0, chunkBytes.Length);
        fileStream.Write(fileBytes, 0, fileBytes.Length);
        
        return false;
    }
    
    public List<PNGChunk> GetChunksOfType(PNGChunkTypeFilter chunkTypeFilter)
    {
        if (metadataChunkCache.Count == 0)
            ReadAndCacheMetadata();
        
        return metadataChunkCache.FindAll((chunk) => chunkTypeFilter.HasFlag(chunk.ChunkTypeEnum));
    }
    
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
            if (fileStream.Read(buffer, 0, CHUNK_FIELD_SIZE) < CHUNK_FIELD_SIZE)
                yield break;

            // Convert from big endian to system endian
            if (BitConverter.IsLittleEndian)
                Array.Reverse(buffer, 0, 4);

            int chunkLength = BitConverter.ToInt32(buffer, 0);
            if (chunkLength < 0 || chunkLength > fileStream.Length - currentIndex - CHUNK_NONDATA_SIZE)
                yield break;

            // Read chunk type
            if (fileStream.Read(buffer, 0, CHUNK_FIELD_SIZE) < CHUNK_FIELD_SIZE)
                yield break;

            string chunkType = Encoding.ASCII.GetString(buffer, 0, CHUNK_FIELD_SIZE);
            
            // Stop on start of image data
            if (chunkType == "IDAT")
                yield break;

            // Read chunk data (we could make a class for PNGChunk and lazy load this instead... but the performance/memory impact of the allocations is negligible compared to IO sooo not worth. also im lazy)
            byte[] chunkData = new byte[chunkLength];
            if (fileStream.Read(chunkData, 0, chunkLength) < chunkLength)
                yield break;

            // Skip CRC (4 bytes)
            fileStream.Seek(CHUNK_FIELD_SIZE, SeekOrigin.Current);

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

            // Stop if we've reached the IEND chunk
            if (chunkType == "IEND")
                yield break;
        }
    }
    
    private IEnumerable<PNGChunk> ReadChunksOfType(PNGChunkTypeFilter chunkTypeFilter)
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
            if (fileStream.Read(buffer, 0, CHUNK_FIELD_SIZE) < CHUNK_FIELD_SIZE)
                yield break;

            // Convert from big endian to system endian
            if (BitConverter.IsLittleEndian)
                Array.Reverse(buffer, 0, 4);

            int chunkLength = BitConverter.ToInt32(buffer, 0);
            if (chunkLength < 0 || chunkLength > fileStream.Length - currentIndex - (CHUNK_FIELD_SIZE * 3))
                yield break;

            // Read chunk type
            if (fileStream.Read(buffer, 0, CHUNK_FIELD_SIZE) < CHUNK_FIELD_SIZE)
                yield break;

            string chunkType = Encoding.ASCII.GetString(buffer, 0, CHUNK_FIELD_SIZE);

            var currentChunkTypeFilter = ChunkNameToEnum(chunkType);
            if (chunkTypeFilter.HasFlag(currentChunkTypeFilter))
                continue;
            
            // Stop on start of image data
            if (chunkType == "IDAT")
                yield break;

            // Read chunk data (we could make a class for PNGChunk and lazy load this instead... but the performance/memory impact of the allocations is negligible compared to IO sooo not worth. also im lazy)
            byte[] chunkData = new byte[chunkLength];
            if (fileStream.Read(chunkData, 0, chunkLength) < chunkLength)
                yield break;

            // Skip CRC (4 bytes)
            fileStream.Seek(CHUNK_FIELD_SIZE, SeekOrigin.Current);
            
            PNGChunk chunk = new PNGChunk
            {
                Length = chunkLength,
                ChunkType = chunkType,
                ChunkTypeEnum = currentChunkTypeFilter,
                Data = chunkData,
                Index = currentIndex
            };

            yield return chunk;

            // Move to next chunk
            currentIndex += (CHUNK_FIELD_SIZE * 3) + chunkLength;

            // Stop if we've reached the IEND chunk
            if (chunkType == "IEND")
                yield break;
        }
    }
    
    private void ReadAndCacheMetadata()
    {
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

    /// <summary>
    ///     Determines whether the specified file is a PNG file. We do this by checking if the first 8 bytes in the file path match the PNG signature and the file is a minimum size of 57 bytes.
    /// </summary>
    /// <returns></returns>
    public static bool IsValid(FileStream fileStream)
    {
        if (fileStream.Length < 57)
            return
                false; // Ignore files smaller than the absolute minimum size any PNG file could theoretically be (Signature + IHDR + IDAT + IEND)

        var signature = new byte[8];
        if (fileStream.Read(signature, 0, 8) < 8) return false;

        return signature.SequenceEqual(pngSignatureBytes);
    }

    public void Dispose()
    {
        fileStream.Dispose();
    }
}