# LSF Active Context

## Current Focus
Implementation of the LSF 3.0 parser in C# based on the updated specification and implementation plan (ver2-parser-c#-plan.md).
Currently working on **Phase 6: Integration & Benchmarking**.

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
    *   **Phase 5 (Encoder)**: Completed (`LSFEncoder` and tests for Dictionary input).

## Current Tasks
- Starting Phase 6: Integration & Benchmarking.
- Create main API facade class (`LSFParser`).
- Define public methods for parsing to DOM/JSON and encoding from objects.
- Implement benchmarking suite setup.
- Generate small, medium, large datasets (or adapt from TS version).

## Technical Challenges
- **API Design**: Creating a clean, intuitive, and efficient public API.
- **Benchmarking**: Setting up fair and accurate benchmarks against System.Text.Json / Newtonsoft.Json.
- **Performance Analysis**: Interpreting benchmark results to guide optimization.

## Next Steps
1.  **Implement C# Phase 6**: 
    - Create `LSFParser` facade class.
    - Set up benchmark project/harness.
    - Run initial benchmarks.
2.  **Implement C# Phase 7**: Analyze benchmark results and optimize code.
3.  **Implement C# Phase 8**: Add documentation and package.

## Open Questions
- How will the performance of the C# implementation compare to the TypeScript version and standard JSON libraries?
- What specific areas will likely need optimization based on benchmarks?
- Should the public API handle streams in addition to strings/byte arrays?

## Current Work Focus
Starting Phase 6: Integration (API facade) and Benchmarking setup for the C# LSF parser.

## Recent Changes
- Implemented `LSFEncoder` and tests (Phase 5).
- Completed Visitor pattern implementation (Phase 4).
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
- **Create `LSFParser.cs`** file and define class structure.
- **Define public static methods** for Parse/Encode operations.

### Medium-Term Tasks
1.  **Complete C# Implementation**: Follow the phases in ver2-parser-c#-plan.md (Currently starting Phase 6).
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
8.  **Output Generation**: Using `LSFToJSONVisitor`.
9.  **Encoding**: Using `LSFEncoder` for Dictionary input.

## Current Blockers
- None. Ready to start Phase 6.

## Recent Activity
- Completed the core parser library implementation (Phases 1-5).
- Implemented the main API facade (`LSFParser`).
- Set up a basic benchmarking project using BenchmarkDotNet.
- Implemented initial benchmarks comparing `LSFParser.ParseToJsonString` against `System.Text.Json.Deserialize` using a small, hardcoded dataset.
- Discussed the scope of benchmarking, clarifying the need to compare against standard libraries (like Newtonsoft.Json) and focus on dataset sizes relevant to LLM output (up to ~MB range).
- Reverted benchmark code changes to align with the existing `ParseToJsonString` vs `System.Text.Json` comparison, pending further decisions.
- Updated the project plan (`ver2-parser-c#-plan.md`) to reflect the current state and remaining benchmarking tasks.

## Key Decisions / Considerations
- Benchmarking will focus on parsing performance relevant to the LLM use case.
- Datasets up to the medium (~MB) size range are considered sufficient.
- Comparison against `Newtonsoft.Json` is desired (package is already referenced).
- Need to decide on the next specific benchmarking task (e.g., implement `ParseToDom` benchmark, add `Newtonsoft.Json` benchmark, start dataset generation).

## Next Steps
- Await user decision on the next benchmark implementation step:
    1. Add `ParseToDom` benchmark.
    2. Add `Newtonsoft.Json` benchmark.
    3. Start dataset generation.
- Proceed with the chosen task. 