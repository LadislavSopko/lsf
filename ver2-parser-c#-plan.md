# LSF 3.0 Parser Implementation Plan - C# Version

## Overview

This document outlines the implementation plan for the LSF 3.0 parser in C#, leveraging the lessons learned from the TypeScript implementation. The C# version will implement the same LSF 3.0 specification with appropriate adaptations for C# language patterns and conventions.

## LSF 3.0 Format Reminders

- **Core Tokens**: `$o~` (object), `$f~` (field), `$v~` (value), `$t~` (type hint)
- **Flat Structure**: No nested objects allowed within fields
- **Implicit Arrays**: Multiple `$v~` tokens for the same field create an implicit array
- **Type Hints**: Optional `$t~` token follows a value to indicate its type (n=number, b=boolean, z=null)

## C# Project Structure

- [x] Create a new C# solution with projects
  - [x] `Zerox.LSF` library project (targeting .NET Standard 2.0)
  - [x] `Zerox.LSF.Tests` test project (targeting .NET 9.0)
  - [x] Set up xUnit testing framework

## Implementation Phases

### Phase 1: Core Data Structures

- [x] Create `TokenType.cs` enum for token types (`Object`, `Field`, `Value`, `TypeHint`)
- [x] Create `LSFNode.cs` class/struct for DOM representation
- [x] Create `ParseResult.cs` class to hold parsing results
- [x] Create interfaces for the core components

### Phase 2: Token Scanner Implementation

- [x] Implement `TokenScanner` class
  - [x] Method to scan input buffer (ReadOnlySpan<byte>) for tokens
  - [x] Storage for token positions using native arrays (List<TokenInfo> used)
  - [x] Efficient resizing strategy for token arrays (List handles this)
  - [x] Handle UTF-8 encoding correctly
- [x] Create unit tests for `TokenScanner`
  - [x] Basic token recognition
  - [x] Position tracking
  - [x] Multiple adjacent tokens
  - [x] Overlapping token-like sequences (Handled by loop increment)
  - [x] Handling of non-token `$` characters

### Phase 3: DOM Builder Implementation

- [x] Implement `DOMBuilder` class
  - [x] Method to build DOM from token positions
  - [x] Token-Data strategy (content between tokens)
  - [x] Per-node children arrays (using List<int>)
  - [x] Implicit node creation for malformed input
  - [x] Type hint processing
- [x] Create unit tests for `DOMBuilder`
  - [x] Simple object/field parsing
  - [x] Implicit arrays
  - [x] Type hints
  - [x] Implicit nodes
  - [x] Error handling (Basic unexpected token check)

### Phase 4: DOM Navigator & Visitor Implementation

- [x] Implement `DOMNavigator` class
  - [x] Zero-copy access to spans in the input buffer
  - [x] Methods to get name, value, children, etc.
  - [x] UTF-8 handling for text extraction
- [x] Implement Visitor pattern
  - [x] Define `IVisitor` interface 
  - [x] Implement `LSFToJSONVisitor` class
  - [x] Create string builder utilities (if needed) (Used StringBuilder directly)
- [x] Create unit tests for both components
  - [x] Navigator access methods
  - [x] JSON conversion
  - [x] Type handling
  - [x] UTF-8 text extraction (Handled via Navigator)

### Phase 5: LSF Encoder Implementation

- [x] Implement `LSFEncoder` class
  - [x] Methods for encoding C# objects to LSF format (Dictionary<string, object?> input)
  - [x] `EncodeToArray` (byte[]) method
  - [x] `EncodeToString` (string) method
  - [x] Flat structure enforcement (via exception)
  - [x] Type hint generation
- [x] Create unit tests for `LSFEncoder`
  - [x] Object encoding
  - [x] Implicit array encoding
  - [x] Type hint generation
  - [x] UTF-8 handling (via EncodeToArray test)
  - [x] Error cases (nested objects, unsupported types)

### Phase 6: Integration & Benchmarking

- [x] Create main API facade class (`LSFParser`)
  - [x] Public methods for parsing LSF to DOM
  - [x] Public methods for parsing LSF to JSON (string)
  - [x] Public methods for encoding objects to LSF
- [ ] Implement benchmarking suite
  - [ ] Generate diverse datasets: small (~KB), medium (~MB)
  - [ ] Comparison of parsing/encoding speed against System.Text.Json/Newtonsoft.Json
  - [ ] Performance profiling (CPU, memory allocation)
  - [ ] **New**: Analyze LSF vs. JSON token efficiency (e.g., using a standard tokenizer like tiktoken) for representative data structures, considering LLM input cost.
- [ ] Run benchmarks and analyze results

### Phase 7: Optimization

- [ ] Profile code to identify bottlenecks
- [ ] Optimize `DOMBuilder` (known bottleneck in TypeScript version)
- [ ] C#-specific optimizations:
  - [ ] Span<T> and Memory<T> usage
  - [ ] Minimize allocations in hot paths
  - [ ] ArrayPool<T> for array reuse
  - [ ] Consider unsafe code for critical sections
- [ ] Re-run benchmarks to measure improvement

### Phase 8: Documentation & Packaging

- [ ] Add XML documentation comments to all public APIs
- [ ] Create comprehensive README with examples
- [ ] Create NuGet package configuration
- [ ] Ensure public API is clean and consistent

## Implementation Considerations

### C# Specific Approaches

1. **Target Frameworks**:
   - Library: .NET Standard 2.0 for maximum compatibility
   - Tests: .NET 9.0 for latest features and performance

2. **Memory Management**:
   - Use `Span<T>` and `Memory<T>` for zero-allocation slicing
   - Consider `ArrayPool<T>` for array reuse
   - Use `StringPool` for frequently accessed strings

3. **Performance Optimizations**:
   - Minimize allocations in parsing hot paths
   - Use struct options where appropriate for small value objects
   - Consider unsafe code blocks for performance-critical sections
   - Use `StringBuilder` with appropriate initial capacity

4. **API Design**:
   - Follow C# conventions (.NET Design Guidelines)
   - Proper exception handling with custom LSF exceptions
   - Support both synchronous and asynchronous parsing
   - Provide extension methods where appropriate

### Learning From TypeScript Implementation

1. **Flat Structure Enforcement**:
   - Both encoder and parser must verify and enforce flat structure rule
   - Clear error messages for nested structure attempts

2. **Performance Bottlenecks**:
   - DOMBuilder was the main bottleneck in TypeScript
   - Focus optimization efforts there first

3. **Zero-Copy Navigation**:
   - Design navigator to work with memory spans for maximum performance
   - Use ReadOnlySpan<byte> for efficient buffer access

4. **Benchmark Approach**:
   - Create flat LSF datasets for accurate benchmarking
   - Compare with System.Text.Json and Newtonsoft.Json
   - Test small, medium, and large datasets

## Testing Strategy

- Use xUnit for unit testing (already configured)
- Create test helpers for generating test data
- Test both normal and edge cases
- Include performance tests
- Ensure cross-platform testing (Windows, Linux, macOS)

## Timeline Estimate

- **Phase 1 (Core Data Structures)**: Complete (Day 1)
- **Phase 2 (Token Scanner)**: Complete (Day 1-2)
- **Phase 3 (DOM Builder)**: Complete (Day 2-3)
- **Phase 4 (Navigator & Visitor)**: Complete (Day 3-4)
- **Phase 5 (Encoder)**: Complete (Day 4-5)
- **Phase 6 (Integration & Benchmarking)**: 1-2 days
- **Phase 7 (Optimization)**: 2-3 days
- **Phase 8 (Documentation & Packaging)**: 1 day

**Total Estimated Time**: 13-16 days (Good progress)

This plan is subject to adjustment based on discoveries during implementation. 