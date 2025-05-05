using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Xunit;
using Xunit.Abstractions;
using Zerox.LSF; // Assuming your main library namespace is Zerox.LSF

namespace Zerox.LSF.Tests
{
    public class TokenScannerTests
    {
        private static readonly UTF8Encoding Utf8NoBom = new UTF8Encoding(false); // Ensure no BOM

        ITestOutputHelper _output;

        //ctor with outputHelper
        public TokenScannerTests(ITestOutputHelper o)
        {
            _output = o;
        }


        // Helper to convert string to ReadOnlySpan<byte>
        private ReadOnlySpan<byte> ToSpan(string s)
        {
            return Utf8NoBom.GetBytes(s);
        }

        [Fact]
        public void Scan_EmptyInput_ReturnsEmptyList()
        {
            // Arrange
            var input = ReadOnlySpan<byte>.Empty;

            // Act
            var result = TokenScanner.Scan(input);

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void Scan_NoTokens_ReturnsEmptyList()
        {
            // Arrange
            var input = ToSpan("This string has no LSF tokens.");

            // Act
            var result = TokenScanner.Scan(input);

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void Scan_SingleObjectToken_ReturnsCorrectToken()
        {
            // Arrange
            var input = ToSpan("Hello $o~ World");

            // Act
            var result = TokenScanner.Scan(input);

            // Assert
            Assert.Single(result);
            Assert.Equal(TokenType.Object, result[0].Type);
            Assert.Equal(6, result[0].Position); // $o~ starts at index 6
        }

        [Fact]
        public void Scan_SingleFieldToken_ReturnsCorrectToken()
        {
            // Arrange
            var input = ToSpan("$f~FieldName");

            // Act
            var result = TokenScanner.Scan(input);

            // Assert
            Assert.Single(result);
            Assert.Equal(TokenType.Field, result[0].Type);
            Assert.Equal(0, result[0].Position);
        }

        [Fact]
        public void Scan_SingleValueToken_ReturnsCorrectToken()
        {
            // Arrange
            var input = ToSpan("SomeData$v~MoreData");

            // Act
            var result = TokenScanner.Scan(input);

            // Assert
            Assert.Single(result);
            Assert.Equal(TokenType.Value, result[0].Type);
            Assert.Equal(8, result[0].Position);
        }

        [Fact]
        public void Scan_SingleTypeHintToken_ReturnsCorrectToken()
        {
            // Arrange
            var input = ToSpan("Value$t~n");

            // Act
            var result = TokenScanner.Scan(input);

            // Assert
            Assert.Single(result);
            Assert.Equal(TokenType.TypeHint, result[0].Type);
            Assert.Equal(5, result[0].Position);
        }

        [Fact]
        public void Scan_MultipleTokens_ReturnsCorrectTokensInOrder()
        {
            // Arrange
            var input = ToSpan("$o~Object1$f~Field1$v~Value1$t~n$f~Field2$v~Value2");

            // Act
            var result = TokenScanner.Scan(input);

            // Assert
            Assert.Equal(6, result.Count);

            Assert.Equal(TokenType.Object, result[0].Type);
            Assert.Equal(0, result[0].Position);

            Assert.Equal(TokenType.Field, result[1].Type);
            Assert.Equal(10, result[1].Position);

            Assert.Equal(TokenType.Value, result[2].Type);
            Assert.Equal(19, result[2].Position);

            Assert.Equal(TokenType.TypeHint, result[3].Type);
            Assert.Equal(28, result[3].Position);

            Assert.Equal(TokenType.Field, result[4].Type);
            Assert.Equal(32, result[4].Position);

            Assert.Equal(TokenType.Value, result[5].Type);
            Assert.Equal(41, result[5].Position);
        }

         [Fact]
        public void Scan_AdjacentTokens_ReturnsCorrectTokens()
        {
            // Arrange
            var input = ToSpan("$o~$f~$v~$t~");

            // Act
            var result = TokenScanner.Scan(input);

            // Assert
            Assert.Equal(4, result.Count);
            Assert.Equal(TokenType.Object, result[0].Type);
            Assert.Equal(0, result[0].Position);
            Assert.Equal(TokenType.Field, result[1].Type);
            Assert.Equal(3, result[1].Position);
            Assert.Equal(TokenType.Value, result[2].Type);
            Assert.Equal(6, result[2].Position);
            Assert.Equal(TokenType.TypeHint, result[3].Type);
            Assert.Equal(9, result[3].Position);
        }

        [Fact]
        public void Scan_NonTokenDollarSign_IsIgnored()
        {
            // Arrange
            var input = ToSpan("This has a $dollar sign but not a token $o~ and another $dollar.");

            // Act
            var result = TokenScanner.Scan(input);

            // Assert
            Assert.Single(result);
            Assert.Equal(TokenType.Object, result[0].Type);
            Assert.Equal(40, result[0].Position);
        }

        [Fact]
        public void Scan_PartialTokenAtEnd_IsIgnored()
        {
             // Arrange
            var input = ToSpan("$o~Token $f"); //Ends with partial $f~

            // Act
            var result = TokenScanner.Scan(input);

            // Assert
            Assert.Single(result);
            Assert.Equal(TokenType.Object, result[0].Type);
            Assert.Equal(0, result[0].Position);
        }

        [Fact]
        public void Scan_TokenAtVeryEnd_ReturnsCorrectToken()
        {
            // Arrange
            var input = ToSpan("SomeData$v~");

            // Act
            var result = TokenScanner.Scan(input);

            // Assert
            Assert.Single(result);
            Assert.Equal(TokenType.Value, result[0].Type);
            Assert.Equal(8, result[0].Position);
        }

    }
} 