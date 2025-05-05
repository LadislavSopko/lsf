using System;
using System.Collections.Generic;

namespace Zerox.LSF
{
    /// <summary>
    /// Represents the result of parsing an LSF input.
    /// Holds the constructed DOM and any potential error information.
    /// </summary>
    public class ParseResult
    {
        /// <summary>
        /// Gets the collection of nodes representing the parsed LSF DOM.
        /// The exact structure (e.g., List, array, custom collection) might be refined.
        /// </summary>
        public List<LSFNode>? Nodes { get; internal set; }

        /// <summary>
        /// Gets a value indicating whether the parsing was successful.
        /// </summary>
        public bool Success { get; internal set; }

        /// <summary>
        /// Gets error message if parsing failed.
        /// </summary>
        public string? ErrorMessage { get; internal set; }

        // Potentially add more details like error position, etc.
    }
} 