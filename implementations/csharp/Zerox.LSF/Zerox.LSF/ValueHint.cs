namespace Zerox.LSF
{
    /// <summary>
    /// Represents the type hint associated with an LSF value ($v~) token.
    /// </summary>
    public enum ValueHint : byte
    {
        /// <summary>
        /// Default type if no hint is provided or the hint is invalid.
        /// Corresponds to a string value.
        /// </summary>
        String = 0,

        /// <summary>
        /// Hint for a numeric value ($t~n).
        /// </summary>
        Number,

        /// <summary>
        /// Hint for a boolean value ($t~b).
        /// </summary>
        Boolean,

        /// <summary>
        /// Hint for a null value ($t~z).
        /// </summary>
        Null
    }
} 