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
        /// Parses an LSF string directly into a JSON string representation using default options.
        /// </summary>
        /// <param name="lsfInput">The LSF string to parse.</param>
        /// <returns>A JSON string representation of the LSF data, or null if parsing fails or the root is not a valid object.</returns>
        public static string? ParseToJsonString(string lsfInput)
        {
            return ParseToJsonString(lsfInput, LSFParserOptions.Default);
        }

        /// <summary>
        /// Parses an LSF string directly into a JSON string representation.
        /// </summary>
        /// <param name="lsfInput">The LSF string to parse.</param>
        /// <param name="options">Parser options.</param>
        /// <returns>A JSON string representation of the LSF data, or null if parsing fails or the root is not a valid object.</returns>
        public static string? ParseToJsonString(string lsfInput, LSFParserOptions options)
        {
            if (string.IsNullOrEmpty(lsfInput)) return null;
            
            // Check size limit from options
            if (lsfInput.Length > options.MaxInputSize)
            {
                throw new ArgumentException($"Input size exceeds maximum allowed size of {options.MaxInputSize / (1024 * 1024)}MB");
            }
            
            ReadOnlyMemory<byte> inputMemory = Utf8NoBom.GetBytes(lsfInput);
            return ParseToJsonString(inputMemory, options);
        }

        /// <summary>
        /// Parses LSF data from a byte memory region directly into a JSON string representation using default options.
        /// </summary>
        /// <param name="lsfInputBytes">The ReadOnlyMemory&lt;byte&gt; containing LSF data.</param>
        /// <returns>A JSON string representation of the LSF data, or null if parsing fails or the root is not a valid object.</returns>
        public static string? ParseToJsonString(ReadOnlyMemory<byte> lsfInputBytes)
        {
            return ParseToJsonString(lsfInputBytes, LSFParserOptions.Default);
        }

        /// <summary>
        /// Parses LSF data from a byte memory region directly into a JSON string representation.
        /// </summary>
        /// <param name="lsfInputBytes">The ReadOnlyMemory&lt;byte&gt; containing LSF data.</param>
        /// <param name="options">Parser options.</param>
        /// <returns>A JSON string representation of the LSF data, or null if parsing fails or the root is not a valid object.</returns>
        public static string? ParseToJsonString(ReadOnlyMemory<byte> lsfInputBytes, LSFParserOptions options)
        {
            var tokens = TokenScanner.Scan(lsfInputBytes.Span);
            var parseResult = DOMBuilder.Build(tokens, lsfInputBytes.Span, options);

            if (!parseResult.Success || parseResult.Nodes == null || parseResult.Nodes.Count == 0)
            {
                return null; // Build failed or no nodes
            }

            var navigator = new DOMNavigator(lsfInputBytes, parseResult.Nodes);
            return LSFToJSONVisitor.ToJsonString(navigator);
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
            var tokens = TokenScanner.Scan(lsfInputBytes.Span);
            // Build returns a ParseResult directly
            return DOMBuilder.Build(tokens, lsfInputBytes.Span);
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

        #region LLM Integration

        /// <summary>
        /// Gets a prompt for instructing LLMs to generate LSF format.
        /// </summary>
        /// <param name="includeExample">Whether to include an example in the prompt. Default is true.</param>
        /// <param name="style">The style of prompt to generate. "minimal" or "detailed". Default is "minimal".</param>
        /// <returns>A prompt string for LLM LSF generation.</returns>
        /// <remarks>
        /// The prompts returned by this method are defined in docs/LLM_PROMPT.md
        /// to ensure consistency across all language implementations.
        /// </remarks>
        /// <example>
        /// <code>
        /// var prompt = LSFParser.GetLLMPrompt();
        /// var fullPrompt = $"{prompt}\n\nConvert this data: {JsonSerializer.Serialize(data)}";
        /// </code>
        /// </example>
        public static string GetLLMPrompt(bool includeExample = true, string style = "minimal")
        {
            if (style == "detailed")
            {
                return @"Generate output in LSF (LLM-Safe Format):

TOKENS:
- $o~ = start object
- $f~ = field name follows
- $v~ = value follows  
- $t~ = type hint follows (single character)

TYPES:
- n = integer (e.g., 42)
- f = float (e.g., 3.14)
- b = boolean (true/false)
- d = datetime (ISO format)
- s = string (optional, default)
- z = null

RULES:
1. NO quotes, brackets, or commas anywhere
2. NO newlines between tokens (continuous stream)
3. Arrays: repeat $v~ for same field
4. Multi-line strings: write actual newlines, not \n
5. Write all special characters as-is
6. NO escaping - write everything literally" +
(includeExample ? @"

EXAMPLE:
$o~$f~name$v~John Doe$f~age$v~30$t~n$f~active$v~true$t~b$f~tags$v~admin$v~user" : "");
            }

            // Minimal style (default)
            return @"Output in LSF format:
$o~=object, $f~=field, $v~=value, $t~=type(n=int,f=float,b=bool,d=date,z=null)
NO quotes/brackets. Arrays: repeat $v~. Continuous line." + 
(includeExample ? @"
Example: $o~$f~name$v~John$f~age$v~30$t~n$f~tags$v~a$v~b" : "");
        }

        #endregion
    }
} 