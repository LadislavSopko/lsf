using System;
using System.Text;
using Xunit;
using Zerox.LSF;

namespace Zerox.LSF.Tests
{
    public class LSFToJSONVisitorTests
    {
        private static readonly UTF8Encoding Utf8NoBom = new UTF8Encoding(false);

        // Helper to run scan, build, navigate, and convert to JSON
        private string? ConvertLsfToJson(string lsfString)
        {
            var inputBytes = Utf8NoBom.GetBytes(lsfString);
            ReadOnlySpan<byte> inputSpan = inputBytes; // Explicitly create span
            var tokens = TokenScanner.Scan(inputSpan);
            var parseResult = DOMBuilder.Build(tokens, inputSpan);
            if (!parseResult.Success || parseResult.Nodes == null)
            {
                // If build failed, return an indicator or throw? For tests, null might suffice.
                return null;
            }
            // DOMNavigator constructor takes ReadOnlyMemory<byte>, so use the original array
            var navigator = new DOMNavigator(inputBytes, parseResult.Nodes);
            return LSFToJSONVisitor.ToJsonString(navigator);
        }

        // Helper to normalize JSON string (remove insignificant whitespace)
        private string NormalizeJson(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return string.Empty;
            // Very basic normalization: remove spaces after commas, colons, braces, brackets.
            // A proper JSON parser/serializer would be better for robust comparison.
            return json.Replace(": ", ":")
                       .Replace(", ", ",")
                       .Replace("{ ", "{")
                       .Replace(" }", "}")
                       .Replace("[ ", "[")
                       .Replace(" ]", "]");
        }

        [Fact]
        public void ToJsonString_SimpleObject_CorrectJson()
        {
            string lsf = "$o~$f~name$v~Test$f~value$v~123";
            string expectedJson = "{\"name\":\"Test\",\"value\":\"123\"}";
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }

        [Fact]
        public void ToJsonString_ImplicitArray_CorrectJsonArray()
        {
            string lsf = "$o~$f~items$v~A$v~B$v~C";
            string expectedJson = "{\"items\":[\"A\",\"B\",\"C\"]}";
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }

        [Fact]
        public void ToJsonString_TypeHints_CorrectJsonTypes()
        {
            string lsf = "$o~$f~num$v~100.5$t~n$f~boolT$v~true$t~b$f~boolF$v~false$t~b$f~nil$v~$t~z$f~str$v~Hello";
            string expectedJson = "{\"num\":100.5,\"boolT\":true,\"boolF\":false,\"nil\":null,\"str\":\"Hello\"}";
            string? actualJson = ConvertLsfToJson(lsf);
             Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }

        [Fact]
        public void ToJsonString_EmptyObject_CorrectEmptyJsonObject()
        {
            string lsf = "$o~";
            string expectedJson = "{}";
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }
        
        [Fact]
        public void ToJsonString_ObjectWithEmptyFieldsAndValues_CorrectJson()
        {
            string lsf = "$o~$f~$v~$f~key$v~"; // Empty field name, empty value, key with empty value
            string expectedJson = "{\"\":\"\",\"key\":\"\"}";
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }

        [Fact]
        public void ToJsonString_StringEscaping_CorrectlyEscaped()
        {
            string lsf = "$o~$f~quote$v~\"Hello\"$f~slash$v~\\path\\$f~control$v~\t\n\r"; // Quotes, backslashes, control chars
            string expectedJson = "{\"quote\":\"\\u0022Hello\\u0022\",\"slash\":\"\\\\path\\\\\",\"control\":\"\\t\\n\\r\"}";
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }

        [Fact]
        public void ToJsonString_EmptyLsf_ReturnsNull()
        {
            string lsf = "";
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Null(actualJson);
        }

        [Fact]
        public void ToJsonString_LsfStartingWithField_ReturnsCorrectJson()
        {
            // DOMBuilder creates an implicit root object.
            // Visitor should convert this structure.
            string lsf = "$f~field$v~value";
            string expectedJson = "{\"field\":\"value\"}"; // Implicit object has no name
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson)); 
        }

        [Fact]
        public void ToJsonString_LsfStartingWithValue_ReturnsCorrectJson()
        {
             // DOMBuilder creates an implicit root object and implicit field.
             // Visitor should convert this structure.
            string lsf = "$v~value";
            string expectedJson = "{\"\":\"value\"}"; // Implicit field has empty name
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }

        [Fact]
        public void ToJsonString_FieldWithNoValue_ReturnsJsonNull()
        {
            string lsf = "$o~$f~emptyField";
            string expectedJson = "{\"emptyField\":null}";
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }

         [Fact]
        public void ToJsonString_InvalidNumberHint_ReturnsJsonNull()
        {
            string lsf = "$o~$f~badNum$v~abc$t~n";
            string expectedJson = "{\"badNum\":null}";
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }

        [Fact]
        public void ToJsonString_InvalidBooleanHint_ReturnsJsonNull()
        {
            string lsf = "$o~$f~badBool$v~yes$t~b";
            string expectedJson = "{\"badBool\":null}";
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }

        // Multi-object JSON tests
        [Fact]
        public void ToJsonString_MultipleObjects_ReturnsArrayOfObjects()
        {
            string lsf = "$o~user1$f~name$v~Alice$f~age$v~25$t~n$o~user2$f~name$v~Bob$f~age$v~30$t~n";
            // Multiple root objects should be wrapped in an array
            string expectedJson = "[{\"name\":\"Alice\",\"age\":25},{\"name\":\"Bob\",\"age\":30}]";
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }

        [Fact]
        public void ToJsonString_MultipleAnonymousObjects_ReturnsArrayOfObjects()
        {
            string lsf = "$o~$f~type$v~first$o~$f~type$v~second$o~$f~type$v~third";
            string expectedJson = "[{\"type\":\"first\"},{\"type\":\"second\"},{\"type\":\"third\"}]";
            string? actualJson = ConvertLsfToJson(lsf);
            Assert.Equal(NormalizeJson(expectedJson), NormalizeJson(actualJson));
        }

        [Fact]
        public void ToJsonString_SingleObjectAfterMultiple_StillWorksCorrectly()
        {
            // First parse multiple objects
            string lsfMulti = "$o~$f~id$v~1$t~n$o~$f~id$v~2$t~n";
            string expectedMulti = "[{\"id\":1},{\"id\":2}]";
            string? actualMulti = ConvertLsfToJson(lsfMulti);
            Assert.Equal(NormalizeJson(expectedMulti), NormalizeJson(actualMulti));

            // Then parse single object - should not be affected by previous parsing
            string lsfSingle = "$o~single$f~name$v~Solo";
            string expectedSingle = "{\"name\":\"Solo\"}";
            string? actualSingle = ConvertLsfToJson(lsfSingle);
            Assert.Equal(NormalizeJson(expectedSingle), NormalizeJson(actualSingle));
        }
    }
} 