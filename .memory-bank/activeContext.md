# LSF Active Context

## Current Focus
Implementation of the LSF 3.0 parser in C# based on the updated specification and implementation plan (ver2-parser-c#-plan.md).

### Key Changes from LSF v2.0 to v3.0
- Reduced to three core tokens: `$o~`, `$f~`, `$v~` (plus optional `$t~`).
- Removed explicit array tokens (`$a~`); implicit arrays via multiple `$v~`.
- **Confirmed flat structure:** No nested objects allowed (`$o~` cannot appear within another object's context).
- Adopted strict two-pass parsing: Token scanning followed by DOM building.

## Recent Decisions & Progress
1.  **Parser Architecture**: Confirmed two-pass (TokenScanner -> DOMBuilder).
2.  **TokenScanner (Pass 1)**: Implemented and tested in TypeScript. Correctly identifies tokens and byte positions.
3.  **DOMBuilder (Pass 2)**: Implemented and tested in TypeScript.
    *   Uses **Token-Data Strategy**: Node content determined by text between its token and the next token.
    *   Handles **Implicit Nodes**: Creates anonymous objects (for `$f~` without `$o~`) and default fields (for `$v~` without `$f~`).
    *   Uses **Per-Node Children**: Refactored from flat `nodeChildren` array to `LSFNode.children: number[]` for correct hierarchical representation. Handles implicit arrays.
    *   Handles **Type Hints**: `$t~` applies hint to preceding `$v~` node; standalone `$t~` ignored with warning.
4.  **DOMNavigator (Part of Pass 3)**: Implemented and tested in TypeScript. Provides zero-copy access via spans.
5.  **LSFToJSONVisitor (Part of Pass 3)**: Implemented and tested in TypeScript. Converts DOM to JSON string.
6.  **LSFEncoder (Phase 4)**: Implemented and tested in TypeScript (`encodeLSFToArray`, `encodeLSFToString`), enforces flat structure.
7.  **Benchmarking (Phase 4)**: Completed initial run.
    *   Compared LSF Scan+Build vs `JSON.parse` on small/medium/large datasets.
    *   `JSON.parse` faster on small/medium.
    *   `TokenScanner` scales well; `DOMBuilder` is bottleneck on large data.
    *   `JSON.parse` ~1.4x faster than LSF Scan+Build on large dataset.
8.  **C# Implementation**: Started project setup.
    *   Created C# solution with two projects: `Zerox.LSF` (library targeting .NET Standard 2.0) and `Zerox.LSF.Tests` (xUnit tests targeting .NET 9.0).
    *   Updated implementation plan (ver2-parser-c#-plan.md) to align with the existing C# project.

## Current Tasks
- Starting the C# implementation of the LSF 3.0 parser, following the updated implementation plan.
- Implementing core data structures in C# version.

## Technical Challenges
- **Optimization**: Improving `DOMBuilder` performance in TS without sacrificing zero-copy navigator benefits.
- **Cross-Language Consistency**: Ensuring C# implementation matches TypeScript behavior and performance characteristics.
- **C# Memory Management**: Leveraging Span<T> and Memory<T> for zero-allocation parsing in C#.

## Next Steps
1.  **Implement C# version**: 
    - Create core data structures (TokenType enum, LSFNode class/struct, ParseResult class)
    - Implement TokenScanner with ReadOnlySpan<byte> support
    - Implement DOMBuilder with efficient memory management
    - Create Navigator and Visitor implementations
    - Implement LSFEncoder
2.  **Benchmark C# implementation**: Compare performance to System.Text.Json and TypeScript implementation.
3.  **Optimize C# implementation**: Apply C#-specific optimizations (ArrayPool<T>, etc).

## Open Questions
- How will the performance of the C# implementation compare to the TypeScript version?
- Which C#-specific optimizations will provide the most benefit?
- Should we implement both sync and async versions in C#?

## Current Work Focus
Beginning C# implementation of the LSF 3.0 parser.

## Recent Changes
- Created C# solution structure with library and test projects.
- Updated C# implementation plan.
- TypeScript implementation previously completed.

## Next Steps

### Immediate Tasks
- **Implement core data structures** in C# version.
- **Implement TokenScanner** with ReadOnlySpan<byte> support.

### Medium-Term Tasks
1.  **Complete C# Implementation**: Follow the phases in ver2-parser-c#-plan.md.
2.  **Performance Optimization & Benchmarking**: Compare C# implementation to System.Text.Json.
3.  **Documentation**: Add XML documentation to C# code and update README.

## Active Decisions and Considerations
1.  **Target Framework**: Using .NET Standard 2.0 for the library to maximize compatibility.
2.  **Test Framework**: Using .NET 9.0 and xUnit for tests to leverage the latest features.
3.  **Memory Management**: Will use Span<T> and Memory<T> for zero-copy access.
4.  **API Design**: Will follow .NET Design Guidelines for a clean and consistent API.
5.  **Parsing Strategy**: Will implement same two-pass, Token-Data strategy as TypeScript version.

## Current Blockers
- None. Ready to begin C# implementation. 