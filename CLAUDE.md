# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LSF (LLM-Safe Format) is a minimal serialization format designed for reliable structured data generation by LLMs. It uses only 3 structural tokens: `$o~` (object), `$f~` (field), `$v~` (value), with optional type hints via `$t~`.

Key characteristics:
- No brackets, quotes, or nesting (prevents LLM generation errors)
- Arrays are implicit (multiple `$v~` for same field)
- Streaming-safe, single-pass parsing
- Not human-readable by design

## Commands

### C# Implementation
```bash
cd implementations/csharp/Zerox.LSF
dotnet test                                    # Run all tests
dotnet test --filter FullyQualifiedName~TokenScannerTests  # Run specific test class
dotnet run -c Release -p Zerox.LSF.Benchmarks # Run benchmarks
```

### JavaScript/TypeScript Implementation
```bash
cd implementations/javascript
npm install         # Install dependencies
npm run build       # Build TypeScript
npm test           # Run all tests
npm run test:watch  # Run tests in watch mode
npm run bench      # Run benchmarks
npm run bundle     # Create production bundle (cjs/esm)
npm run lint       # Run ESLint
```

### Python Implementation
Currently not implemented - directory exists but is empty.

## Architecture

Both C# and JavaScript implementations follow the same architecture pattern:

1. **TokenScanner**: Lexical analysis to identify tokens (`$o~`, `$f~`, `$v~`, `$t~`)
2. **DOMBuilder**: Constructs a node tree from tokens
3. **DOMNavigator**: Provides API to traverse the node tree
4. **Visitor Pattern**: Transforms DOM to other formats (e.g., LSFToJSONVisitor)
5. **Encoder**: Converts dictionaries/objects to LSF format

Key implementation details:
- C# uses `ReadOnlyMemory<byte>` for zero-copy parsing
- TypeScript uses `Uint8Array` for byte-level operations
- Both support string and byte array inputs/outputs
- Single-pass parsing with O(n) complexity

## Testing Patterns

- Unit tests cover: TokenScanner, DOMBuilder, DOMNavigator, Encoder, Visitor
- Test edge cases: empty values, special characters, malformed input
- Benchmark tests compare performance against JSON parsing
- Both implementations use similar test structures and cases