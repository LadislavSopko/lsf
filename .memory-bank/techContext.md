# LSF Technical Context

## Technology Stack

### Languages & Runtime
- **TypeScript/JavaScript**: Primary implementation language
- **Node.js**: Runtime environment for tests and benchmarks

### Build & Package Tools
- **TypeScript Compiler**: For type checking and transpilation
- **tsup**: For bundling (configured with `--format cjs,esm --dts --minify --clean`)
- **npm**: Package management

### Testing Framework
- **Vitest**: Main testing framework
- **@vitest/coverage-v8**: For coverage reporting

### Development Tools
- **ESLint**: For code linting
- **Prettier**: For code formatting
- **TypeDoc**: For API documentation generation

### Key NPM Scripts
- `build`: Compiles TypeScript to JavaScript
- `test`: Runs Vitest tests
- `test:watch`: Runs tests in watch mode
- `test:coverage`: Runs tests with coverage reporting
- `lint`: Checks code quality with ESLint
- `prettier`: Formats code with Prettier
- `docs`: Generates API documentation
- `bundle`: Creates distributable bundles

## Technical Constraints

### Performance Requirements
- Must be capable of parsing large LSF documents efficiently
- Memory usage should be minimal and predictable
- Should outperform or match JSON parsing in speed

### Browser Compatibility
- Must work in all modern browsers
- No dependencies on browser-specific APIs

### Bundle Size
- Minimal footprint for browser usage
- Tree-shakable architecture

### UTF-8 Handling
- All parsing must be UTF-8 safe
- Delimiters must be single-byte UTF-8 characters

## Dependencies

### Runtime Dependencies
- None (zero dependencies approach for maximum portability)

### Development Dependencies
```
"@types/node": "^22.15.3",
"@typescript-eslint/eslint-plugin": "^8.31.1",
"@typescript-eslint/parser": "^8.31.1",
"@vitest/coverage-v8": "^3.1.2",
"eslint": "^9.26.0",
"eslint-config-prettier": "^10.1.2",
"eslint-plugin-prettier": "^5.3.1",
"prettier": "^3.5.3",
"tsup": "^8.4.0",
"typedoc": "^0.28.4",
"typescript": "^5.8.3",
"vitest": "^3.1.2"
```

## Development Setup

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Build: `npm run build`

### Key Directories
- `src/`: Source code
- `dist/`: Compiled output
- `tests/`: Test files
- `benchmarks/`: Performance tests

## LSF v2.0 Format Specification

### Tokens
- `$o~` - Object start
- `$a~` - Array start (new in v2.0)
- `$f~` - Field separator
- `$t~` - Type hint

### Type Hints
- `n` - Number
- `f` - Float
- `b` - Boolean
- `d` - Date
- `s` - String (default)

### Grammar (Simplified)
```
Document    := Object | Array
Object      := "$o~" ObjectName Field*
Array       := "$a~" ArrayName ArrayItem*
Field       := FieldName "$f~" (Value | Object | Array)
FieldName   := Text
ObjectName  := Text
ArrayName   := Text
ArrayItem   := Value | Object | Array
Value       := Text ["$t~" TypeHint]
TypeHint    := "n" | "f" | "b" | "d" | "s"
Text        := Any characters except token sequences
```

### Example LSF v2.0 Document
```
$o~person$f~name$f~John$f~age$f~30$t~n$f~skills$a~skills$f~programming$f~design
```

Parsed as:
```json
{
  "person": {
    "name": "John",
    "age": 30,
    "skills": ["programming", "design"]
  }
}
``` 