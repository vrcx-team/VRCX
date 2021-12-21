using System;
using System.Collections;
using System.Collections.Generic;
using System.Numerics;
using System.Text;

namespace VRCX
{
    class VRCEventDeserialization
    {
        private byte[] byteData;
        private int byteOffset;
        private static readonly Dictionary<int, Type> DataType = new Dictionary<int, Type> {
            {2, typeof(byte)},
            {3, typeof(double)},
            {4, typeof(float)},
            {5, typeof(int)},
            {6, typeof(short)},
            {7, typeof(long)},
            {8, typeof(bool)},
            {9, typeof(string)},
            {10, typeof(object[])},
            {11, typeof(IList)},
            {100, typeof(Vector2)},
            {101, typeof(Vector3)},
            {102, typeof(Vector4)},
            {103, typeof(Quaternion)}
        };

        public class EventEntry
        {
            public int Type { get; set; }
            public string EventType { get; set; }
            public object Data { get; set; }
        }

        private byte DeserializeByte()
        {
            return byteData[byteOffset++];
        }

        private int DeserializeInt()
        {
            int output = BitConverter.ToInt32(byteData, byteOffset);
            byteOffset += 4;
            return output;
        }

        private short DeserializeShort()
        {
            short output = BitConverter.ToInt16(byteData, byteOffset);
            byteOffset += 2;
            return output;
        }

        private string DeserializeString()
        {
            short stringLength = DeserializeShort();
            string output = Encoding.UTF8.GetString(byteData, byteOffset, stringLength);
            byteOffset += stringLength;
            return output;
        }

        private bool DeserializeBool()
        {
            bool output = BitConverter.ToBoolean(byteData, byteOffset);
            byteOffset++;
            return output;
        }

        private float DeserializeFloat()
        {
            float output = BitConverter.ToSingle(byteData, byteOffset);
            byteOffset += 4;
            return output;
        }

        private double DeserializeDouble()
        {
            double output = BitConverter.ToDouble(byteData, byteOffset);
            byteOffset += 8;
            return output;
        }

        private object DeserializeTypeArray()
        {
            short length = DeserializeShort();
            byte typeCode = DeserializeByte();
            var output = Array.CreateInstance(DataType[typeCode], length);
            for (var i = 0; i < length; i++)
            {
                output.SetValue(DeserializeBytes(typeCode), i);
            }
            return output;
        }

        private object[] DeserializeObjectArray()
        {
            short length = DeserializeShort();
            object[] output = new object[length];
            for (var i = 0; i < output.Length; i++)
            {
                output[i] = DeserializeBytes();
            }
            return output;
        }

        private long DeserializeInt64()
        {
            long output = BitConverter.ToInt64(byteData, byteOffset);
            byteOffset += 8;
            return output;
        }

        private Vector2 DeserializeVector2()
        {
            return new Vector2(DeserializeFloat(), DeserializeFloat());
        }

        private Vector3 DeserializeVector3()
        {
            return new Vector3(DeserializeFloat(), DeserializeFloat(), DeserializeFloat());
        }

        private Vector4 DeserializeVector4()
        {
            return new Vector4(DeserializeFloat(), DeserializeFloat(), DeserializeFloat(), DeserializeFloat());
        }

        private Quaternion DeserializeQuaternion()
        {
            return new Quaternion(DeserializeFloat(), DeserializeFloat(), DeserializeFloat(), DeserializeFloat());
        }

        private object DeserializeBytes(byte type = 0)
        {
            if (type == 0)
            {
                type = DeserializeByte();
            }
            switch (type)
            {
                case 1:
                    return null;
                case 2:
                    return DeserializeByte();
                case 3:
                    return DeserializeDouble();
                case 4:
                    return DeserializeFloat();
                case 5:
                    return DeserializeInt();
                case 6:
                    return DeserializeShort();
                case 7:
                    return DeserializeInt64();
                case 8:
                    return DeserializeBool();
                case 9:
                    return DeserializeString();
                case 10:
                    return DeserializeObjectArray();
                case 11:
                    return DeserializeTypeArray();
                case 100:
                    return DeserializeVector2();
                case 101:
                    return DeserializeVector3();
                case 102:
                    return DeserializeVector4();
                case 103:
                    return DeserializeQuaternion();
                default:
                    throw new Exception("Ignoring data type: " + type);
            }
        }

        public EventEntry DeserializeData(byte[] bytes)
        {
            EventEntry eventEntry = new EventEntry();
            byteOffset = 0;
            byteData = bytes;
            byte type = DeserializeByte();
            if (type == 106)
            {
                byteOffset += 8;
                int length = DeserializeShort();
                byteOffset += length;
                eventEntry.Type = DeserializeByte();
                byteOffset += 10;
                eventEntry.EventType = DeserializeString();
                byteOffset += 5;
                eventEntry.Data = null;
                if (byteData.Length > byteOffset + 3)
                {
                    byteData = (byte[])DeserializeTypeArray();
                    byteOffset = 0;
                    eventEntry.Data = DeserializeBytes();
                }
            }
            else
            {
                throw new Exception("Unexpected type: " + type);
            }
            return eventEntry;
        }
    }
}
