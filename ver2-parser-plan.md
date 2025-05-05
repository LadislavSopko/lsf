# LSF 3.0 Parser Implementation Plan

## 1. Architecture Overview

### 1.1 Core Components
- **TokenScanner (Pass 1)**: Single-pass byte array scanner that identifies all tokens without interpretation. **[COMPLETED]**
- **DOMBuilder (Pass 2)**: Processes identified tokens to build a lazy, zero-copy DOM. **[COMPLETED]**
- **DOMNavigator**: Zero-copy navigation of the parsed DOM structure.
- **LSFToJSONVisitor**: Visitor pattern implementation that traverses DOM to build JSON.

### 1.2 Key Design Principles
- **Two-pass architecture**: Strict separation between token identification and DOM construction.
- **Zero-copy parsing**: All nodes reference original buffer positions (no string extraction).
- **Pre-allocated memory**: Estimate and pre-allocate arrays for maximum performance.
- **Visitor pattern**: Clean separation between DOM structure and output format.
- **Speed optimization**: Critical focus on parsing performance.
- **Flat Structure**: No nested objects (objects cannot contain other objects directly).
- **Implicit Nodes**: Handles inputs starting with `$f~` or `$v~` by creating anonymous/default parent nodes.
- **Per-Node Children**: DOM structure uses `node.children: number[]` for clarity and correctness.

## 2. Component Details

### 2.1 Token Types & Constants
```typescript
const TOKEN = {
  OBJECT: '$o~',  // Object start (name optional)
  FIELD: '$f~',   // Field start
  VALUE: '$v~',   // Value marker (single or array element)
  TYPE: '$t~',    // Optional type hint
}

const CHAR_CODE = {
  DOLLAR: 36,     // $
  O: 111,         // o
  F: 102,         // f
  V: 118,         // v
  T: 116,         // t
  TILDE: 126      // ~
}

const TYPE_HINT = {
  NUMBER: 'n',
  FLOAT: 'f',
  BOOLEAN: 'b',
  DATE: 'd',
  STRING: 's'
}
```

### 2.2 Data Structures
```typescript
interface LSFNode {
  type: number;          // 0=object, 1=field, 2=value
  nameStart: number;     // Position in buffer where name starts
  nameLength: number;    // Length of name in bytes
  valueStart: number;    // Position in buffer where value starts
  valueLength: number;   // Length of value in bytes
  children: number[];    // Indices of child nodes (Refactored from childrenStart/Count)
  typeHint: number;      // Type hint character code (0 if none)
}

interface TokenInfo {
  type: number;          // Token type (using character code for efficiency)
  position: number;      // Position in buffer
}

interface ParseResult {
  root: number;          // Index of first top-level object node (-1 if none)
  nodes: LSFNode[];      // All nodes
  buffer: Uint8Array;    // Original buffer (zero-copy)
  navigator: DOMNavigator; // Navigator for easy access (placeholder until implemented)
}
```

### 2.3 Two-Pass Implementation

#### 2.3.1 Pass 1: TokenScanner **[COMPLETED]**
```typescript
class TokenScanner {
  private buffer: Uint8Array;
  private tokenTypes: Uint32Array;    // Pre-allocated typed array
  private tokenPositions: Uint32Array; // Pre-allocated typed array
  private tokenCount: number = 0;
  
  scan(input: string | Uint8Array): TokenScanResult {
    // Convert string to buffer if needed
    // Initialize and pre-allocate memory
    // Single-pass scan for all $o~, $f~, $v~, $t~ tokens
    // Record positions and types into pre-allocated arrays
    // Return token information
  }
  
  private addToken(type: number, position: number): void {
    // ... (Implementation details as coded) ...
  }
  
  private growArrays(): void {
    // Efficient growth strategy for typed arrays
  }
}
```

#### 2.3.2 Pass 2: DOMBuilder **[COMPLETED]**
```typescript
class DOMBuilder {
  private nodes: LSFNode[];           // Pre-allocated array
  private nodeCount: number = 0;
  private nodeCapacity: number = 0;
  
  // State variables
  private currentObjectNodeIndex = -1;
  private currentFieldNodeIndex = -1;
  private lastValueNodeIndex = -1;
  private topLevelNodeIndices: number[] = [];

  constructor(tokenResult: TokenScanResult) {
    // ... (Implementation details as coded) ...
  }
  
  buildDOM(): ParseResult {
    // Implemented using Token-Data strategy
    // Handles implicit nodes
    // Returns ParseResult with nodes array
    // ... (Implementation details as coded) ...
  }
  
  private allocateNode(): number {
    // Resets node with empty children array
    // ... (Implementation details as coded) ...
  }
  
  private addChild(parentIndex: number, childIndex: number): void {
    // Adds childIndex to parentNode.children array
    // ... (Implementation details as coded) ...
  }

  private ensureObjectContext(): void {
    // ... (Implementation details as coded) ...
  }
  
  private ensureFieldContext(): void {
    // ... (Implementation details as coded) ...
  }

  private growNodeArray(): void {
    // ... (Implementation details as coded) ...
  }
}
```

### 2.4 DOMNavigator **[NEXT]**
```typescript
class DOMNavigator {
  private textDecoder = new TextDecoder();
  
  constructor(
    private nodes: LSFNode[],
    private buffer: Uint8Array
  ) {}
  
  getName(nodeIndex: number): string {
    // Decode name span from buffer using TextDecoder
    // ... (Implementation details as coded) ...
  }
  
  getValue(nodeIndex: number): string {
    // Decode value span from buffer using TextDecoder
    // ... (Implementation details as coded) ...
  }
  
  getChildren(nodeIndex: number): number[] {
    // Should return nodes[nodeIndex].children directly
    // ... (Implementation details as coded) ...
  }
  
  getRawValue(nodeIndex: number): {start: number, length: number} {
    // Return raw value span for external processing
    // ... (Implementation details as coded) ...
  }
  
  getType(nodeIndex: number): number {
    // Return node type
    // ... (Implementation details as coded) ...
  }
  
  getTypeHint(nodeIndex: number): number {
    // Return type hint character code
    // ... (Implementation details as coded) ...
  }
}
```

### 2.5 LSFToJSONVisitor **[NEXT]**
```typescript
interface Visitor {
  visitObject(nodeIndex: number): void;
  visitField(nodeIndex: number): void;
  visitValue(nodeIndex: number): void;
  getResult(): any;
}

class LSFToJSONVisitor implements Visitor {
  private result: StringBuilder;
  private navigator: DOMNavigator;
  
  constructor(parseResult: ParseResult) {
    this.navigator = parseResult.navigator;
    this.result = new StringBuilder(estimateOutputSize(parseResult));
  }
  
  visitObject(nodeIndex: number): void {
    // Build JSON object with "{"
    // Process all children (fields)
    // Close with "}"
  }
  
  visitField(nodeIndex: number): void {
    // Handle field with key and value/values
    // Support implicit arrays (multiple values)
  }
  
  visitValue(nodeIndex: number): void {
    // Handle value according to type hint
    // Apply JSON escaping
  }
  
  getResult(): string {
    // Return final JSON string
  }
}
```

## 3. Performance Optimization Focus

### 3.1 Memory Optimization Techniques
- **Pre-allocation**: Estimate memory needs based on input size
- **TypedArrays**: Use Uint32Array for numeric data storage
- **Zero-copy**: Reference original buffer for all string data
- **Minimal allocations**: Reuse objects where possible
- **Efficient growth**: Double capacity with bulk copy when needed

### 3.2 CPU Optimization Techniques
- **Minimal branching**: Design state machines with predictable flow
- **Batched operations**: Process tokens in chunks where possible
- **Hot path optimization**: Minimize function calls in critical paths
- **Inlining**: Inline small, frequently called functions
- **Loop unrolling**: Where beneficial for token processing

### 3.3 Parsing Performance Metrics
- **Tokens/second**: Target >10M tokens/second on modern hardware
- **MB/second**: Target >500MB/second parsing throughput
- **Memory overhead**: Target <3x input size for all metadata

## 4. Development Approach

### 4.1 Test-Driven Implementation
- Develop comprehensive test suite covering all LSF 3.0 features
- Benchmark-driven optimization with performance regression tests
- Unit tests for each component and integration tests for the full pipeline

### 4.2 Test Categories
1. **Correctness Tests**: Verify parsing accuracy and visitor output
2. **Performance Tests**: Measure parsing and conversion speed
3. **Memory Tests**: Track memory usage patterns and peaks
4. **Edge Case Tests**: Test boundary conditions and error handling

## 5. Benchmarking Strategy

### 5.1 Key Benchmarks
- **Token scanning speed**: Measure first pass performance
- **DOM building speed**: Measure second pass performance
- **JSON conversion speed**: Measure visitor pattern efficiency
- **End-to-end throughput**: Full pipeline performance

### 5.2 Benchmark Datasets
- Small documents (simple objects)
- Medium documents (nested structures)
- Large documents (10MB+)
- Complex documents (many arrays and type hints)

## 6. Implementation Timeline

1. **Phase 1**: Token scanner implementation **[COMPLETED]**
2. **Phase 2**: DOM builder implementation **[COMPLETED]**
3. **Phase 3**: DOM navigator and visitor pattern implementation **[IN PROGRESS]**
4. **Phase 4**: Performance optimization and benchmarking
5. **Phase 5**: Documentation and release

## 7. Future Optimizations

- **SIMD support**: Use SIMD instructions for token detection
- **Streaming parser**: Support incremental parsing for very large inputs
- **Worker threads**: Parallel processing for multi-GB inputs
- **Schema validation**: Optional validation during parsing
- **Custom visitors**: Additional output formats beyond JSON 