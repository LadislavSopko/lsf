/// <summary>
/// The Zerox.LSF namespace contains classes for parsing and encoding LSF (LLM-Safe Format) data.
/// </summary>
/// <remarks>
/// LSF is a minimal serialization format designed for reliable structured data generation by Large Language Models.
/// It uses only 3 structural tokens: $o~ (object), $f~ (field), and $v~ (value), with optional type hints via $t~.
/// 
/// Key features:
/// - Ultra-simple format with minimal tokens
/// - Streaming-safe parsing
/// - No nesting complexity
/// - Arrays handled via multiple values
/// - Optional type hints for data preservation
/// 
/// Main classes:
/// - LSFParser: Main entry point for parsing and encoding
/// - LSFParserOptions: Configuration options
/// - LSFNode: DOM node representation
/// - ParseResult: Result of parsing operations
/// </remarks>
namespace Zerox.LSF
{
    // This file exists only for namespace documentation
}