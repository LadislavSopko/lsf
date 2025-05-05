# LSF 3.0 Parser Implementation Plan - Python Version

## Overview

This document outlines the implementation plan for the LSF 3.0 parser in Python, adapting the structure and lessons learned from the C# implementation. The goal is to create a performant and reliable Python library for parsing and encoding LSF v3.0 data.

## LSF 3.0 Format Reminders

- **Core Tokens**: `$o~` (object), `$f~` (field), `$v~` (value), `$t~` (type hint)
- **Flat Structure**: No nested objects allowed within fields (`$o~` cannot appear within another object's context).
- **Implicit Arrays**: Multiple `$v~` tokens for the same field create an implicit array.
- **Type Hints**: Optional `$t~` token follows a value to indicate its type (n=numeric, b=boolean, z=null). Default is string.

## Python Project Structure

- [ ] Create project directory (e.g., `implementations/python/lsf_parser/`)
- [ ] Set up virtual environment (`venv`)
- [ ] Initialize project structure (`src/lsf_parser`, `tests/`)
- [ ] Add development dependencies (`pytest`, `pytest-benchmark` if needed) to `requirements-dev.txt`
- [ ] Basic `setup.py` or `pyproject.toml` for packaging later.

## Implementation Phases

### Phase 1: Core Data Structures

- [ ] Define `TokenType` enum (e.g., using `enum.Enum`).
- [ ] Define `ValueHint` enum.
- [ ] Define `LSFNode` class (consider `dataclasses.dataclass` for simplicity) to represent DOM nodes.
    - `token_type: TokenType`
    - `token_position: int`
    - `data_position: int`
    - `data_length: int`
    - `parent_index: int`
    - `children_indices: List[int]` (or None)
    - `type_hint: ValueHint`
- [ ] Define `ParseResult` class (dataclass?) to hold parsing results.
    - `success: bool`
    - `nodes: Optional[List[LSFNode]]`
    - `error_message: Optional[str]`

### Phase 2: Token Scanner Implementation

- [ ] Implement `TokenScanner` class or function (`scan`).
  - [ ] Input: `bytes` or `memoryview`.
  - [ ] Output: `List[TokenInfo]` (could be a simple tuple or a dedicated class/dataclass). Each element should store token type, position, potentially data start/end.
  - [ ] Efficiently iterate through bytes, identifying LSF tokens.
  - [ ] Handle UTF-8 correctly (LSF tokens are ASCII, data is UTF-8).
- [ ] Create unit tests using `pytest`.
  - [ ] **Note:** Leverage C# `TokenScannerTests.cs` for test scenarios and input data.
  - [ ] Basic token recognition.
  - [ ] Position tracking.
  - [ ] Handling adjacent/overlapping token-like sequences.

### Phase 3: DOM Builder Implementation

- [ ] Implement `DOMBuilder` class or function (`build`).
  - [ ] Input: List of tokens from scanner, original input bytes/memoryview.
  - [ ] Output: `ParseResult` containing the list of `LSFNode`s.
  - [ ] Implement Token-Data strategy for extracting node content based on token positions.
  - [ ] Populate `children_indices` for each node.
  - [ ] Handle implicit node creation (e.g., field without object, value without field).
  - [ ] Process type hints (`$t~`) and store in `LSFNode.type_hint`.
- [ ] Create unit tests using `pytest`.
  - [ ] **Note:** Leverage C# `DOMBuilderTests.cs` for test scenarios, input data, and verified expected DOM structures.
  - [ ] Simple object/field parsing.
  - [ ] Implicit arrays.
  - [ ] Type hints.
  - [ ] Implicit nodes.
  - [ ] Basic error handling (malformed sequences).

### Phase 4: DOM Navigator & Visitor Implementation

- [ ] Implement `DOMNavigator` class.
  - [ ] Input: Original input bytes/memoryview, list of `LSFNode`s.
  - [ ] Provide methods for efficient data access (e.g., `get_node(index)`, `get_node_data_bytes(index)`, `get_node_data_str(index)`, `get_children_indices(index)`, `get_root_indices()`).
  - [ ] Leverage `memoryview` for zero-copy slicing where possible.
  - [ ] Handle UTF-8 decoding for string access.
- [ ] Implement Visitor pattern (optional but good practice) OR direct JSON conversion.
  - [ ] Define base `Visitor` class or protocol (if using Visitor).
  - [ ] Implement `LSFToJSONConverter` class or function.
      - Input: `DOMNavigator`.
      - Output: JSON-compatible Python object (`dict`, `list`) or JSON string.
- [ ] Create unit tests for both components.
  - [ ] **Note:** Leverage C# `DOMNavigatorTests.cs` and `LSFToJSONVisitorTests.cs` for scenarios, inputs, and verified outputs (especially JSON string escaping).
  - [ ] Navigator access methods.
  - [ ] JSON conversion accuracy (structure, types, implicit arrays).
  - [ ] UTF-8 text extraction.

### Phase 5: LSF Encoder Implementation

- [ ] Implement `LSFEncoder` class or functions (`encode_to_string`, `encode_to_bytes`).
  - [ ] Input: Python `dict` representing a single flat object (keys are strings, values are primitives or lists of primitives/None).
  - [ ] Output: LSF formatted `str` or `bytes`.
  - [ ] Enforce flat structure rule (raise `ValueError` for nested dicts).
  - [ ] Generate type hints (`$t~`) correctly based on Python types.
  - [ ] Handle implicit array encoding for list values.
- [ ] Create unit tests using `pytest`.
  - [ ] **Note:** Leverage C# `LSFEncoderTests.cs` for test scenarios, input data (Python dicts), and verified LSF output strings/bytes.
  - [ ] Object encoding.
  - [ ] Implicit array encoding.
  - [ ] Type hint generation (int, float, bool, None, str).
  - [ ] UTF-8 handling in `encode_to_bytes`.
  - [ ] Error cases (nested dicts, unsupported types).

### Phase 6: Integration & Benchmarking

- [ ] Create main API facade (e.g., top-level functions in `lsf_parser/__init__.py`).
  - [ ] `parse_to_dom(lsf_input: bytes | str) -> ParseResult`
  - [ ] `parse_to_json_obj(lsf_input: bytes | str) -> dict | list | None` (or similar Python structure)
  - [ ] `parse_to_json_str(lsf_input: bytes | str) -> str | None`
  - [ ] `encode_to_string(data: dict, object_name: str = "") -> str`
  - [ ] `encode_to_bytes(data: dict, object_name: str = "") -> bytes`
- [ ] Implement benchmarking suite (using `pytest-benchmark` or `timeit`).
  - [ ] Generate diverse datasets: small (~KB), medium (~MB) (similar to C# generator).
  - [ ] Benchmark `parse_to_dom` vs `json.loads`.
  - [ ] Benchmark `parse_to_json_obj` vs `json.loads`.
  - [ ] *Optional*: Benchmark encoding vs `json.dumps`.
- [ ] Run benchmarks and analyze results. Focus on `parse_to_dom` speed and allocation patterns (if possible to measure easily in Python).

### Phase 7: Optimization (Conditional)

- [ ] Based on benchmarks, identify bottlenecks (likely DOM building).
- [ ] Explore Python-specific optimizations:
    - Minimize temporary object creation in loops.
    - Use `memoryview` effectively.
    - Consider Cython or other compilation techniques for critical sections if performance is insufficient (evaluate complexity vs. benefit).
- [ ] Re-run benchmarks if optimizations are implemented.
- [ ] (Decision Point: Skip if performance is deemed sufficient, similar to C#).

### Phase 8: Documentation & Packaging

- [ ] Add docstrings (following PEP 257) to all public classes, functions, and methods.
- [ ] Create comprehensive `README.md` for the Python implementation.
- [ ] Configure `pyproject.toml` (or `setup.py`) for PyPI packaging.
    - Metadata (name, version, author, description, license, classifiers, etc.).
    - Dependencies.
- [ ] Ensure public API is clean and Pythonic.
- [ ] Publish to PyPI (manual step).

## Implementation Considerations

- **Python Idioms**: Use Pythonic conventions (list comprehensions, generators, context managers where applicable).
- **Memory Views**: Leverage `memoryview` for efficient slicing of byte inputs without copying.
- **Type Hinting**: Use Python type hints (PEP 484) for better code clarity and maintainability.
- **Error Handling**: Use standard Python exceptions (`ValueError`, `TypeError`).
- **Dependencies**: Keep runtime dependencies minimal (ideally zero).

## Timeline Estimate

- *Estimate based on C# experience, adjust as needed.*
- **Phase 1 (Core Data Structures)**: <1 day
- **Phase 2 (Token Scanner)**: 1 day
- **Phase 3 (DOM Builder)**: 1-2 days
- **Phase 4 (Navigator & Visitor/Converter)**: 1-2 days
- **Phase 5 (Encoder)**: 1 day
- **Phase 6 (Integration & Benchmarking)**: 1-2 days
- **Phase 7 (Optimization)**: 1-2 days (if needed)
- **Phase 8 (Documentation & Packaging)**: 1 day

**Total Estimated Time**: ~7-12 days

This plan provides a solid roadmap for developing the Python LSF parser. We can adjust it as we go. 