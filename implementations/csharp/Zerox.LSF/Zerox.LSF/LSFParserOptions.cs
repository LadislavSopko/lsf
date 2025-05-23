namespace Zerox.LSF
{
    /// <summary>
    /// Options for configuring LSF parser behavior.
    /// </summary>
    public class LSFParserOptions
    {
        /// <summary>
        /// Maximum allowed input size in bytes.
        /// Default: 10MB (10 * 1024 * 1024 bytes)
        /// </summary>
        public int MaxInputSize { get; set; } = 10 * 1024 * 1024;

        /// <summary>
        /// Whether to validate type hints during parsing.
        /// Default: true
        /// </summary>
        public bool ValidateTypeHints { get; set; } = true;

        /// <summary>
        /// Default options instance with standard settings.
        /// </summary>
        public static LSFParserOptions Default { get; } = new LSFParserOptions();
    }
}