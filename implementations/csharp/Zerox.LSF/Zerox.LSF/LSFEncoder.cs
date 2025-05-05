using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace Zerox.LSF
{
    /// <summary>
    /// Encodes data structures into the LSF (LLM-Safe Format) string representation.
    /// </summary>
    public static class LSFEncoder
    {
        private const int DefaultCapacity = 256;

        // LSF Token Strings - consider constants or readonly fields if preferred
        private const string ObjectToken = "$o~";
        private const string FieldToken = "$f~";
        private const string ValueToken = "$v~";
        private const string TypeHintToken = "$t~";

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
            if (data == null) throw new ArgumentNullException(nameof(data));

            var sb = new StringBuilder(DefaultCapacity);
            
            // Start with the object token and optional name
            sb.Append(ObjectToken).Append(objectName);

            foreach (var kvp in data)
            {
                AppendField(sb, kvp.Key, kvp.Value);
            }

            return sb.ToString();
        }

        // TODO: Implement EncodeToArray(Dictionary<string, object?> data, string objectName = "")
        // public static byte[] EncodeToArray(Dictionary<string, object?> data, string objectName = "")
        // {
        //    string lsfString = EncodeToString(data, objectName);
        //    return Encoding.UTF8.GetBytes(lsfString); // Simple implementation
        // }

        private static void AppendField(StringBuilder sb, string fieldName, object? value)
        {
            sb.Append(FieldToken).Append(fieldName);
            AppendValue(sb, value, fieldName); // Pass fieldName for context in error messages
        }

        private static void AppendValue(StringBuilder sb, object? value, string contextFieldName)
        {
            if (value is string strValue)
            {
                // No type hint needed for string
                sb.Append(ValueToken).Append(strValue);
            }
            else if (value is int || value is long || value is float || value is double || value is decimal)
            {
                // Use InvariantCulture for consistent number formatting
                string numStr = Convert.ToString(value, CultureInfo.InvariantCulture) ?? string.Empty;
                sb.Append(ValueToken).Append(numStr).Append(TypeHintToken).Append('n');
            }
            else if (value is bool boolValue)
            {
                sb.Append(ValueToken).Append(boolValue ? "true" : "false").Append(TypeHintToken).Append('b');
            }
            else if (value == null)
            {
                sb.Append(ValueToken).Append(TypeHintToken).Append('z'); // Value is empty for null
            }
            else if (value is IEnumerable enumerable && !(value is string) && !(value is IDictionary)) // Handle lists/arrays, but not strings
            {
                 int count = 0;
                 foreach (var item in enumerable)
                 {
                     // Check for nested dictionaries *within* the enumerable
                     if (item is IDictionary)
                     {
                         throw new ArgumentException($"Nested objects are not supported in LSF 3.0. Field: '{contextFieldName}'");
                     }
                     
                     // LSF 3.0: Implicit array - append each item as a separate value under the same field
                     // Recursive call to handle nested values within the array item
                     AppendValue(sb, item, contextFieldName); 
                     count++;
                 }
                 // If the enumerable was empty, we need to ensure the field token still exists
                 // but has no $v~ following it. The AppendField call handles the $f~ part.
                 // If count == 0, nothing was appended here, which is correct.
            }
            else if (value is IDictionary)
            {
                 // LSF 3.0 does not support nested objects (handles dictionaries directly assigned to a field).
                 throw new ArgumentException($"Nested objects are not supported in LSF 3.0. Field: '{contextFieldName}'");
            }
            else
            {
                 // Attempt to convert unknown types to string, or throw?
                 // Let's throw for now to be strict.
                 throw new ArgumentException($"Unsupported data type '{value.GetType().Name}' encountered for field '{contextFieldName}'.");
            }
        }
    }
} 