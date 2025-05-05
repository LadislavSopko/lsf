# LSF Active Context

## Current Focus
Implementation of the LSF 3.0 parser in C# based on the updated specification and implementation plan (ver2-parser-c#-plan.md).
Currently working on **Phase 5: LSF Encoder Implementation**.

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
8.  **C# Implementation**:
    *   Created C# solution with projects: `Zerox.LSF` (netstandard2.0) and `Zerox.LSF.Tests` (net9.0, xUnit).
    *   Updated implementation plan (ver2-parser-c#-plan.md).
    *   **Phase 1 (Core Data Structures)**: Completed (`TokenType`, `ValueHint`, `LSFNode`, `ParseResult`).
    *   **Phase 2 (Token Scanner)**: Implemented `TokenScanner.Scan` and unit tests.
    *   **Phase 3 (DOM Builder)**: Implemented `DOMBuilder.Build` (including implicit nodes, type hints, children population) and unit tests.
    *   **Phase 4 (Navigator & Visitor)**: Completed (`DOMNavigator`, `IVisitor`, `LSFToJSONVisitor` and tests).

## Current Tasks
- Starting Phase 5: LSF Encoder Implementation.
- Define and implement `LSFEncoder` class.
- Implement `EncodeToString` and `EncodeToArray` methods.
- Ensure flat structure enforcement during encoding.
- Handle type hint generation.

## Technical Challenges
- **Optimization**: Improving parser performance (future task).
- **Cross-Language Consistency**: Ensuring C# implementation matches TS behaviour.
- **Encoder Efficiency**: Building the LSF output efficiently (e.g., using StringBuilder or direct byte manipulation).
- **Flat Structure Enforcement**: Detecting and reporting attempts to encode nested structures.

## Next Steps
1.  **Implement C# Phase 5**: 
    - Create `LSFEncoder` class and tests.
2.  **Implement C# Phase 6**: Create main API facade (`LSFParser`) and benchmarking suite.
3.  **Benchmark C# implementation**.
4.  **Optimize C# implementation** (Phase 7).

## Open Questions
- How will the performance of the C# implementation compare to the TypeScript version?
- Which C#-specific optimizations will provide the most benefit?
- What's the best internal strategy for the encoder (StringBuilder vs byte arrays)?

## Current Work Focus
Starting Phase 5: LSF Encoder implementation for the C# LSF parser.

## Recent Changes
- Implemented `LSFToJSONVisitor` and tests (Phase 4).
- Implemented `IVisitor` interface (Phase 4).
- Implemented `DOMNavigator` and tests (Phase 4).
- Completed `DOMBuilder` (Phase 3).
- Created unit tests for `DOMBuilder` (Phase 3).
- Created `ValueHint` enum.
- Finalized `LSFNode` struct.
- Completed `TokenScanner` and tests (Phase 2).
- Completed Core Data Structures (Phase 1).
- Created C# solution structure.
- Updated C# implementation plan.

## Next Steps

### Immediate Tasks
- **Implement `LSFEncoder` class structure**.
- **Implement `EncodeToString` method**.

### Medium-Term Tasks
1.  **Complete C# Implementation**: Follow the phases in ver2-parser-c#-plan.md (Currently starting Phase 5).
2.  **Performance Optimization & Benchmarking**: Compare C# implementation to System.Text.Json.
3.  **Documentation**: Add XML documentation to C# code and update README.

## Active Decisions and Considerations
1.  **Target Framework**: Using .NET Standard 2.0 for the library to maximize compatibility.
2.  **Test Framework**: Using .NET 9.0 and xUnit for tests to leverage the latest features.
3.  **Memory Management**: Will use Span<T> and Memory<T> for zero-copy access.
4.  **API Design**: Will follow .NET Design Guidelines for a clean and consistent API.
5.  **Parsing Strategy**: Implemented two-pass (Scan -> Build).
6.  **DOM Structure**: Using `List<LSFNode>`.
7.  **DOM Access**: Using `DOMNavigator` struct.
8.  **Output Generation**: Using `LSFToJSONVisitor` (Visitor pattern).

## Current Blockers
- None. Ready to start Phase 5. 