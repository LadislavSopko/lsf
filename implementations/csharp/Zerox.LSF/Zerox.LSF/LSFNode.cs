using System;
using System.Collections.Generic;
using System.Diagnostics;

namespace Zerox.LSF
{
    /// <summary>
    /// Represents a node in the LSF Document Object Model (DOM).
    /// This structure holds information about the token type, its position,
    /// the data it represents, its relationship to other nodes, and any type hint.
    /// </summary>
    [DebuggerDisplay("{Type} @ {TokenPosition}, DataPos={DataPosition}, DataLen={DataLength}, Parent={ParentIndex}, Hint={TypeHint}")]
    public struct LSFNode
    {
        /// <summary>
        /// The type of the token that generated this node (Object, Field, Value).
        /// Note: TypeHint tokens do not create their own nodes but modify Value nodes.
        /// </summary>
        public TokenType Type;

        /// <summary>
        /// The starting position (index) of the token ($o~, $f~, $v~) in the original input byte span.
        /// </summary>
        public int TokenPosition;

        /// <summary>
        /// The starting position (index) of the data associated with this node within the input byte span.
        /// This follows the token itself.
        /// </summary>
        public int DataPosition;

        /// <summary>
        /// The length (in bytes) of the data associated with this node.
        /// </summary>
        public int DataLength;

        /// <summary>
        /// The index of the parent node in the node list. -1 indicates no explicit parent (root or implicitly created root).
        /// </summary>
        public int ParentIndex;

        /// <summary>
        /// A list of indices pointing to the child nodes in the node list. Null if no children.
        /// Populated during the DOM building phase.
        /// </summary>
        public List<int>? ChildrenIndices; // Using List for easier adding during build

        /// <summary>
        /// The type hint associated with a Value node. Defaults to String.
        /// </summary>
        public ValueHint TypeHint; // Default is String (0)
    }
} 