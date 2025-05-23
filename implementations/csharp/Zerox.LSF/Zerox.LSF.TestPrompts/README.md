# LSF LLM Integration Tests - C#

This project tests LSF generation with real LLM (Claude) integration.

## Prerequisites

1. .NET 8.0 SDK installed

2. Set up your Anthropic API key:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your API key
   # ANTHROPIC_API_KEY=your-api-key-here
   ```

   Alternatively, you can set it as an environment variable:
   ```bash
   export ANTHROPIC_API_KEY=your-api-key-here
   ```

## Running Tests

Test LSF format with default test case:
```bash
dotnet run
```

Test specific format and test case:
```bash
dotnet run lsf 0    # Test LSF format with test case 0
dotnet run json 1   # Test JSON format with test case 1
```

## Test Cases

0. Simple User Profile - Basic test
1. Quotes and Escaping Hell - Multiple quote types and escape sequences
2. Multi-line Nightmare - Content with newlines, tabs, and formatting
3. Unicode and Emoji Chaos - International characters and emojis
4. Format-Breaking Strings - Text that tries to break JSON/XML syntax
5. Edge Cases and Limits - Boundary conditions and special values
6. Real-world Blog Post - Realistic content combining multiple challenges

## What It Tests

1. Generates a prompt using `LSFParser.GetLLMPrompt()`
2. Sends the prompt + test data to Claude API
3. Receives generated LSF format response
4. Attempts to parse the response using `LSFParser`
5. Converts parsed result to JSON for verification