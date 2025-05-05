# LSF: LLM-Safe Format

## Project Overview
LSF (LLM-Safe Format) is a structured data format designed specifically for Large Language Models (LLMs). It provides a reliable way to structure data for consumption by LLMs, addressing common issues with traditional formats like JSON when used in LLM contexts.

## Core Requirements

1. **Parser Efficiency**: Implement a high-performance parser that can process LSF data with minimal memory and CPU usage
2. **Format Robustness**: Ensure the format can handle nested structures, typed values, and complex data relationships
3. **Ease of Use**: Provide a simple API for encoding/decoding LSF data
4. **UTF-8 Safety**: Avoid delimiter characters that cause encoding issues in different environments
5. **LLM Compatibility**: Design with LLM prompt context in mind to minimize token usage and improve parsing reliability

## Technical Goals

1. Implement LSF 2.0 specification with forward-only parsing
2. Provide TypeScript/JavaScript implementation first, with potential for other languages later
3. Deliver zero-copy parsing where possible to maximize performance
4. Support bi-directional conversion between LSF and JSON
5. Maintain extensive test coverage to ensure format compliance
6. Document the format specification for implementers in other languages

## Project Definition
LSF (LLM-Safe Format) is a structured, flat serialization format designed specifically for maximum reliability and minimal error when used with large language models (LLMs). The format avoids common pitfalls found in formats like JSON or XML (such as mismatched brackets, quotes, or indentation) and uses fixed-length, extremely rare separators to maintain structure and parseability.

## Target Audience
- Developers building agent systems and LLM-based applications
- ML engineers working with structured data generation
- Anyone needing reliable structured output from LLMs

## Success Metrics
- **Reliability**: >95% success rate in correct format generation by LLMs (vs ~82% for JSON)
- **Efficiency**: 20%+ reduction in token usage compared to equivalent JSON
- **Performance**: 50%+ faster parsing than equivalent JSON
- **Adoption**: Implementation in 3+ programming languages

## Out of Scope
- **Human Readability**: LSF intentionally prioritizes machine parsing over human readability
- **Schema Validation**: LSF focuses on format consistency, not schema enforcement
- **Complex Nesting**: LSF avoids deeply nested structures by design
- **Binary Efficiency**: LSF prioritizes text-based representation over binary size optimization

## Milestones
1. **v1.0**: Core specification with basic tokens and parsing
2. **v1.1**: Multi-language implementations (Python, JavaScript)
3. **v1.2**: Type system, error recovery, transaction support (Current)
4. **v1.3**: Performance optimizations and wider language support

## Stakeholders
- Developers integrating with LLMs
- Agent framework maintainers
- LLM application builders

The LSF project aims to solve a critical problem in LLM integration: reliable structured data generation. This format bridges the gap between human-readable formats (which LLMs struggle with) and machine-optimized formats (which maintain consistency even with small errors). 