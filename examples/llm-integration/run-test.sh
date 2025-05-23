#!/bin/bash

echo "🚀 LSF LLM Integration Test Runner"
echo "=================================="
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env with your ANTHROPIC_API_KEY"
    echo "Example: ANTHROPIC_API_KEY=sk-ant-api..."
    exit 1
fi

# Check if API key is set
if ! grep -q "ANTHROPIC_API_KEY=" .env; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY not found in .env"
    echo "Please add: ANTHROPIC_API_KEY=your-key-here"
    exit 1
fi

echo "📦 Building LSF library..."
cd ../../implementations/javascript
npm install > /dev/null 2>&1
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ LSF library built"

echo ""
echo "📦 Installing test dependencies..."
cd ../../examples/llm-integration
npm install > /dev/null 2>&1
echo "✅ Dependencies installed"

echo ""
echo "🧪 Running format comparison test..."
echo "This will test JSON vs XML vs LSF with complex data"
echo ""
echo "=========================================="
echo ""

# Run the comparison
node compare-formats.js

echo ""
echo "=========================================="
echo ""
echo "✅ Test complete!"
echo ""
echo "To run individual format tests:"
echo "  node test-single-format.js json"
echo "  node test-single-format.js xml"
echo "  node test-single-format.js lsf"