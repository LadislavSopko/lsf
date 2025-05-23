#!/bin/bash

# Test LSF LLM integration across all implementations

# Don't check for API key here - each implementation will load from its own .env file

echo "=== Testing LSF LLM Integration Across All Implementations ==="
echo

# Test case to use (0 = simple, 1 = quotes/escaping, etc.)
TEST_CASE=${1:-0}
FORMAT=${2:-lsf}

echo "Testing format: $FORMAT"
echo "Test case: $TEST_CASE"
echo

echo "=== JavaScript/TypeScript ==="
cd ../examples/llm-integration
if [ -f "node_modules/@anthropic-ai/sdk/package.json" ]; then
    node test-single-format.js $FORMAT $TEST_CASE
else
    echo "Dependencies not installed. Run 'npm install' in examples/llm-integration first."
fi
cd ../../implementations
echo

echo "=== C# ==="
cd csharp/Zerox.LSF/Zerox.LSF.TestPrompts
dotnet run $FORMAT $TEST_CASE
cd ../../..
echo

echo "=== Python ==="
cd python
python test_llm_integration.py $FORMAT $TEST_CASE
cd ..

echo
echo "=== Test Complete ===">