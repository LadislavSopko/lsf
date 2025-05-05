using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Text.Json;

namespace Zerox.LSF
{
    /// <summary>
    /// Visitor implementation that converts an LSF DOM into a JSON string.
    /// </summary>
    public class LSFToJSONVisitor // Not implementing IVisitor directly, uses helper methods
    {
        private const int DefaultStringBuilderCapacity = 256;
        private readonly StringBuilder _sb;
        private readonly DOMNavigator _navigator;

        private LSFToJSONVisitor(DOMNavigator navigator)
        {
            _navigator = navigator;
            _sb = new StringBuilder(DefaultStringBuilderCapacity);
        }

        /// <summary>
        /// Converts the LSF DOM provided by the navigator into a JSON string.
        /// Assumes a single root object, as per strict LSF specification.
        /// If multiple roots are found (due to implicit nodes), only the first is processed.
        /// </summary>
        /// <param name="navigator">The DOM navigator containing the parsed LSF.</param>
        /// <returns>A JSON string representation, or null if the DOM is empty or invalid.</returns>
        public static string? ToJsonString(DOMNavigator navigator)
        {
            var rootIndices = navigator.GetRootIndices().ToList();
            if (rootIndices.Count == 0)
            {
                return null; // No root node found
            }

            // As per LSF spec, only one root object is strictly valid.
            // We process the first root found.
            int rootIndex = rootIndices[0];
            var rootNode = navigator.GetNode(rootIndex);

            // Check if the root is an Object. Accept implicit roots built by DOMBuilder.
            if (rootNode.Type != TokenType.Object)
            {
                // Handle cases where the root isn't an object (shouldn't happen if builder guarantees root object?).
                // Return null indicating unexpected structure.
                return null; 
            }

            var visitor = new LSFToJSONVisitor(navigator);
            visitor.VisitObjectNode(rootIndex, rootNode);
            return visitor._sb.ToString();
        }

        private void VisitObjectNode(int nodeIndex, LSFNode node)
        {
            _sb.Append('{');
            bool firstField = true;
            foreach (int childIndex in _navigator.GetChildrenIndices(nodeIndex))
            {
                var childNode = _navigator.GetNode(childIndex);
                if (childNode.Type == TokenType.Field)
                {
                    if (!firstField)
                    {
                        _sb.Append(',');
                    }
                    VisitFieldNode(childIndex, childNode);
                    firstField = false;
                }
                // Ignore non-field children of objects if any somehow exist
            }
            _sb.Append('}');
        }

        private void VisitFieldNode(int nodeIndex, LSFNode node)
        {
            // Append field name (JSON escaped string)
            AppendJsonString(_navigator.GetNodeDataAsString(nodeIndex)); 
            _sb.Append(':');

            var valueIndices = _navigator.GetChildrenIndices(nodeIndex).ToList();

            if (valueIndices.Count == 0)
            {
                _sb.Append("null"); // Field with no value
            }
            else if (valueIndices.Count == 1)
            {
                // Single value
                VisitValueNode(valueIndices[0], _navigator.GetNode(valueIndices[0]));
            }
            else
            {
                // Implicit array
                _sb.Append('[');
                bool firstValue = true;
                foreach (int valueIndex in valueIndices)
                {
                     var valueNode = _navigator.GetNode(valueIndex);
                     if(valueNode.Type == TokenType.Value) // Ensure it's a value node
                     {
                        if (!firstValue)
                        {
                            _sb.Append(',');
                        }
                        VisitValueNode(valueIndex, valueNode);
                        firstValue = false;
                     }
                }
                _sb.Append(']');
            }
        }

        private void VisitValueNode(int nodeIndex, LSFNode node)
        {
            string data = _navigator.GetNodeDataAsString(nodeIndex);
            switch (node.TypeHint)
            {
                case ValueHint.Number:
                    // Basic validation: Try parsing, default to 0 if invalid?
                    // Or just append raw data? Let's append raw for now, assuming valid LSF.
                    if (string.IsNullOrEmpty(data) || !IsValidJsonNumber(data))
                    {
                        _sb.Append("null"); // Or 0? Or throw? Let's use null for invalid number hint.
                    }
                    else
                    {
                         _sb.Append(data); 
                    }
                    break;
                case ValueHint.Boolean:
                    // Check common boolean string representations
                    if (bool.TryParse(data, out bool boolValue))
                    {
                         _sb.Append(boolValue ? "true" : "false");
                    }
                    else
                    {
                        // What to do if data isn't 'true' or 'false'? Append null?
                        _sb.Append("null"); 
                    }
                    break;
                case ValueHint.Null:
                    _sb.Append("null");
                    break;
                case ValueHint.String:
                default:
                    AppendJsonString(data);
                    break;
            }
        }

        // Basic JSON string escaping helper
        private void AppendJsonString(string? value)
        {
            _sb.Append(JsonSerializer.Serialize(value));
            //if (string.IsNullOrEmpty(value)) 
            //{ 
            //     _sb.Append('"');
            //     return; 
            //}

            //foreach (char c in value)
            //{
            //    switch (c)
            //    {
            //        case '\\': _sb.Append("\\"); break;
            //        case '"': _sb.Append("\""); break;
            //        case '\b': _sb.Append("\b"); break;
            //        case '\f': _sb.Append("\f"); break;
            //        case '\n': _sb.Append("\n"); break;
            //        case '\r': _sb.Append("\r"); break;
            //        case '\t': _sb.Append("\t"); break;
            //        default:
            //            if (c < ' ')
            //            {
            //                // Append unicode escape for control characters
            //                _sb.Append("\\u");
            //                _sb.Append(((int)c).ToString("X4", CultureInfo.InvariantCulture));
            //            }
            //            else
            //            {
            //                _sb.Append(c);
            //            }
            //            break;
            //    }
            //}
            //_sb.Append('"');
        }

        // Basic check if a string is a valid JSON number format
        private static bool IsValidJsonNumber(string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return false;
            // Very basic check - allows leading zeros, etc. which might not be ideal
            // A more robust check would use double.TryParse with specific styles
            // or a regex, but this covers basic cases.
            if (s.Contains("Infinity") || s.Contains("NaN")) return false;
            return double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out _);
        }
    }
} 