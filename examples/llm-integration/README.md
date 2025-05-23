# LLM Integration Example: Format Comparison

This example demonstrates real-world LLM integration comparing JSON, XML, and LSF formats for structured data generation. We test with complex, problematic text that often causes LLMs to produce malformed output.

## Test Scenarios

1. **Nested Quotes & Escaping**: Text with multiple quote types, backslashes, and escape sequences
2. **Multi-line Content**: Text with newlines, tabs, and formatting characters
3. **Unicode & Emojis**: International characters and emoji that can break encoding
4. **Code Snippets**: Programming code with syntax that conflicts with format delimiters
5. **Malicious Injection**: Text attempting to break out of the format structure
6. **Large Scale**: Multiple objects with all the above challenges

## Why This Matters

LLMs often struggle with:
- Properly escaping quotes in JSON strings
- Maintaining valid syntax with complex content
- Handling nested structures without breaking format rules
- Consistent formatting across multiple objects

LSF's design eliminates these issues by:
- No quotes or brackets to escape or balance
- No nesting to track
- Simple, unambiguous token structure
- Forgiving parser that handles common LLM mistakes

## Running the Example

1. Set your Anthropic API key:
   ```bash
   export ANTHROPIC_API_KEY=your-key-here
   ```

2. Install dependencies:
   ```bash
   cd implementations/javascript
   npm install
   cd ../../examples/llm-integration
   npm install
   ```

3. Run the comparison:
   ```bash
   npm run compare
   ```

## Results

The script will:
- Generate the same complex data in JSON, XML, and LSF formats via Claude
- Attempt to parse each format
- Report success rates and errors
- Show actual vs expected data