using System;
using System.Collections.Generic;
using System.Text;

namespace Zerox.LSF
{
    /// <summary>
    /// Scans a byte span for LSF tokens.
    /// </summary>
    public static class TokenScanner
    {
        // LSF Token Signatures as UTF-8 bytes
        private static readonly byte[] ObjectTokenBytes = Encoding.UTF8.GetBytes("$o~");
        private static readonly byte[] FieldTokenBytes = Encoding.UTF8.GetBytes("$f~");
        private static readonly byte[] ValueTokenBytes = Encoding.UTF8.GetBytes("$v~");
        private static readonly byte[] TypeHintTokenBytes = Encoding.UTF8.GetBytes("$t~");

        // Placeholder for the token information we'll store
        // We might refine this structure later (e.g., use a struct for performance)
        public struct TokenInfo
        {
            public TokenType Type { get; set; }
            public int Position { get; set; } // Start position of the token in the input span
        }

        /// <summary>
        /// Scans the input byte span and returns a list of found LSF tokens and their positions.
        /// </summary>
        /// <param name="input">The input byte span to scan.</param>
        /// <returns>A list of TokenInfo structs representing the found tokens.</returns>
        public static List<TokenInfo> Scan(ReadOnlySpan<byte> input)
        {
            var tokens = new List<TokenInfo>();
            var inputLength = input.Length;
            const int tokenLength = 3; // All LSF tokens are 3 bytes long

            // Cache token bytes for direct comparison
            byte o1 = ObjectTokenBytes[1], o2 = ObjectTokenBytes[2];
            byte f1 = FieldTokenBytes[1], f2 = FieldTokenBytes[2];
            byte v1 = ValueTokenBytes[1], v2 = ValueTokenBytes[2];
            byte t1 = TypeHintTokenBytes[1], t2 = TypeHintTokenBytes[2];

            for (int i = 0; i <= inputLength - tokenLength; i++)
            {
                // Check for $ first for quick filtering
                if (input[i] != (byte)'$')
                {
                    continue;
                }

                // Potential token found, check the next 2 bytes directly
                byte nextByte1 = input[i + 1];
                byte nextByte2 = input[i + 2];

                if (nextByte1 == o1 && nextByte2 == o2)
                {
                    tokens.Add(new TokenInfo { Type = TokenType.Object, Position = i });
                    i += tokenLength - 1; // Skip the remaining token bytes
                }
                else if (nextByte1 == f1 && nextByte2 == f2)
                {
                    tokens.Add(new TokenInfo { Type = TokenType.Field, Position = i });
                    i += tokenLength - 1; // Skip the remaining token bytes
                }
                else if (nextByte1 == v1 && nextByte2 == v2)
                {
                    tokens.Add(new TokenInfo { Type = TokenType.Value, Position = i });
                    i += tokenLength - 1; // Skip the remaining token bytes
                }
                else if (nextByte1 == t1 && nextByte2 == t2)
                {
                    tokens.Add(new TokenInfo { Type = TokenType.TypeHint, Position = i });
                    i += tokenLength - 1; // Skip the remaining token bytes
                }
                // If it starts with $ but isn't a known token, just continue to the next byte
            }

            return tokens;
        }
    }
} 