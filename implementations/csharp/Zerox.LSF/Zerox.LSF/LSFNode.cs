using System;

namespace Zerox.LSF
{
    /// <summary>
    /// Represents a node in the LSF Document Object Model (DOM).
    /// This structure will be refined during DOMBuilder implementation.
    /// </summary>
    public struct LSFNode
    {
        // Placeholder - structure to be defined
        public TokenType Type;
        public int StartPosition; // Start index of the token in the input buffer
        public int DataPosition; // Start index of the data associated with this token
        public int DataLength; // Length of the data associated with this token

        // We'll likely need references to parent/children, perhaps indices into an array.
        // public int ParentIndex;
        // public int[] ChildrenIndices;
    }
} 