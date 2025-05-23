using System;
using System.Collections.Generic;

namespace Zerox.LSF
{
    /// <summary>
    /// Builds an LSF Document Object Model (DOM) from a list of tokens and the original input.
    /// </summary>
    public static class DOMBuilder
    {
        private const int InitialNodeCapacity = 64; // Starting capacity for the node list
        private const int TokenLength = 3; // $o~, $f~, $v~, $t~
        private const int InvalidIndex = -1;

        /// <summary>
        /// Builds the LSF DOM from scanned tokens using default options.
        /// </summary>
        /// <param name="tokens">The list of tokens identified by the TokenScanner.</param>
        /// <param name="input">The original input byte span.</param>
        /// <returns>A ParseResult containing the list of LSFNodes or error information.</returns>
        public static ParseResult Build(List<TokenScanner.TokenInfo> tokens, ReadOnlySpan<byte> input)
        {
            return Build(tokens, input, LSFParserOptions.Default);
        }

        /// <summary>
        /// Builds the LSF DOM from scanned tokens.
        /// </summary>
        /// <param name="tokens">The list of tokens identified by the TokenScanner.</param>
        /// <param name="input">The original input byte span.</param>
        /// <param name="options">Parser options.</param>
        /// <returns>A ParseResult containing the list of LSFNodes or error information.</returns>
        public static ParseResult Build(List<TokenScanner.TokenInfo> tokens, ReadOnlySpan<byte> input, LSFParserOptions options)
        {
            var nodes = new List<LSFNode>(tokens.Count > 0 ? tokens.Count + tokens.Count / 2 : InitialNodeCapacity); // Heuristic capacity
            int currentObjectParentIndex = InvalidIndex; // Track the index of the current $o~
            int currentFieldParentIndex = InvalidIndex;  // Track the index of the current $f~
            int lastValueNodeIndex = InvalidIndex;     // Track the index of the most recent $v~ node for type hints

            if (tokens == null || tokens.Count == 0)
            {
                // Handle empty input or no tokens found
                return new ParseResult { Success = true, Nodes = nodes }; // Empty but valid DOM
            }

            // --- Main Loop to process tokens and build nodes --- 
            for (int i = 0; i < tokens.Count; i++)
            {
                var currentToken = tokens[i];
                int dataStart = currentToken.Position + TokenLength;
                int dataEnd = (i + 1 < tokens.Count) ? tokens[i + 1].Position : input.Length;
                int dataLength = Math.Max(0, dataEnd - dataStart);
                int currentNodeIndex;

                switch (currentToken.Type)
                {
                    case TokenType.Object:
                        currentNodeIndex = AddNode(ref nodes, TokenType.Object, currentToken.Position, dataStart, dataLength, InvalidIndex); 
                        currentObjectParentIndex = currentNodeIndex;
                        currentFieldParentIndex = InvalidIndex; // Reset field context
                        lastValueNodeIndex = InvalidIndex;
                        break;
                    case TokenType.Field:
                        if (currentObjectParentIndex == InvalidIndex)
                        {
                             // Implicit Object Root if Field appears first
                            currentObjectParentIndex = AddImplicitNode(ref nodes, TokenType.Object, currentToken.Position, InvalidIndex);
                        }
                        currentNodeIndex = AddNode(ref nodes, TokenType.Field, currentToken.Position, dataStart, dataLength, currentObjectParentIndex);
                        currentFieldParentIndex = currentNodeIndex;
                        lastValueNodeIndex = InvalidIndex;
                        break;
                    case TokenType.Value:
                        if (currentFieldParentIndex == InvalidIndex)
                        {
                            // Implicit Field needed
                            if (currentObjectParentIndex == InvalidIndex)
                            {
                                // Implicit Object Root if Value appears first
                                currentObjectParentIndex = AddImplicitNode(ref nodes, TokenType.Object, currentToken.Position, InvalidIndex);
                            }
                             // Implicit Field creation
                            currentFieldParentIndex = AddImplicitNode(ref nodes, TokenType.Field, currentToken.Position, currentObjectParentIndex);
                        }
                        currentNodeIndex = AddNode(ref nodes, TokenType.Value, currentToken.Position, dataStart, dataLength, currentFieldParentIndex);
                        lastValueNodeIndex = currentNodeIndex;
                        break;
                    case TokenType.TypeHint:
                        if (lastValueNodeIndex != InvalidIndex && dataLength > 0) // Hint must follow a value and have data
                        {
                           ApplyTypeHint(ref nodes, lastValueNodeIndex, input.Slice(dataStart, dataLength), options);
                        }
                        // Type hints don't create nodes and only apply once
                        lastValueNodeIndex = InvalidIndex; 
                        break;
                    default:
                        // Should not happen with valid TokenInfo
                        return new ParseResult { Success = false, ErrorMessage = $"Build Error: Unexpected token type encountered: {currentToken.Type} at position {currentToken.Position}" };
                }
            }

            // --- Post-Loop: Populate Children Indices --- 
            PopulateChildren(ref nodes);

            return new ParseResult { Success = true, Nodes = nodes };
        }

        private static int AddNode(ref List<LSFNode> nodes, TokenType type, int tokenPos, int dataPos, int dataLen, int parentIdx)
        {
            nodes.Add(new LSFNode
            {
                Type = type,
                TokenPosition = tokenPos,
                DataPosition = dataPos,
                DataLength = dataLen,
                ParentIndex = parentIdx,
                TypeHint = ValueHint.String, // Default
                ChildrenIndices = null // Initialize as null
            });
            return nodes.Count - 1; // Return index of the added node
        }

        private static int AddImplicitNode(ref List<LSFNode> nodes, TokenType type, int associatedTokenPos, int parentIdx)
        {
             // Implicit nodes have no token of their own and no data
            return AddNode(ref nodes, type, associatedTokenPos, 0, 0, parentIdx);
        }

        private static void ApplyTypeHint(ref List<LSFNode> nodes, int targetNodeIndex, ReadOnlySpan<byte> hintData, LSFParserOptions options)
        {
            if (targetNodeIndex < 0 || targetNodeIndex >= nodes.Count) return;

            // Ensure we modify the node in the list directly if LSFNode remains a struct
            LSFNode nodeToUpdate = nodes[targetNodeIndex]; 

            if (hintData.Length > 0)
            {
                byte hintChar = hintData[0];
                switch ((char)hintChar)
                {
                    case 'n':
                        nodeToUpdate.TypeHint = ValueHint.Number;
                        break;
                    case 'f':
                        nodeToUpdate.TypeHint = ValueHint.Float;
                        break;
                    case 'b':
                        nodeToUpdate.TypeHint = ValueHint.Boolean;
                        break;
                    case 'd':
                        nodeToUpdate.TypeHint = ValueHint.DateTime;
                        break;
                    case 's':
                        nodeToUpdate.TypeHint = ValueHint.String;
                        break;
                    case 'z':
                        nodeToUpdate.TypeHint = ValueHint.Null;
                        break;
                    default:
                        if (options.ValidateTypeHints)
                        {
                            throw new ArgumentException($"Invalid type hint '{(char)hintChar}' at position {nodes[targetNodeIndex].TokenPosition}. Valid types are: n, f, b, d, s");
                        }
                        // If validation is disabled, default to string
                        nodeToUpdate.TypeHint = ValueHint.String;
                        break;
                }
            }
            // Update the node in the list
            nodes[targetNodeIndex] = nodeToUpdate;
        }

        private static void PopulateChildren(ref List<LSFNode> nodes)
        {
            for (int i = 0; i < nodes.Count; i++)
            {
                int parentIndex = nodes[i].ParentIndex;
                if (parentIndex != InvalidIndex)
                {
                    // Ensure parent exists (sanity check)
                    if (parentIndex < 0 || parentIndex >= nodes.Count)
                    {
                         // This indicates a bug in the builder logic
                         // Consider throwing an exception or logging an error
                         // For now, skip to avoid crash
                        continue; 
                    }
                    
                    LSFNode parentNode = nodes[parentIndex]; // Get the parent node
                    if (parentNode.ChildrenIndices == null)
                    {
                        parentNode.ChildrenIndices = new List<int>(4); // Initial capacity for children
                    }
                    parentNode.ChildrenIndices.Add(i); // Add current node index to parent's children
                    nodes[parentIndex] = parentNode; // IMPORTANT: Update the struct in the list
                }
            }
        }

        // --- Helper methods for implicit node creation, adding children, etc. will go here --- 

    }
} 