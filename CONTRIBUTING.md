# Contributing to LSF

Thank you for your interest in contributing to LSF! This document provides guidelines and instructions for contributing.

## Development Philosophy

LSF follows these core principles:
1. **Simplicity First** - The format must remain simple (just 3 tokens)
2. **No Breaking Changes** - Backward compatibility is crucial
3. **Test Everything** - Comprehensive tests before merging
4. **Cross-Language Consistency** - All implementations must behave identically

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Make your changes
5. Run tests
6. Commit your changes
7. Push to your branch
8. Open a Pull Request

## Development Setup

### C# Implementation
```bash
cd implementations/csharp/Zerox.LSF
dotnet build
dotnet test
```

### TypeScript Implementation
```bash
cd implementations/javascript
npm install
npm run build
npm test
```

## Testing Requirements

All implementations must:
1. Pass their language-specific test suite
2. Handle all test cases from the C# reference implementation
3. Include tests for any new functionality
4. Maintain >95% code coverage

### Running Tests

**C#:**
```bash
dotnet test
# Run specific tests
dotnet test --filter "FullyQualifiedName~DOMBuilderTests"
```

**TypeScript:**
```bash
npm test
# Run in watch mode
npm run test:watch
```

## Code Style

### C#
- Follow standard C# conventions
- Use nullable reference types
- Target .NET Standard 2.0 for compatibility

### TypeScript
- Use strict mode
- Provide complete type definitions
- Support both CommonJS and ESM

## Adding a New Language Implementation

1. Create directory: `implementations/<language>/`
2. Implement the core components:
   - TokenScanner
   - DOMBuilder
   - DOMNavigator
   - Visitor (for JSON conversion)
   - Encoder
3. Port all C# tests to your language
4. Ensure 100% compatibility with C# behavior
5. Add build/test instructions to this file

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update the README.md if adding features
5. Reference any related issues

## Performance Considerations

- Optimize for single-pass parsing
- Minimize memory allocations
- Support streaming when possible
- Benchmark against JSON parsing

## Security

- Never execute LSF content as code
- Validate input sizes
- Handle malformed input gracefully
- Report security issues privately

## Questions?

Open an issue for:
- Bug reports
- Feature requests
- Documentation improvements
- General questions

## Acknowledgments

Special thanks to all contributors and to Claude (Anthropic) for assistance in developing this project.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.