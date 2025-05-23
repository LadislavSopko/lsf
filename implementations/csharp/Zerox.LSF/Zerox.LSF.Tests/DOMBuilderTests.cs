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

        // Multi-object parsing tests
        [Fact]
        public void Build_SequentialObjects_ParsesBothObjects()
        {
            string lsf = "$o~Obj1$f~field$v~value1$o~Obj2$f~field$v~value2";
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(6, nodes.Count); // 2 objects, 2 fields, 2 values

            // First object - Obj1
            var obj1 = nodes[0];
            Assert.Equal(TokenType.Object, obj1.Type);
            Assert.Equal(-1, obj1.ParentIndex); // Root level
            Assert.Equal("Obj1", GetData(obj1, lsf));
            Assert.Single(obj1.ChildrenIndices);
            Assert.Contains(1, obj1.ChildrenIndices);

            // First field
            var field1 = nodes[1];
            Assert.Equal(TokenType.Field, field1.Type);
            Assert.Equal(0, field1.ParentIndex);
            Assert.Equal("field", GetData(field1, lsf));

            // First value
            var value1 = nodes[2];
            Assert.Equal(TokenType.Value, value1.Type);
            Assert.Equal(1, value1.ParentIndex);
            Assert.Equal("value1", GetData(value1, lsf));

            // Second object - Obj2
            var obj2 = nodes[3];
            Assert.Equal(TokenType.Object, obj2.Type);
            Assert.Equal(-1, obj2.ParentIndex); // Root level
            Assert.Equal("Obj2", GetData(obj2, lsf));
            Assert.Single(obj2.ChildrenIndices);
            Assert.Contains(4, obj2.ChildrenIndices);

            // Second field
            var field2 = nodes[4];
            Assert.Equal(TokenType.Field, field2.Type);
            Assert.Equal(3, field2.ParentIndex);
            Assert.Equal("field", GetData(field2, lsf));

            // Second value
            var value2 = nodes[5];
            Assert.Equal(TokenType.Value, value2.Type);
            Assert.Equal(4, value2.ParentIndex);
            Assert.Equal("value2", GetData(value2, lsf));
        }

        [Fact]
        public void Build_MultipleAnonymousObjects_ParsesAll()
        {
            string lsf = "$o~$f~name$v~Alice$o~$f~name$v~Bob$o~$f~name$v~Charlie";
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(9, nodes.Count); // 3 objects, 3 fields, 3 values

            // Verify all three objects are at root level
            var rootObjects = nodes.Where(n => n.Type == TokenType.Object && n.ParentIndex == -1).ToList();
            Assert.Equal(3, rootObjects.Count);

            // Verify each object has correct structure
            for (int i = 0; i < 3; i++)
            {
                var objIndex = i * 3;
                var obj = nodes[objIndex];
                Assert.Equal(TokenType.Object, obj.Type);
                Assert.Equal(-1, obj.ParentIndex);
                Assert.Equal(0, obj.DataLength); // Anonymous

                var field = nodes[objIndex + 1];
                Assert.Equal(TokenType.Field, field.Type);
                Assert.Equal(objIndex, field.ParentIndex);
                Assert.Equal("name", GetData(field, lsf));

                var value = nodes[objIndex + 2];
                Assert.Equal(TokenType.Value, value.Type);
                Assert.Equal(objIndex + 1, value.ParentIndex);
            }

            // Verify specific values
            Assert.Equal("Alice", GetData(nodes[2], lsf));
            Assert.Equal("Bob", GetData(nodes[5], lsf));
            Assert.Equal("Charlie", GetData(nodes[8], lsf));
        }

        [Fact]
        public void Build_MixedNamedAndAnonymousObjects_ParsesAll()
        {
            string lsf = "$o~Named1$f~type$v~named$o~$f~type$v~anonymous$o~Named2$f~type$v~named";
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(9, nodes.Count);

            // First named object
            Assert.Equal("Named1", GetData(nodes[0], lsf));
            Assert.Equal(6, nodes[0].DataLength); // "Named1" is 6 characters

            // Anonymous object
            Assert.Equal(0, nodes[3].DataLength);
            Assert.Equal(TokenType.Object, nodes[3].Type);
            Assert.Equal(-1, nodes[3].ParentIndex);

            // Second named object
            Assert.Equal("Named2", GetData(nodes[6], lsf));
            
            // Verify all have correct values
            Assert.Equal("named", GetData(nodes[2], lsf));
            Assert.Equal("anonymous", GetData(nodes[5], lsf));
            Assert.Equal("named", GetData(nodes[8], lsf));
        }

        // Edge case tests
        [Fact]
        public void Build_UnicodeCharactersInValues_HandledCorrectly()
        {
            string lsf = "$o~测试$f~名称$v~Hello 世界 🌍$f~emoji$v~😀🎉";
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            
            // Verify Unicode object name
            Assert.Equal("测试", GetData(nodes[0], lsf));
            
            // Verify Unicode field name
            Assert.Equal("名称", GetData(nodes[1], lsf));
            
            // Verify mixed Unicode value
            Assert.Equal("Hello 世界 🌍", GetData(nodes[2], lsf));
            
            // Verify emoji value
            Assert.Equal("😀🎉", GetData(nodes[4], lsf));
        }

        [Fact]
        public void Build_VeryLongFieldNamesAndValues_HandledCorrectly()
        {
            string longFieldName = new string('a', 1000);
            string longValue = new string('b', 5000);
            string lsf = $"$o~LongTest$f~{longFieldName}$v~{longValue}";
            
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            
            // Verify long field name
            Assert.Equal(longFieldName, GetData(nodes[1], lsf));
            Assert.Equal(1000, nodes[1].DataLength);
            
            // Verify long value
            Assert.Equal(longValue, GetData(nodes[2], lsf));
            Assert.Equal(5000, nodes[2].DataLength);
        }

        [Fact]
        public void Build_MalformedTokens_IgnoredGracefully()
        {
            // Partial tokens inside values are treated as literal text
            string lsf = "$o~Valid$f~field$v~value$o";  // $o inside value
            var result = BuildDom(lsf);

            Assert.True(result.Success);
            Assert.NotNull(result.Nodes);
            var nodes = result.Nodes!;
            Assert.Equal(3, nodes.Count); // Object/field/value

            // Verify structure
            Assert.Equal("Valid", GetData(nodes[0], lsf));
            Assert.Equal("field", GetData(nodes[1], lsf));
            Assert.Equal("value$o", GetData(nodes[2], lsf)); // $o is part of the value
        }
    }
} 