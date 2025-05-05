using System;

namespace Zerox.LSF
{
    /// <summary>
    /// Represents the types of tokens found in an LSF stream.
    /// </summary>
    public enum TokenType : byte
    {
        /// <summary>
        /// Represents an unknown or uninitialized token type.
        /// </summary>
        Unknown = 0,

        /// <summary>
        /// The object token: $o~
        /// </summary>
        Object,

        /// <summary>
        /// The field token: $f~
        /// </summary>
        Field,

        /// <summary>
        /// The value token: $v~
        /// </summary>
        Value,

        /// <summary>
        /// The type hint token: $t~
        /// </summary>
        TypeHint
    }
} 