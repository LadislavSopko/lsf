# LSF LLM Integration Tests - Python

This script tests LSF generation with real LLM (Claude) integration.

## Prerequisites

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   # or just: pip install anthropic python-dotenv
   ```

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
python test_llm_integration.py
```

Test specific format and test case:
```bash
python test_llm_integration.py lsf 0    # Test LSF format with test case 0
python test_llm_integration.py json 1   # Test JSON format with test case 1
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

1. Generates a prompt using `lsf.get_llm_prompt()`
2. Sends the prompt + test data to Claude API
3. Receives generated LSF format response
4. Attempts to parse the response using `lsf.LSFParser`
5. Converts parsed result to JSON for verification