using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Xunit;
using Zerox.LSF; // Assuming your main library namespace is Zerox.LSF

namespace Zerox.LSF.Tests
{
    public class DOMBuilderTests
    {
        private static readonly UTF8Encoding Utf8NoBom = new UTF8Encoding(false);

        // Helper to run scan and build
        private ParseResult BuildDom(string lsfString)
        {
            var inputBytes = Utf8NoBom.GetBytes(lsfString);
            var tokens = TokenScanner.Scan(inputBytes);
            return DOMBuilder.Build(tokens, inputBytes);
        }

        // Helper to get node data as string
        private string GetData(LSFNode node, string originalInput)
        {
            if (node.DataLength <= 0) return string.Empty;
            var inputBytes = Utf8NoBom.GetBytes(originalInput);
            return Utf8NoBom.GetString(inputBytes.AsSpan().Slice(node.DataPosition, node.DataLength));
        }

        [Fact]
        public void Build_EmptyInput_ReturnsSuccessEmptyNodes()
        {
            var result = BuildDom(string.Empty);
            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            Assert.Empty(result.Nodes);
        }

        [Fact]
        public void Build_NoTokensInput_ReturnsSuccessEmptyNodes()
        {
            var result = BuildDom("Just plain text.");
            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            Assert.Empty(result.Nodes);
        }

        [Fact]
        public void Build_SimpleObjectFieldValues_CorrectStructure()
        {
            string lsf = "$o~Root$f~Name$v~Test$f~Value$v~123";
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(5, nodes.Count);

            // Root Object [0]
            var root = nodes[0];
            Assert.Equal(TokenType.Object, root.Type);
            Assert.Equal(-1, root.ParentIndex);
            Assert.Equal("Root", GetData(root, lsf));
            Assert.NotNull(root.ChildrenIndices);
            Assert.Equal(2, root.ChildrenIndices.Count); 
            Assert.Contains(1, root.ChildrenIndices); // Field Name
            Assert.Contains(3, root.ChildrenIndices); // Field Value

            // Field Name [1]
            var fieldName = nodes[1];
            Assert.Equal(TokenType.Field, fieldName.Type);
            Assert.Equal(0, fieldName.ParentIndex);
            Assert.Equal("Name", GetData(fieldName, lsf));
            Assert.NotNull(fieldName.ChildrenIndices);
            Assert.Single(fieldName.ChildrenIndices);
            Assert.Contains(2, fieldName.ChildrenIndices); // Value Test

            // Value Test [2]
            var valueTest = nodes[2];
            Assert.Equal(TokenType.Value, valueTest.Type);
            Assert.Equal(1, valueTest.ParentIndex);
            Assert.Equal("Test", GetData(valueTest, lsf));
            Assert.Null(valueTest.ChildrenIndices); 
            Assert.Equal(ValueHint.String, valueTest.TypeHint);

            // Field Value [3]
            var fieldValue = nodes[3];
            Assert.Equal(TokenType.Field, fieldValue.Type);
            Assert.Equal(0, fieldValue.ParentIndex);
            Assert.Equal("Value", GetData(fieldValue, lsf));
            Assert.NotNull(fieldValue.ChildrenIndices);
            Assert.Single(fieldValue.ChildrenIndices);
            Assert.Contains(4, fieldValue.ChildrenIndices); // Value 123

            // Value 123 [4]
            var valueNum = nodes[4];
            Assert.Equal(TokenType.Value, valueNum.Type);
            Assert.Equal(3, valueNum.ParentIndex);
            Assert.Equal("123", GetData(valueNum, lsf));
            Assert.Null(valueNum.ChildrenIndices);
            Assert.Equal(ValueHint.String, valueNum.TypeHint); // No hint provided
        }

        [Fact]
        public void Build_ImplicitArray_CorrectStructure()
        {
            string lsf = "$o~Data$f~Items$v~A$v~B$v~C";
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(5, nodes.Count); 

            // Root Object [0]
            var root = nodes[0];
            Assert.Equal(TokenType.Object, root.Type);
            Assert.Equal(-1, root.ParentIndex);
            Assert.Equal("Data", GetData(root, lsf));
            Assert.NotNull(root.ChildrenIndices);
            Assert.Single(root.ChildrenIndices);
            Assert.Contains(1, root.ChildrenIndices); // Field Items

            // Field Items [1]
            var fieldItems = nodes[1];
            Assert.Equal(TokenType.Field, fieldItems.Type);
            Assert.Equal(0, fieldItems.ParentIndex);
            Assert.Equal("Items", GetData(fieldItems, lsf));
            Assert.NotNull(fieldItems.ChildrenIndices);
            Assert.Equal(3, fieldItems.ChildrenIndices.Count);
            Assert.Contains(2, fieldItems.ChildrenIndices); // Value A
            Assert.Contains(3, fieldItems.ChildrenIndices); // Value B
            Assert.Contains(4, fieldItems.ChildrenIndices); // Value C

            // Value A [2]
            Assert.Equal(TokenType.Value, nodes[2].Type);
            Assert.Equal(1, nodes[2].ParentIndex);
            Assert.Equal("A", GetData(nodes[2], lsf));

            // Value B [3]
             Assert.Equal(TokenType.Value, nodes[3].Type);
            Assert.Equal(1, nodes[3].ParentIndex);
            Assert.Equal("B", GetData(nodes[3], lsf));

            // Value C [4]
             Assert.Equal(TokenType.Value, nodes[4].Type);
            Assert.Equal(1, nodes[4].ParentIndex);
            Assert.Equal("C", GetData(nodes[4], lsf));
        }

        [Fact]
        public void Build_TypeHints_AppliedCorrectly()
        {
            string lsf = "$o~$f~Num$v~100$t~n$f~Bool$v~true$t~b$f~Nil$v~$t~z$f~Str$v~Hello"; // No hint for last one
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(9, nodes.Count); 

            // Value Num [2]
            var valNum = nodes[2];
            Assert.Equal(TokenType.Value, valNum.Type);
            Assert.Equal("100", GetData(valNum, lsf));
            Assert.Equal(ValueHint.Number, valNum.TypeHint);

            // Value Bool [4]
            var valBool = nodes[4];
            Assert.Equal(TokenType.Value, valBool.Type);
            Assert.Equal("true", GetData(valBool, lsf));
            Assert.Equal(ValueHint.Boolean, valBool.TypeHint);

            // Value Nil [6]
            var valNil = nodes[6];
            Assert.Equal(TokenType.Value, valNil.Type);
            Assert.Equal("", GetData(valNil, lsf)); // Data between $v~ and $t~z is empty
            Assert.Equal(ValueHint.Null, valNil.TypeHint);

             // Value Str [8]
            var valStr = nodes[8];
            Assert.Equal(TokenType.Value, valStr.Type);
            Assert.Equal("Hello", GetData(valStr, lsf));
            Assert.Equal(ValueHint.String, valStr.TypeHint); // Default
        }
        
        [Fact]
        public void Build_OrphanedTypeHint_IsIgnored()
        {
             string lsf = "$o~$t~n$f~Field$v~Value"; // Hint before anything or after non-value
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(3, nodes.Count); // Object, Field, Value - hint is ignored

            Assert.Equal(TokenType.Object, nodes[0].Type);
            Assert.Equal(TokenType.Field, nodes[1].Type);
            Assert.Equal(TokenType.Value, nodes[2].Type);
            Assert.Equal(ValueHint.String, nodes[2].TypeHint); // Remains default String
        }

        [Fact]
        public void Build_ImplicitObjectRoot_FieldFirst()
        {
            string lsf = "$f~Name$v~ImplicitRoot";
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(3, nodes.Count); // Implicit Object [0], Field [1], Value [2]

            // Implicit Object [0]
            var impRoot = nodes[0];
            Assert.Equal(TokenType.Object, impRoot.Type);
            Assert.Equal(-1, impRoot.ParentIndex);
            Assert.Equal(0, impRoot.DataLength);
            Assert.Equal(lsf.IndexOf("$f~"), impRoot.TokenPosition); // Associated with field pos
            Assert.NotNull(impRoot.ChildrenIndices);
            Assert.Single(impRoot.ChildrenIndices);
            Assert.Contains(1, impRoot.ChildrenIndices); // Field Name

            // Field Name [1]
            var fieldName = nodes[1];
            Assert.Equal(TokenType.Field, fieldName.Type);
            Assert.Equal(0, fieldName.ParentIndex);
            Assert.NotNull(fieldName.ChildrenIndices);
            Assert.Single(fieldName.ChildrenIndices);
            Assert.Contains(2, fieldName.ChildrenIndices); // Value ImplicitRoot

            // Value ImplicitRoot [2]
            var value = nodes[2];
            Assert.Equal(TokenType.Value, value.Type);
            Assert.Equal(1, value.ParentIndex);
            Assert.Equal("ImplicitRoot", GetData(value, lsf));
        }
        
        [Fact]
        public void Build_ImplicitObjectRoot_ValueFirst()
        {
            string lsf = "$v~LoneValue";
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(3, nodes.Count); // Implicit Object [0], Implicit Field [1], Value [2]

            // Implicit Object [0]
            var impRoot = nodes[0];
            Assert.Equal(TokenType.Object, impRoot.Type);
            Assert.Equal(-1, impRoot.ParentIndex);
            Assert.Equal(0, impRoot.DataLength);
            Assert.Equal(lsf.IndexOf("$v~"), impRoot.TokenPosition); // Associated with value pos
            Assert.NotNull(impRoot.ChildrenIndices);
            Assert.Single(impRoot.ChildrenIndices);
            Assert.Contains(1, impRoot.ChildrenIndices); // Implicit Field

            // Implicit Field [1]
            var impField = nodes[1];
            Assert.Equal(TokenType.Field, impField.Type);
            Assert.Equal(0, impField.ParentIndex); // Child of implicit object
            Assert.Equal(0, impField.DataLength);
            Assert.Equal(lsf.IndexOf("$v~"), impField.TokenPosition); // Associated with value pos
            Assert.NotNull(impField.ChildrenIndices);
            Assert.Single(impField.ChildrenIndices);
            Assert.Contains(2, impField.ChildrenIndices); // Value LoneValue

            // Value LoneValue [2]
            var value = nodes[2];
            Assert.Equal(TokenType.Value, value.Type);
            Assert.Equal(1, value.ParentIndex); // Child of implicit field
            Assert.Equal("LoneValue", GetData(value, lsf));
        }
        
        [Fact]
        public void Build_ImplicitField_ObjectThenValue()
        {
            string lsf = "$o~MyObject$v~DirectValue";
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(3, nodes.Count); // Object [0], Implicit Field [1], Value [2]

             // Object [0]
            var obj = nodes[0];
            Assert.Equal(TokenType.Object, obj.Type);
            Assert.Equal(-1, obj.ParentIndex);
             Assert.NotNull(obj.ChildrenIndices);
            Assert.Single(obj.ChildrenIndices);
            Assert.Contains(1, obj.ChildrenIndices); // Implicit Field

            // Implicit Field [1]
            var impField = nodes[1];
            Assert.Equal(TokenType.Field, impField.Type);
            Assert.Equal(0, impField.ParentIndex); // Child of object
            Assert.Equal(0, impField.DataLength);
            Assert.Equal(lsf.IndexOf("$v~"), impField.TokenPosition); // Associated with value pos
            Assert.NotNull(impField.ChildrenIndices);
            Assert.Single(impField.ChildrenIndices);
            Assert.Contains(2, impField.ChildrenIndices); // Value DirectValue

            // Value DirectValue [2]
            var value = nodes[2];
            Assert.Equal(TokenType.Value, value.Type);
            Assert.Equal(1, value.ParentIndex); // Child of implicit field
            Assert.Equal("DirectValue", GetData(value, lsf));
        }

        [Fact]
        public void Build_CorrectDataSpans()
        {
             string lsf = "$o~OBJ$f~F1$v~V1$f~F2$v~V22$t~n";
             var inputBytes = Utf8NoBom.GetBytes(lsf);
             var tokens = TokenScanner.Scan(inputBytes);
             var result = DOMBuilder.Build(tokens, inputBytes);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(5, nodes.Count);

            // $o~OBJ$f~...
            Assert.Equal(3, nodes[0].DataPosition); Assert.Equal(3, nodes[0].DataLength); Assert.Equal("OBJ", GetData(nodes[0], lsf));
            // ...$f~F1$v~...
            Assert.Equal(9, nodes[1].DataPosition); Assert.Equal(2, nodes[1].DataLength); Assert.Equal("F1", GetData(nodes[1], lsf));
            // ...$v~V1$f~...
            Assert.Equal(14, nodes[2].DataPosition); Assert.Equal(2, nodes[2].DataLength); Assert.Equal("V1", GetData(nodes[2], lsf));
            // ...$f~F2$v~...
            Assert.Equal(19, nodes[3].DataPosition); Assert.Equal(2, nodes[3].DataLength); Assert.Equal("F2", GetData(nodes[3], lsf));
            // ...$v~V22$t~...
            Assert.Equal(24, nodes[4].DataPosition); Assert.Equal(3, nodes[4].DataLength); Assert.Equal("V22", GetData(nodes[4], lsf));
            Assert.Equal(ValueHint.Number, nodes[4].TypeHint); // Hint applied

        }
    }
} 