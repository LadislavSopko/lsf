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

- [ ] Create `TokenType.cs` enum for token types (`Object`, `Field`, `Value`, `TypeHint`)
- [ ] Create `LSFNode.cs` class/struct for DOM representation
- [ ] Create `ParseResult.cs` class to hold parsing results
- [ ] Create interfaces for the core components

### Phase 2: Token Scanner Implementation

- [ ] Implement `TokenScanner` class
  - [ ] Method to scan input buffer (ReadOnlySpan<byte>) for tokens
  - [ ] Storage for token positions using native arrays
  - [ ] Efficient resizing strategy for token arrays
  - [ ] Handle UTF-8 encoding correctly
- [ ] Create unit tests for `TokenScanner`
  - [ ] Basic token recognition
  - [ ] Position tracking
  - [ ] Multiple adjacent tokens
  - [ ] Overlapping token-like sequences
  - [ ] Handling of non-token `$` characters

### Phase 3: DOM Builder Implementation

- [ ] Implement `DOMBuilder` class
  - [ ] Method to build DOM from token positions
  - [ ] Token-Data strategy (content between tokens)
  - [ ] Per-node children arrays
  - [ ] Implicit node creation for malformed input
  - [ ] Type hint processing
- [ ] Create unit tests for `DOMBuilder`
  - [ ] Simple object/field parsing
  - [ ] Implicit arrays
  - [ ] Type hints
  - [ ] Implicit nodes
  - [ ] Error handling

### Phase 4: DOM Navigator & Visitor Implementation

- [ ] Implement `DOMNavigator` class
  - [ ] Zero-copy access to spans in the input buffer
  - [ ] Methods to get name, value, children, etc.
  - [ ] UTF-8 handling for text extraction
- [ ] Implement Visitor pattern
  - [ ] Define `IVisitor` interface 
  - [ ] Implement `LSFToJSONVisitor` class
  - [ ] Create string builder utilities (if needed)
- [ ] Create unit tests for both components
  - [ ] Navigator access methods
  - [ ] JSON conversion
  - [ ] Type handling
  - [ ] UTF-8 text extraction

### Phase 5: LSF Encoder Implementation

- [ ] Implement `LSFEncoder` class
  - [ ] Methods for encoding C# objects to LSF format
  - [ ] `EncodeToArray` (byte[]) method
  - [ ] `EncodeToString` (string) method
  - [ ] Flat structure enforcement
  - [ ] Type hint generation
- [ ] Create unit tests for `LSFEncoder`
  - [ ] Object encoding
  - [ ] Implicit array encoding
  - [ ] Type hint generation
  - [ ] UTF-8 handling
  - [ ] Error cases (nested objects)

### Phase 6: Integration & Benchmarking

- [ ] Create main API facade class (`LSFParser`)
  - [ ] Public methods for parsing LSF to DOM
  - [ ] Public methods for parsing LSF to JSON (string)
  - [ ] Public methods for encoding objects to LSF
- [ ] Implement benchmarking suite
  - [ ] Small, medium, large dataset generation
  - [ ] Comparison to System.Text.Json/Newtonsoft.Json
  - [ ] Performance profiling
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

- **Phase 1 (Core Data Structures)**: 1 day
- **Phase 2 (Token Scanner)**: 2 days
- **Phase 3 (DOM Builder)**: 2-3 days
- **Phase 4 (Navigator & Visitor)**: 2 days
- **Phase 5 (Encoder)**: 2 days
- **Phase 6 (Integration & Benchmarking)**: 1-2 days
- **Phase 7 (Optimization)**: 2-3 days
- **Phase 8 (Documentation & Packaging)**: 1 day

**Total Estimated Time**: 13-16 days

This plan is subject to adjustment based on discoveries during implementation. 