using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Xunit;
using Zerox.LSF;

namespace Zerox.LSF.Tests
{
    public class DOMNavigatorTests
    {
        private static readonly UTF8Encoding Utf8NoBom = new UTF8Encoding(false);

        // Helper to create a navigator for a given LSF string
        private DOMNavigator CreateNavigator(string lsfString, out ReadOnlyMemory<byte> inputMemory, out List<LSFNode> nodes)
        {
            inputMemory = Utf8NoBom.GetBytes(lsfString);
            var tokens = TokenScanner.Scan(inputMemory.Span);
            var parseResult = DOMBuilder.Build(tokens, inputMemory.Span);
            Assert.True(parseResult.Success); // Ensure build succeeded for test setup
            Assert.NotNull(parseResult.Nodes);
            nodes = parseResult.Nodes!;
            return new DOMNavigator(inputMemory, nodes);
        }

        [Fact]
        public void NodeCount_ReturnsCorrectCount()
        {
            string lsf = "$o~Obj$f~F1$v~V1$f~F2$v~V2"; // 5 nodes
            var navigator = CreateNavigator(lsf, out _, out _);
            Assert.Equal(5, navigator.NodeCount);
        }

        [Fact]
        public void GetNode_ValidIndex_ReturnsNode()
        {
            string lsf = "$o~Obj$f~Field$v~Value"; // 3 nodes
            var navigator = CreateNavigator(lsf, out _, out var nodes);
            var node = navigator.GetNode(1); // Get the Field node
            Assert.Equal(TokenType.Field, node.Type);
            Assert.Equal(nodes[1].TokenPosition, node.TokenPosition);
        }

        [Fact]
        public void GetNode_InvalidIndex_ThrowsException()
        {
            string lsf = "$o~Obj";
            var navigator = CreateNavigator(lsf, out _, out _);
            Assert.Throws<ArgumentOutOfRangeException>(() => navigator.GetNode(-1));
            Assert.Throws<ArgumentOutOfRangeException>(() => navigator.GetNode(navigator.NodeCount)); // Index equals count is out of range
        }

        [Fact]
        public void GetNodeDataSpan_ValidNodeWithData_ReturnsSpan()
        {
            string lsf = "$o~MyObject";
            var navigator = CreateNavigator(lsf, out _, out _);
            var span = navigator.GetNodeDataSpan(0);
            Assert.False(span.IsEmpty);
            Assert.Equal("MyObject", Utf8NoBom.GetString(span));
        }

        [Fact]
        public void GetNodeDataSpan_ValidNodeWithoutData_ReturnsEmptySpan()
        {
             string lsf = "$f~$v~Value"; // Field has no data
            var navigator = CreateNavigator(lsf, out _, out _);
            var span = navigator.GetNodeDataSpan(0); // Implicit object
            Assert.True(span.IsEmpty);
            span = navigator.GetNodeDataSpan(1); // Field
            Assert.True(span.IsEmpty);
        }

        [Fact]
        public void GetNodeDataSpan_InvalidIndex_ReturnsEmptySpan()
        {
            string lsf = "$o~Obj";
            var navigator = CreateNavigator(lsf, out _, out _);
            var span = navigator.GetNodeDataSpan(5);
            Assert.True(span.IsEmpty);
        }

        [Fact]
        public void GetNodeDataAsString_ValidNodeWithData_ReturnsString()
        {
            string lsf = "$f~FieldName";
            var navigator = CreateNavigator(lsf, out _, out _);
            var str = navigator.GetNodeDataAsString(1); // Field node index
            Assert.Equal("FieldName", str);
        }

        [Fact]
        public void GetNodeDataAsString_ValidNodeWithoutData_ReturnsEmptyString()
        {
             string lsf = "$o~$v~Value"; // Implicit Field
            var navigator = CreateNavigator(lsf, out _, out _);
            var str = navigator.GetNodeDataAsString(1); // Implicit Field node index
            Assert.Equal(string.Empty, str);
        }

        [Fact]
        public void GetNodeDataAsString_InvalidIndex_ReturnsEmptyString()
        {
            string lsf = "$o~Obj";
            var navigator = CreateNavigator(lsf, out _, out _);
            var str = navigator.GetNodeDataAsString(5);
            Assert.Equal(string.Empty, str);
        }

        [Fact]
        public void GetChildrenIndices_NodeWithChildren_ReturnsIndices()
        {
            string lsf = "$o~Root$f~F1$v~V1$f~F2$v~V2";
            var navigator = CreateNavigator(lsf, out _, out _);
            var children = navigator.GetChildrenIndices(0).ToList(); // Children of Root [0] - Fixed ToList()
            Assert.Equal(2, children.Count);
            Assert.Contains(1, children); // Index of Field F1
            Assert.Contains(3, children); // Index of Field F2

            children = navigator.GetChildrenIndices(1).ToList(); // Children of Field F1 [1] - Fixed ToList()
            Assert.Single(children);
            Assert.Contains(2, children); // Index of Value V1
        }

        [Fact]
        public void GetChildrenIndices_NodeWithoutChildren_ReturnsEmpty()
        {
            string lsf = "$o~Root$f~F1$v~V1";
            var navigator = CreateNavigator(lsf, out _, out _);
            var children = navigator.GetChildrenIndices(2).ToList(); // Children of Value V1 [2] - Fixed ToList()
            Assert.Empty(children);
        }

        [Fact]
        public void GetChildrenIndices_InvalidIndex_ReturnsEmpty()
        {
            string lsf = "$o~Root";
            var navigator = CreateNavigator(lsf, out _, out _);
            var children = navigator.GetChildrenIndices(10).ToList(); // Fixed ToList()
            Assert.Empty(children);
        }

        [Fact]
        public void GetRootIndices_SingleRoot_ReturnsIndexZero()
        {
            string lsf = "$o~Root$f~F1$v~V1";
            var navigator = CreateNavigator(lsf, out _, out _);
            var roots = navigator.GetRootIndices().ToList(); // Fixed ToList()
            Assert.Single(roots);
            Assert.Equal(0, roots[0]);
        }

        [Fact]
        public void GetRootIndices_MultipleImplicitRoots_ReturnsCorrectIndices()
        {
             // Although technically invalid LSF 3.0 (only one root allowed), 
             // the builder creates implicit objects allowing this structure technically.
             // The navigator should correctly identify them.
            string lsf = "$f~Field1$v~Value1$f~Field2$v~Value2";
            var navigator = CreateNavigator(lsf, out _, out _); 
            // Expected Nodes: [ImpObj0, Field1, Value1, ImpObj1, Field2, Value2]
            Assert.Equal(6, navigator.NodeCount);
            var roots = navigator.GetRootIndices().ToList(); // Fixed ToList() 
            Assert.Equal(2, roots.Count);
            Assert.Contains(0, roots); // Implicit object for Field1
            Assert.Contains(3, roots); // Implicit object for Field2
        }

        [Fact]
        public void GetRootIndices_NoNodes_ReturnsEmpty()
        {
            string lsf = "";
            var navigator = CreateNavigator(lsf, out _, out _);
            var roots = navigator.GetRootIndices().ToList(); // Fixed ToList()
            Assert.Empty(roots);
        }
    }
} 