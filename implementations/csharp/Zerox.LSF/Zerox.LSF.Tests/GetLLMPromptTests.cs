using Xunit;

namespace Zerox.LSF.Tests
{
    public class GetLLMPromptTests
    {
        [Fact]
        public void GetLLMPrompt_MinimalWithExample_ReturnsCorrectPrompt()
        {
            // Act
            var prompt = LSFParser.GetLLMPrompt(includeExample: true, style: "minimal");

            // Assert
            Assert.Contains("Output in LSF format:", prompt);
            Assert.Contains("$o~=object, $f~=field, $v~=value", prompt);
            Assert.Contains("NO quotes/brackets", prompt);
            Assert.Contains("Example:", prompt);
            Assert.Contains("$o~$f~name$v~John", prompt);
        }

        [Fact]
        public void GetLLMPrompt_MinimalWithoutExample_ReturnsPromptWithoutExample()
        {
            // Act
            var prompt = LSFParser.GetLLMPrompt(includeExample: false, style: "minimal");

            // Assert
            Assert.Contains("Output in LSF format:", prompt);
            Assert.DoesNotContain("Example:", prompt);
            Assert.DoesNotContain("$o~$f~name$v~John", prompt);
        }

        [Fact]
        public void GetLLMPrompt_DetailedWithExample_ReturnsDetailedPrompt()
        {
            // Act
            var prompt = LSFParser.GetLLMPrompt(includeExample: true, style: "detailed");

            // Assert
            Assert.Contains("Generate output in LSF (LLM-Safe Format):", prompt);
            Assert.Contains("TOKENS:", prompt);
            Assert.Contains("TYPES:", prompt);
            Assert.Contains("RULES:", prompt);
            Assert.Contains("Multi-line strings: write actual newlines, not \\n", prompt);
            Assert.Contains("NO escaping - write everything literally", prompt);
            Assert.Contains("EXAMPLE:", prompt);
        }

        [Fact]
        public void GetLLMPrompt_DetailedWithoutExample_ReturnsDetailedPromptWithoutExample()
        {
            // Act
            var prompt = LSFParser.GetLLMPrompt(includeExample: false, style: "detailed");

            // Assert
            Assert.Contains("RULES:", prompt);
            Assert.DoesNotContain("EXAMPLE:", prompt);
        }

        [Fact]
        public void GetLLMPrompt_DefaultParameters_ReturnsMinimalWithExample()
        {
            // Act
            var prompt = LSFParser.GetLLMPrompt();

            // Assert
            Assert.Contains("Output in LSF format:", prompt);
            Assert.Contains("Example:", prompt);
        }
    }
}