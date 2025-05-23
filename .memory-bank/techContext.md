# Technical Context - Development Environment

## Technology Stack

### C# Implementation
- **Target**: .NET Standard 2.0 (broad compatibility)
- **Future**: .NET 6.0+ for performance
- **Testing**: xUnit + FluentAssertions
- **Build**: dotnet CLI
- **Package**: NuGet

### TypeScript Implementation  
- **Target**: ES2020 + CommonJS/ESM dual build
- **Runtime**: Node.js 16+ / Modern browsers
- **Testing**: Vitest
- **Build**: TypeScript compiler + bundler
- **Package**: npm

### Python Implementation
- **Target**: Python 3.8+ (type hints)
- **Testing**: pytest
- **Build**: setuptools
- **Package**: PyPI

### Planned: Go Implementation
- **Target**: Go 1.21+ (modern stdlib)
- **Testing**: Standard testing package
- **Build**: go modules
- **Package**: Tagged GitHub releases

## Development Tools

- **IDE**: VS Code (all language support)
- **Version Control**: Git
- **Branch Strategy**: main/feature branches
- **CI/CD**: GitHub Actions (planned)

## Technical Constraints

1. **No External Dependencies** - Standard library only
2. **UTF-8 Only** - Simplifies encoding handling  
3. **10MB Default Limit** - Prevent DoS attacks
4. **ASCII Tokens** - Cross-platform safety
5. **No Streaming Yet** - Full document parsing only

## Performance Targets

- Parse 1MB document < 5ms
- Memory usage < 3x input size
- Zero memory allocations in hot path (aspirational)

## Security Considerations

1. **Input Validation** - Size limits before parsing
2. **Memory Bounds** - Prevent allocation attacks
3. **No Code Execution** - Pure data format
4. **UTF-8 Validation** - Reject invalid sequences

## Compatibility Matrix

| Language | Min Version | Recommended |
|----------|-------------|-------------|
| C# | .NET Standard 2.0 | .NET 6.0+ |
| TypeScript | Node 14 | Node 18+ |
| Python | 3.8 | 3.11+ |
| Go | 1.19 | 1.21+ |

## Test Commands Reference

### C#
```bash
cd implementations/csharp/Zerox.LSF
dotnet test
dotnet run -c Release -p Zerox.LSF.Benchmarks
```

### TypeScript
```bash
cd implementations/javascript
npm test
npm run bench
npm run bundle
```

### Python
```bash
cd implementations/python
python -m pytest -v
pip install -e .
```