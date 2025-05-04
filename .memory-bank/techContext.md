# LSF Technical Context

## Technologies Used

### Core Specification

The LSF specification is language-agnostic and defined in Extended Backus-Naur Form (EBNF) grammar notation:

```ebnf
lsf_document ::= version? ( transaction )*
version      ::= "$v§" version_string "$r§"
transaction  ::= object+ "$x§$r§"
object       ::= "$o§" object_name "$r§" ( field )*
field        ::= typed_field | untyped_field | list_field | error_field
typed_field  ::= "$t§" type_hint "$f§" key "$f§" value "$r§"
untyped_field::= "$f§" key "$f§" value "$r§"
list_field   ::= "$f§" key "$f§" ( value ( "$l§" value )* )? "$r§"
error_field  ::= "$e§" error_message "$r§"
```

### Language Implementations

#### Python
- **Python Version**: 3.8+ support
- **Dependencies**: No external runtime dependencies
- **Testing**: pytest, pytest-cov
- **Development Tools**: black, isort, mypy, flake8
- **Documentation**: sphinx, sphinx-rtd-theme
- **Packaging**: setuptools, build, twine

#### JavaScript/TypeScript
- **TypeScript Version**: 5.0+
- **Node.js Compatibility**: 14.x, 16.x, 18.x
- **Module System**: ESM and CommonJS support
- **Testing**: Vitest (preferred over Jest)
- **Development Tools**: eslint, prettier
- **Documentation**: typedoc
- **Packaging**: npm

#### C# (Planned)
- **.NET Version**: .NET 6.0+
- **Testing**: xUnit
- **Packaging**: NuGet

### Development Infrastructure

#### GitHub Workflow
- **CI/CD**: GitHub Actions
- **Issue Templates**: Bug report and feature request templates
- **Release Process**: Automated package publishing

## Development Setup

### Python Implementation
```bash
cd implementations/python
python -m venv venv
# On Windows
venv\Scripts\activate
# On Unix
source venv/bin/activate
pip install -e ".[dev]"
pytest
```

### JavaScript Implementation
```bash
cd implementations/javascript
npm install
npm run build
npm test
```

## Technical Constraints

### Format Constraints
- **Token Invariance**: All tokens (`$o§`, `$f§`, etc.) must be exactly 3 characters
- **Token Isolation**: No token may appear within string data
- **Base64 Encoding**: Binary data must be base64 encoded to prevent separator collision

### Implementation Constraints
- **Minimal Dependencies**: Core libraries should have zero/minimal external runtime dependencies
- **Backward Compatibility**: Format must maintain backward compatibility across minor versions
- **Error Handling**: All implementations must handle partial parsing and provide detailed error information
- **Cross-Language Consistency**: APIs should be as similar as possible across language implementations

## Dependencies

Each implementation carefully minimizes external dependencies to ensure simplicity and portability:

### Python
```
# No runtime dependencies
```

```
# Development dependencies
pytest>=6.0
pytest-cov>=2.0
black>=21.0
isort>=5.0
mypy>=0.900
flake8>=3.9
sphinx>=4.0
sphinx-rtd-theme>=0.5
```

### JavaScript/TypeScript
```
# No runtime dependencies
```

```
# Development dependencies
typescript
vitest
@types/node
eslint
prettier
typedoc
```

## Performance Targets

The LSF format targets specific performance metrics:

- **Parse Success Rate**: >95% LLM-generated success rate
- **Token Efficiency**: At least 20% reduction vs JSON
- **Parse Time**: At least 50% faster than JSON parsing
- **Memory Usage**: Minimal overhead for encoding/decoding

## Documentation Standards

All code is thoroughly documented:
- **TypeScript**: Full JSDoc documentation with TypeScript type annotations
- **Python**: Google-style docstrings with type annotations
- **Public APIs**: All public methods include examples
- **Specification**: Formal grammar definition and examples

These technologies and constraints inform the implementation decisions across the LSF project, ensuring a consistent approach across all language versions while maintaining high quality. 