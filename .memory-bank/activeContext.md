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
4.  **Visitor Pattern**: Design for JSON conversion outlined in plan.

## Current Tasks
- Implement **Phase 3a: DOMNavigator** for zero-copy traversal and access (getName, getValue, getChildren).
- Implement **Phase 3b: LSFToJSONVisitor** using DOMNavigator.

## Technical Challenges
- Ensuring zero-copy string access in DOMNavigator is efficient and correct (UTF-8 handling).
- Optimizing JSON visitor performance.

## Next Steps
1.  **Implement DOMNavigator**: Create class, methods for accessing node data from buffer.
2.  **Implement LSFToJSONVisitor**: Create class, implement Visitor interface methods.
3.  **Add Tests**: Create comprehensive tests for Navigator and Visitor.
4.  **Integrate Navigator**: Update `DOMBuilder.buildDOM` to return an instance of the actual `DOMNavigator` instead of a placeholder.
5.  Benchmark performance.

## Open Questions
- Optimal strategy for `StringBuilder` in `LSFToJSONVisitor` for performance.
- Final API design for the main `parse` function (e.g., `parse(input: string | Uint8Array): any`).

## Current Work Focus
Transitioning from parser implementation (Scanner, Builder) to parser usage (Navigator, Visitor). The core parsing logic (Phases 1 & 2) is complete and tested.

## Recent Changes
- Implemented `TokenScanner` (Pass 1).
- Implemented `DOMBuilder` (Pass 2) including logic for flat structure, implicit nodes, type hints.
- Refactored `DOMBuilder` and `LSFNode` types to use per-node `children` arrays.
- Confirmed and refined LSF 3.0 parsing strategy (Token-Data, implicit nodes).
- Expanded test suites for both components.

## Next Steps

### Immediate Tasks
1.  **DOMNavigator Implementation**: `dom-navigator.ts`.
2.  **LSFToJSONVisitor Implementation**: `visitor.ts`.
3.  **Testing**: Add tests for Navigator and Visitor.

### Medium-Term Tasks
1.  **Performance Optimization & Benchmarking**: Focus after core functionality is complete.
2.  **Documentation**: Update based on final LSF 3.0 implementation.
3.  **Language Implementations**: Plan porting to Python etc.

## Active Decisions and Considerations
1.  **Parsing Strategy**: Two-Pass, Token-Data, Flat Structure, Implicit Nodes.
2.  **DOM Structure**: Per-node `children` arrays.
3.  **Memory**: Pre-allocation in builders, zero-copy target via Navigator.
4.  **Output**: Visitor pattern for flexibility (JSON first).

## Current Blockers
None. Ready to proceed with DOMNavigator and Visitor implementation. 