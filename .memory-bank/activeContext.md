# LSF Active Context

## Current Focus
Implementation of the LSF 3.0 parser based on the updated specification and plan (ver2-parser-plan.md).

### Key Changes from LSF v2.0 to v3.0
- Reduced to three core tokens: `$o~`, `$f~`, `$v~` (plus optional `$t~`).
- Removed explicit array tokens (`$a~`); implicit arrays via multiple `$v~`.
- **Confirmed flat structure:** No nested objects allowed (`$o~` cannot appear within another object's context).
- Adopted strict two-pass parsing: Token scanning followed by DOM building.

## Recent Decisions & Progress
1.  **Parser Architecture**: Confirmed two-pass (TokenScanner -> DOMBuilder).
2.  **TokenScanner (Pass 1)**: Implemented and tested. Correctly identifies tokens and byte positions.
3.  **DOMBuilder (Pass 2)**: Implemented and tested.
    *   Uses **Token-Data Strategy**: Node content determined by text between its token and the next token.
    *   Handles **Implicit Nodes**: Creates anonymous objects (for `$f~` without `$o~`) and default fields (for `$v~` without `$f~`).
    *   Uses **Per-Node Children**: Refactored from flat `nodeChildren` array to `LSFNode.children: number[]` for correct hierarchical representation. Handles implicit arrays.
    *   Handles **Type Hints**: `$t~` applies hint to preceding `$v~` node; standalone `$t~` ignored with warning.
4.  **DOMNavigator (Part of Pass 3)**: Implemented and tested. Provides zero-copy access via spans.
5.  **LSFToJSONVisitor (Part of Pass 3)**: Implemented and tested. Converts DOM to JSON string.
6.  **LSFEncoder (Phase 4)**: Implemented and tested (`encodeLSFToArray`, `encodeLSFToString`), enforces flat structure.
7.  **Benchmarking (Phase 4)**: Completed initial run.
    *   Compared LSF Scan+Build vs `JSON.parse` on small/medium/large datasets.
    *   `JSON.parse` faster on small/medium.
    *   `TokenScanner` scales well; `DOMBuilder` is bottleneck on large data.
    *   `JSON.parse` ~1.4x faster than LSF Scan+Build on large dataset.

## Current Tasks
- **Paused**: Project paused before starting optimization or multi-language implementation.

## Technical Challenges
- **Optimization**: Improving `DOMBuilder` performance in TS without sacrificing zero-copy navigator benefits.
- **Cross-Language Consistency**: Ensuring Python/C# implementations match TS behaviour and performance characteristics.

## Next Steps
1.  **Decide next focus**: Optimize TS, benchmark built JS, or start Python/C# implementation.
2.  If optimizing TS: Analyze `DOMBuilder` for bottlenecks.
3.  If benchmarking built JS: Set up Node.js benchmark script for `dist/` files.
4.  If starting new language: Set up project structure and begin translating core logic.

## Open Questions
- How much optimization is needed for the TS version before moving to other languages?
- Will built/bundled JS performance meet the target (<1.4x slower than JSON.parse)?

## Current Work Focus
Paused after completing the initial TypeScript implementation and benchmarking.

## Recent Changes
- Implemented `TokenScanner` (Pass 1).
- Implemented `DOMBuilder` (Pass 2).
- Implemented `DOMNavigator` (Pass 3a).
- Implemented `LSFToJSONVisitor` (Pass 3b).
- Implemented `LSFEncoder` (Phase 4).
- Ran initial benchmarks (Phase 4).
- Identified `DOMBuilder` as performance bottleneck in TS.
- Recreated accidentally deleted `implementations/benchmarks/data.js`.

## Next Steps

### Immediate Tasks
- **Wait for user decision** on next focus area (TS optimization, built JS benchmark, Python/C#).

### Medium-Term Tasks
1.  **Performance Optimization & Benchmarking**: Refine based on user decision.
2.  **Documentation**: Update based on final LSF 3.0 implementation.
3.  **Language Implementations**: Implement Python, C# etc.

## Active Decisions and Considerations
1.  **Parsing Strategy**: Two-Pass, Token-Data, Flat Structure, Implicit Nodes.
2.  **DOM Structure**: Per-node `children` arrays for zero-copy navigation.
3.  **Memory**: Pre-allocation in builders, zero-copy via Navigator.
4.  **Output**: Visitor pattern for flexibility (JSON first).
5.  **Encoder**: Provides `Uint8Array` and `string` output, enforces flat structure.
6.  **Benchmarking**: Use specific flat LSF datasets vs original nested JSON datasets.

## Current Blockers
- Project paused, awaiting user direction. 