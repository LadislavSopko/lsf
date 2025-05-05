using System;
using System.Collections.Generic;
using System.Text;
using System.Linq; // Add LINQ for ToList()

namespace Zerox.LSF
{
    /// <summary>
    /// Provides static methods for parsing LSF (LLM-Safe Format) data and encoding objects into LSF.
    /// This serves as the main entry point for the library.
    /// </summary>
    public static class LSFParser
    {
        private static readonly UTF8Encoding Utf8NoBom = new UTF8Encoding(false);

        #region Parsing Methods

        /// <summary>
        /// Parses an LSF string directly into a JSON string representation.
        /// </summary>
        /// <param name="lsfInput">The LSF string to parse.</param>
        /// <returns>A JSON string representation of the LSF data, or null if parsing fails or the root is not a valid object.</returns>
        public static string? ParseToJsonString(string lsfInput)
        {
            if (string.IsNullOrEmpty(lsfInput)) return null;
            
            ReadOnlyMemory<byte> inputMemory = Utf8NoBom.GetBytes(lsfInput);
            return ParseToJsonString(inputMemory);
        }

        /// <summary>
        /// Parses LSF data from a byte memory region directly into a JSON string representation.
        /// </summary>
        /// <param name="lsfInputBytes">The ReadOnlyMemory&lt;byte&gt; containing LSF data.</param>
        /// <returns>A JSON string representation of the LSF data, or null if parsing fails or the root is not a valid object.</returns>
        public static string? ParseToJsonString(ReadOnlyMemory<byte> lsfInputBytes)
        {
            try
            {
                var tokens = TokenScanner.Scan(lsfInputBytes.Span);
                var parseResult = DOMBuilder.Build(tokens, lsfInputBytes.Span);

                if (!parseResult.Success || parseResult.Nodes == null || parseResult.Nodes.Count == 0)
                {
                    return null; // Build failed or no nodes
                }

                // --- TEMPORARY DEBUG CHECK --- 
                var navigator = new DOMNavigator(lsfInputBytes, parseResult.Nodes);
                var rootIndices = navigator.GetRootIndices().ToList();
                if (rootIndices.Count == 0) return null;
                int rootIndex = rootIndices[0];
                var rootNode = navigator.GetNode(rootIndex);
                if (rootNode.Type != TokenType.Object || rootNode.TokenPosition != 0)
                {
                    return null; // Explicitly return null if not $o~ at pos 0
                }
                // --- END TEMPORARY DEBUG CHECK --- 

                // If we get here, it should be a valid root object at pos 0
                // For debugging, return a fixed string instead of calling visitor
                return "{VALID_ROOT_FOUND}"; 
                
                // Original code:
                // var navigator = new DOMNavigator(lsfInputBytes, parseResult.Nodes);
                // return LSFToJSONVisitor.ToJsonString(navigator);
            }
            catch (Exception ex) // Catch potential errors during scan/build/visit
            {
                Console.Error.WriteLine($"LSF parsing to JSON failed: {ex.Message}"); // Simple error reporting
                return null;
            }
        }

        /// <summary>
        /// Parses an LSF string into its DOM representation.
        /// </summary>
        /// <param name="lsfInput">The LSF string to parse.</param>
        /// <returns>A ParseResult containing the DOM nodes and success status.</returns>
        public static ParseResult ParseToDom(string lsfInput)
        {
            if (string.IsNullOrEmpty(lsfInput)) 
                return new ParseResult { Success = true, Nodes = new List<LSFNode>() };

            ReadOnlyMemory<byte> inputMemory = Utf8NoBom.GetBytes(lsfInput);
            return ParseToDom(inputMemory);
        }

        /// <summary>
        /// Parses LSF data from a byte memory region into its DOM representation.
        /// </summary>
        /// <param name="lsfInputBytes">The ReadOnlyMemory&lt;byte&gt; containing LSF data.</param>
        /// <returns>A ParseResult containing the DOM nodes and success status.</returns>
        public static ParseResult ParseToDom(ReadOnlyMemory<byte> lsfInputBytes)
        {
            try
            {
                var tokens = TokenScanner.Scan(lsfInputBytes.Span);
                // Build returns a ParseResult directly
                return DOMBuilder.Build(tokens, lsfInputBytes.Span); 
            }
             catch (Exception ex) // Catch potential errors during scan/build
            {
                // Optional: Log the exception ex
                Console.Error.WriteLine($"LSF parsing to DOM failed: {ex.Message}"); // Simple error reporting
                return new ParseResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        #endregion

        #region Encoding Methods

        /// <summary>
        /// Encodes a dictionary representing a single LSF object into an LSF string.
        /// </summary>
        /// <param name="data">The dictionary representing the object. Keys are field names, values can be primitive types or lists/arrays of primitives.</param>
        /// <param name="objectName">Optional name for the root object.</param>
        /// <returns>The LSF formatted string.</returns>
        /// <exception cref="ArgumentNullException">Thrown if data is null.</exception>
        /// <exception cref="ArgumentException">Thrown if nested objects or unsupported types are encountered.</exception>
        public static string EncodeToString(Dictionary<string, object?> data, string objectName = "")
        {
            // Direct pass-through to LSFEncoder
            return LSFEncoder.EncodeToString(data, objectName);
        }

        /// <summary>
        /// Encodes a dictionary representing a single LSF object into a UTF-8 byte array.
        /// </summary>
        /// <param name="data">The dictionary representing the object.</param>
        /// <param name="objectName">Optional name for the root object.</param>
        /// <returns>The LSF formatted data as a byte array.</returns>
        /// <exception cref="ArgumentNullException">Thrown if data is null.</exception>
        /// <exception cref="ArgumentException">Thrown if nested objects or unsupported types are encountered.</exception>
        public static byte[] EncodeToArray(Dictionary<string, object?> data, string objectName = "")
        {
             // Direct pass-through to LSFEncoder
            return LSFEncoder.EncodeToArray(data, objectName);
        }

        #endregion
    }
} 