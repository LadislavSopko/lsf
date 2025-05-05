using System;
using System.Collections.Generic;
using Xunit;
using Zerox.LSF;

namespace Zerox.LSF.Tests
{
    public class LSFEncoderTests
    {
        [Fact]
        public void EncodeToString_SimpleObject_CorrectLSF()
        {
            var data = new Dictionary<string, object?>
            {
                { "Name", "Test" },
                { "Value", 123 }
            };
            string expected = "$o~$f~Name$v~Test$f~Value$v~123$t~n";
            string actual = LSFEncoder.EncodeToString(data);
            Assert.Equal(expected, actual);
        }

        [Fact]
        public void EncodeToString_WithObjectName_CorrectLSF()
        {
             var data = new Dictionary<string, object?>
            {
                { "Id", 456 }
            };
            string expected = "$o~MyObject$f~Id$v~456$t~n";
            string actual = LSFEncoder.EncodeToString(data, "MyObject");
            Assert.Equal(expected, actual);
        }

        [Fact]
        public void EncodeToString_AllPrimitiveTypes_CorrectLSFWithHints()
        {
            var data = new Dictionary<string, object?>
            {
                { "String", "Hello" },
                { "Integer", -10 },
                { "Long", 1234567890123L },
                { "Float", 123.45f },
                { "Double", -987.654 },
                { "Decimal", 10.99m },
                { "BoolTrue", true },
                { "BoolFalse", false },
                { "NullValue", null }
            };
            string expected = "$o~" +
                              "$f~String$v~Hello" +
                              "$f~Integer$v~-10$t~n" +
                              "$f~Long$v~1234567890123$t~n" +
                              "$f~Float$v~123.45$t~n" +
                              "$f~Double$v~-987.654$t~n" +
                              "$f~Decimal$v~10.99$t~n" +
                              "$f~BoolTrue$v~true$t~b" +
                              "$f~BoolFalse$v~false$t~b" +
                              "$f~NullValue$v~$t~z";
            string actual = LSFEncoder.EncodeToString(data);
            Assert.Equal(expected, actual);
        }

        [Fact]
        public void EncodeToString_ImplicitArray_CorrectLSFValues()
        {
            var data = new Dictionary<string, object?>
            {
                { "items", new List<string> { "A", "B", "C" } }
            };
            string expected = "$o~$f~items$v~A$v~B$v~C";
            string actual = LSFEncoder.EncodeToString(data);
            Assert.Equal(expected, actual);
        }

        [Fact]
        public void EncodeToString_ImplicitArrayWithMixedTypes_CorrectLSFValuesAndHints()
        {
             var data = new Dictionary<string, object?>
            {
                { "mixed", new List<object?> { "Text", 10, true, null, 25.5 } }
            };
            string expected = "$o~$f~mixed$v~Text$v~10$t~n$v~true$t~b$v~$t~z$v~25.5$t~n";
            string actual = LSFEncoder.EncodeToString(data);
            Assert.Equal(expected, actual);
        }

         [Fact]
        public void EncodeToString_EmptyList_AppendsOnlyFieldToken()
        {
            var data = new Dictionary<string, object?>
            {
                { "emptyList", new List<int>() }
            };
            string expected = "$o~$f~emptyList"; // No $v~ tokens should follow
            string actual = LSFEncoder.EncodeToString(data);
            Assert.Equal(expected, actual);
        }

        [Fact]
        public void EncodeToString_EmptyDictionary_ReturnsOnlyObjectToken()
        {
            var data = new Dictionary<string, object?>();
            string expected = "$o~";
            string actual = LSFEncoder.EncodeToString(data);
            Assert.Equal(expected, actual);
        }

        [Fact]
        public void EncodeToString_NullData_ThrowsArgumentNullException()
        {
            Assert.Throws<ArgumentNullException>(() => LSFEncoder.EncodeToString(null!));
        }

        [Fact]
        public void EncodeToString_NestedDictionary_ThrowsArgumentException()
        {
             var data = new Dictionary<string, object?>
            {
                { "level1", new Dictionary<string, object?> { { "level2", "value" } } }
            };
            var ex = Assert.Throws<ArgumentException>(() => LSFEncoder.EncodeToString(data));
            Assert.Contains("Nested objects are not supported", ex.Message);
            Assert.Contains("level1", ex.Message);
        }

        [Fact]
        public void EncodeToString_NestedListDictionary_ThrowsArgumentException()
        {
             var data = new Dictionary<string, object?>
            {
                { "list", new List<object?> { "A", new Dictionary<string, object?> { { "nested", true } } } }
            };
             var ex = Assert.Throws<ArgumentException>(() => LSFEncoder.EncodeToString(data));
             Assert.Contains("Nested objects are not supported", ex.Message);
             Assert.Contains("list", ex.Message);
        }

        [Fact]
        public void EncodeToString_UnsupportedType_ThrowsArgumentException()
        {
             var data = new Dictionary<string, object?>
            {
                { "unsupported", new System.IO.MemoryStream() } // Example of an unsupported type
            };
            var ex = Assert.Throws<ArgumentException>(() => LSFEncoder.EncodeToString(data));
            Assert.Contains("Unsupported data type", ex.Message);
            Assert.Contains("MemoryStream", ex.Message);
             Assert.Contains("unsupported", ex.Message);
        }

        [Fact]
        public void EncodeToString_EmptyFieldName_Allowed()
        {
            var data = new Dictionary<string, object?>
            {
                { "", "EmptyFieldName" }
            };
            string expected = "$o~$f~$v~EmptyFieldName";
            string actual = LSFEncoder.EncodeToString(data);
            Assert.Equal(expected, actual);
        }
        
         [Fact]
        public void EncodeToString_EmptyStringValue_Allowed()
        {
            var data = new Dictionary<string, object?>
            {
                { "emptyString", "" }
            };
            string expected = "$o~$f~emptyString$v~";
            string actual = LSFEncoder.EncodeToString(data);
            Assert.Equal(expected, actual);
        }
    }
} 