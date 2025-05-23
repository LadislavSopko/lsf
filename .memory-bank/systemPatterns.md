# System Patterns - LSF Architecture

## Core Architecture Pattern

All implementations follow identical architecture:

```
Input (string/bytes) → TokenScanner → Tokens → DOMBuilder → Nodes → DOMNavigator → Visitor → Output
```

### Component Responsibilities

1. **TokenScanner**
   - Identifies token positions in input
   - Zero-copy scanning (C# ReadOnlyMemory, TS Uint8Array)
   - Returns list of TokenInfo (type + position)

2. **DOMBuilder** 
   - Constructs node tree from tokens
   - Handles multi-object documents
   - Single-pass construction

3. **DOMNavigator**
   - Tree traversal API
   - Node relationship queries
   - Value extraction

4. **Visitor Pattern**
   - Transform DOM to other formats
   - Currently: LSFToJSONVisitor
   - Extensible for custom formats

5. **Encoder**
   - Object/dictionary → LSF format
   - Type detection and hints
   - No nested object support

## Key Design Decisions

### 1. Stateless Token Scanning
- Tokens identified by position only
- No string allocation during scan
- Enables streaming in future

### 2. DOM-Based Parsing
- Build full tree before output
- Enables multiple output formats
- Trade memory for flexibility

### 3. Explicit Type Hints
- Optional but recommended
- Preserves type information
- Critical for round-trip fidelity

### 4. No Escape Sequences
- Tokens forbidden in data
- Simplifies parser significantly
- Constraint accepted for reliability

## Error Handling Philosophy (Planned)

1. **Fail Fast** - Detect errors at earliest point
2. **Precise Errors** - Include position and context
3. **Configurable Strictness** - Strict vs lenient modes
4. **Consistent Messages** - Same error = same message across languages

## Performance Patterns

1. **Single-Pass Parsing** - O(n) complexity
2. **Minimal Allocations** - Reuse buffers where possible
3. **Lazy Evaluation** - Build only what's needed
4. **Native Types** - Use language-specific optimizations

## Testing Patterns

1. **Unified Test Cases** - Same inputs/outputs across languages
2. **Edge Case Focus** - Empty values, special characters, limits
3. **Regression Prevention** - Bug = new test
4. **Performance Benchmarks** - Compare against JSON baseline