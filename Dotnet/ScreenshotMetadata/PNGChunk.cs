using System;
using System.Buffers.Binary;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace VRCX;

public class PNGChunk
{
    public int Index;
    public int Length;
    public string ChunkType;
    public PNGChunkTypeFilter ChunkTypeEnum;
    public byte[] Data;

    private static uint[] crcTable;

    /// <summary>
    /// Checks if the chunk data is empty
    /// </summary>
    /// <returns>True if the chunk data is empty, false otherwise</returns>
    public bool IsZero()
    {
        return Data == null || Data.Length == 0;
    }

    /// <summary>
    /// Reads an iTXt chunk and returns the keyword and text
    /// </summary>
    /// <returns>A tuple of the keyword and text in the iTXt chunk (keyword, text)</returns>
    /// <exception cref="Exception">Thrown if the chunk is invalid or not an iTXt chunk</exception>
    public Tuple<string, string> ReadITXtChunk()
    {
        if (this.IsZero())
            throw new Exception("Tried to read from invalid PNG chunk");

        if (ChunkTypeEnum != PNGChunkTypeFilter.iTXt)
            throw new Exception("Cannot read text from chunk type " + ChunkType);

        int chunkLength = this.Length;
        byte[] chunkData = this.Data;

        /*
         *  iTXt Chunk Structure:
         *  Keyword:             1-79 bytes (character string)
            Null separator:      1 byte
            Compression flag:    1 byte
            Compression method:  1 byte
            Language tag:        0 or more bytes (character string)
            Null separator:      1 byte
            Translated keyword:  0 or more bytes
            Null separator:      1 byte
            Text:                0 or more bytes

            We're treating the language tag/translated keyword as if they dont exist
        */

        // Parse keyword as null-terminated string
        var keywordEncoding = Encoding.UTF8;
        int keywordLength = 0;
        for (int i = 0; i < chunkLength; i++)
        {
            if (chunkData[i] == 0x0)
            {
                keywordLength = i;
                break;
            }
        }

        if (keywordLength == 0 || keywordLength > 79 || chunkLength < keywordLength) return null;
        string keyword = keywordEncoding.GetString(chunkData, 0, keywordLength);

        // lazy skip over the rest of the chunk
        int textOffset = keywordLength + 5;
        int textLength = chunkLength - textOffset;

        return new Tuple<string, string>(keyword, Encoding.UTF8.GetString(chunkData, textOffset, textLength));
    }

    /// <summary>
    /// Reads the IHDR chunk to extract the resolution of the PNG image.
    /// </summary>
    /// <returns>A tuple containing the width and height of the image. (width, height)</returns>
    /// <exception cref="Exception">Thrown if the chunk is invalid or not an IHDR chunk.</exception>
    public Tuple<int, int> ReadIHDRChunkResolution()
    {
        if (this.IsZero())
            throw new Exception("Tried to read from invalid PNG chunk");

        if (ChunkTypeEnum != PNGChunkTypeFilter.IHDR)
            throw new Exception("Cannot read text from chunk type " + ChunkType);

        /*
         *  IHDR Chunk Structure:
         *  Width:              4 bytes
            Height:             4 bytes
            Bit depth:          1 byte
            Color type:         1 byte
            Compression method: 1 byte
            Filter method:      1 byte
            Interlace method:   1 byte
        */

        int chunkLength = this.Length;
        byte[] chunkData = this.Data;

        if (BitConverter.IsLittleEndian)
        {
            Array.Reverse(chunkData, 0, 4);
            Array.Reverse(chunkData, 4, 4);
        }
        
        int width = BitConverter.ToInt32(chunkData, 0);
        int height = BitConverter.ToInt32(chunkData, 4);

        return new Tuple<int, int>(width, height);
    }

    /// <summary>
    /// Validates this chunk against the chunk at the same index in a given file stream, checking the chunk length and CRC.
    /// </summary>
    /// <param name="fileStream">The file stream from which the chunk data is read for validation.</param>
    /// <returns>True if chunk exists at index and is valid, false otherwise.</returns>
    public bool ExistsInFile(FileStream fileStream)
    {
        fileStream.Seek(Index, SeekOrigin.Begin);
        
        byte[] buffer = new byte[4];
        fileStream.ReadExactly(buffer, 0, 4);
        
        if (BitConverter.IsLittleEndian)
            Array.Reverse(buffer, 0, 4);
        
        int chunkLength = BitConverter.ToInt32(buffer, 0);
        if (chunkLength != Length)
            return false;

        fileStream.Seek(4 + chunkLength, SeekOrigin.Current);
        fileStream.ReadExactly(buffer, 0, 4);
        
        if (BitConverter.IsLittleEndian)
            Array.Reverse(buffer, 0, 4);
        
        uint crc = BitConverter.ToUInt32(buffer, 0);
        uint calculatedCRC = CalculateCRC();
        
        return crc == calculatedCRC;
    }

    /// <summary>
    /// Constructs and returns a byte array representation of the PNG chunk. Generates a CRC.
    /// This data can be added to a PNG file as-is.
    /// </summary>
    /// <returns>A byte array containing the length, chunk type, data, and CRC of the chunk.</returns>
    /// <remarks>
    /// The byte array is structured as follows:
    /// - 4 bytes: Length of the data in big-endian format.
    /// - 4 bytes: ASCII encoded chunk type.
    /// - N bytes: Chunk data.
    /// - 4 bytes: CRC of the chunk type and data, in big-endian format.
    /// </remarks>
    public byte[] GetBytes()
    {
        byte[] chunkTypeBytes = Encoding.ASCII.GetBytes(ChunkType);
        int totalLength = Data.Length + 12; //  data length + length + chunk type + crc
        byte[] result = new byte[totalLength];
        
        // Copy length
        var chunkLength = BinaryPrimitives.ReverseEndianness(Data.Length);
        Buffer.BlockCopy(BitConverter.GetBytes(chunkLength), 0, result, 0, 4);
    
        // Copy chunk type
        Buffer.BlockCopy(chunkTypeBytes, 0, result, 4, chunkTypeBytes.Length);
    
        // Copy data
        Buffer.BlockCopy(Data, 0, result, 8, Data.Length);
    
        // Calculate and copy CRC
        uint crc = CalculateCRC();
        uint reversedCrc = BinaryPrimitives.ReverseEndianness(crc);
        
        Buffer.BlockCopy(BitConverter.GetBytes(reversedCrc), 0, result, totalLength - 4, 4);
    
        return result;
    }

    public uint CalculateCRC()
    {
        var chunkTypeBytes = Encoding.UTF8.GetBytes(ChunkType);
        return Crc32(Data, 0, Data.Length, Crc32(chunkTypeBytes, 0, chunkTypeBytes.Length, 0));
    }

    // Crc32 implementation from
    // https://web.archive.org/web/20150825201508/http://upokecenter.dreamhosters.com/articles/png-image-encoder-in-c/
    private static uint Crc32(byte[] stream, int offset, int length, uint crc)
    {
        uint c;
        if (crcTable == null)
        {
            crcTable = new uint[256];
            for (uint n = 0; n <= 255; n++)
            {
                c = n;
                for (var k = 0; k <= 7; k++)
                {
                    if ((c & 1) == 1)
                        c = 0xEDB88320 ^ ((c >> 1) & 0x7FFFFFFF);
                    else
                        c = (c >> 1) & 0x7FFFFFFF;
                }

                crcTable[n] = c;
            }
        }

        c = crc ^ 0xffffffff;
        var endOffset = offset + length;
        for (var i = offset; i < endOffset; i++)
        {
            c = crcTable[(c ^ stream[i]) & 255] ^ ((c >> 8) & 0xFFFFFF);
        }

        return c ^ 0xffffffff;
    }
}