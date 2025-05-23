# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LSF (LLM-Safe Format) is a minimal serialization format designed for reliable structured data generation by LLMs. It uses only 3 structural tokens: `$o~` (object), `$f~` (field), `$v~` (value), with optional type hints via `$t~`.

Key characteristics:
- No brackets, quotes, or nesting (prevents LLM generation errors)
- Arrays are implicit (multiple `$v~` for same field)
- Streaming-safe, single-pass parsing
- Not human-readable by design

## Commands

### C# Implementation
```bash
cd implementations/csharp/Zerox.LSF
dotnet test                                    # Run all tests
dotnet test --filter FullyQualifiedName~TokenScannerTests  # Run specific test class
dotnet run -c Release -p Zerox.LSF.Benchmarks # Run benchmarks
```

### JavaScript/TypeScript Implementation
```bash
cd implementations/javascript
npm install         # Install dependencies
npm run build       # Build TypeScript
npm test           # Run all tests
npm run test:watch  # Run tests in watch mode
npm run bench      # Run benchmarks
npm run bundle     # Create production bundle (cjs/esm)
npm run lint       # Run ESLint
```

### Python Implementation
```bash
cd implementations/python
python -m pytest           # Run all tests
python -m pytest -v       # Run tests with verbose output
python -m pytest tests/test_token_scanner.py  # Run specific test file
pip install -e .          # Install package in development mode
```

## Architecture

All three implementations (C#, TypeScript, Python) follow the same architecture pattern:

1. **TokenScanner**: Lexical analysis to identify tokens (`$o~`, `$f~`, `$v~`, `$t~`)
2. **DOMBuilder**: Constructs a node tree from tokens
3. **DOMNavigator**: Provides API to traverse the node tree
4. **Visitor Pattern**: Transforms DOM to other formats (e.g., LSFToJSONVisitor)
5. **Encoder**: Converts dictionaries/objects to LSF format

Key implementation details:
- C# uses `ReadOnlyMemory<byte>` for zero-copy parsing
- TypeScript uses `Uint8Array` for byte-level operations
- Python uses `bytes` and `memoryview` for efficient parsing
- All support string and byte array inputs/outputs
- Single-pass parsing with O(n) complexity

## Testing Patterns

- Unit tests cover: TokenScanner, DOMBuilder, DOMNavigator, Encoder, Visitor
- Test edge cases: empty values, special characters, malformed input
- Benchmark tests compare performance against JSON parsing
- All implementations use similar test structures and cases
- Total test coverage: 210 tests (C#: 82, TypeScript: 70, Python: 58)


# CODING & INTERACTION NOTES

## Collaboration Rules

When working with Claude Code on this project, follow these operational modes and context rules:

### Operational Modes

1. **PLAN Mode**
   - PLAN is "thinking" mode, where Claude discusses implementation details and plans 
   - Default starting mode for all interactions
   - Used for discussing implementation details without making code changes
   - Claude will print `# Mode: PLAN` at the beginning of each response
   - Outputs relevant portions of the plan based on current context level
   - If action is requested, Claude will remind you to approve the plan first

2. **ACT Mode**
   - Only activated when the user explicitly types `ACT`
   - Used for making actual code changes based on the approved plan
   - Claude will print `# Mode: ACT` at the beginning of each response
   - Automatically returns to PLAN mode after each response
   - Can be manually returned to PLAN mode by typing `PLAN`

When switching to a new task or module, Claude will ask which context level to use if not specified.

This workflow ensures:
1. Deliberate development with clear approval steps before code changes
2. Appropriate context level to balance comprehensive understanding with token efficiency
3. Consistent documentation through memory bank updates
4. Clear separation between planning and implementation phases

## Memory Bank

The `.memory-bank` directory contains crucial documentation and progress tracking for the project. This documentation system is designed to maintain perfect continuity between development sessions.

### Memory Bank Structure

The Memory Bank consists of these key files (all in Markdown format):

1. **productContext.md**: Defines why this project exists, problems it solves, and user experience goals
2. **activeContext.md**: Captures the current work focus, recent changes, and active decisions
3. **systemPatterns.md**: Documents system architecture, key technical decisions, and design patterns
4. **techContext.md**: Details technologies used, development setup, and technical constraints
5. **progress.md**: Tracks what works, what's left to build, known issues, and project evolution
6. **docs/**: Contains detailed architectural and implementation plans

Additional context files may be created when they help organize complex feature documentation, integration specifications, API documentation, etc.

### Memory Bank Rules

1. **Documentation Importance**
   - The Memory Bank is the single source of truth for project state
   - Every Claude instance MUST read ALL memory bank files at the start of each task
   - Documentation must be maintained with precision and clarity

2. **Update Triggers**
   - Updates occur when discovering new project patterns
   - After implementing significant changes
   - When requested with the command `update mb`
   - When context needs clarification

3. **Update Process**
   - Review ALL Memory Bank files, even if some don't require updates
   - Focus particularly on activeContext.md and progress.md
   - Document the current state, next steps, insights, and patterns
   - Return to PLAN mode after updates
