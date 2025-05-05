using System;
using System.Collections.Generic;
using System.Text;
using Xunit;
using Zerox.LSF;

namespace Zerox.LSF.Tests
{
    public class LSFParserTests
    {
        private static readonly UTF8Encoding Utf8NoBom = new UTF8Encoding(false);

        // --- ParseToJsonString Tests --- 

        [Fact]
        public void ParseToJsonString_StringInput_ValidLsf_ReturnsJson()
        {
            string lsf = "$o~Test$f~Field$v~Value";
            string? json = LSFParser.ParseToJsonString(lsf);
            Assert.NotNull(json);
            Assert.Equal("{\"Field\":\"Value\"}", json); // Assuming basic normalization isn't needed here
        }

        [Fact]
        public void ParseToJsonString_StringInput_InvalidLsfRoot_ReturnsJson_Root_is_implicit()
        {
            string lsf = "$f~Field$v~Value"; // Starts with field
            string? json = LSFParser.ParseToJsonString(lsf);
            Assert.NotNull(json);
            Assert.Equal("{\"Field\":\"Value\"}", json); // Assuming basic normalization isn't needed here
        }

        [Fact]
        public void ParseToJsonString_StringInput_Empty_ReturnsNull()
        {
            string? json = LSFParser.ParseToJsonString(string.Empty);
            Assert.Null(json);
        }

        [Fact]
        public void ParseToJsonString_BytesInput_ValidLsf_ReturnsJson()
        {
            string lsf = "$o~Bytes$f~Data$v~123$t~n";
            var bytes = Utf8NoBom.GetBytes(lsf);
            string? json = LSFParser.ParseToJsonString(bytes);
            Assert.NotNull(json);
            Assert.Equal("{\"Data\":123}", json);
        }

        [Fact]
        public void ParseToJsonString_BytesInput_InvalidLsfRoot_ReturnsJson_Root_is_implicit()
        {
            string lsf = "$v~Value"; // Starts with value
            var bytes = Utf8NoBom.GetBytes(lsf);
            string? json = LSFParser.ParseToJsonString(bytes);
            string expectedJson = "{\"\":\"Value\"}"; // Implicit field has empty name
            Assert.Equal(expectedJson, json);
        }

        // --- ParseToDom Tests --- 

        [Fact]
        public void ParseToDom_StringInput_ValidLsf_ReturnsSuccessResult()
        {
            string lsf = "$o~Obj$f~F$v~V";
            var result = LSFParser.ParseToDom(lsf);
            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            Assert.Equal(3, result.Nodes.Count);
            Assert.Null(result.ErrorMessage);
        }

        [Fact]
        public void ParseToDom_StringInput_InvalidStructure_ReturnsSuccessWithImplicitNodes()
        {
            // DOMBuilder handles implicit nodes
            string lsf = "$f~F$v~V"; 
            var result = LSFParser.ParseToDom(lsf);
            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            Assert.Equal(3, result.Nodes.Count); // Implicit Obj, Field, Value
        }

        [Fact]
        public void ParseToDom_StringInput_Empty_ReturnsSuccessEmpty()
        {
             var result = LSFParser.ParseToDom(string.Empty);
            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            Assert.Empty(result.Nodes);
        }

        [Fact]
        public void ParseToDom_BytesInput_ValidLsf_ReturnsSuccessResult()
        {
             string lsf = "$o~Obj$f~F$v~V";
             var bytes = Utf8NoBom.GetBytes(lsf);
             var result = LSFParser.ParseToDom(bytes);
            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            Assert.Equal(3, result.Nodes.Count);
        }

        // --- Encoding Tests (Delegate Check) --- 

         [Fact]
        public void EncodeToString_CallsLSFEncoder()
        {
             var data = new Dictionary<string, object?> { { "A", 1 } };
             string expected = LSFEncoder.EncodeToString(data, "TestObj"); // Use encoder directly for expected
             string actual = LSFParser.EncodeToString(data, "TestObj");
             Assert.Equal(expected, actual);
        }

        [Fact]
        public void EncodeToArray_CallsLSFEncoder()
        {
             var data = new Dictionary<string, object?> { { "B", true } };
             byte[] expected = LSFEncoder.EncodeToArray(data);
             byte[] actual = LSFParser.EncodeToArray(data);
             Assert.Equal(expected, actual);
        }
    }
} 