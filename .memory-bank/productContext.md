# LSF Product Context

## Problem Context
When communicating structured data to and from LLMs, traditional formats like JSON often cause issues:

1. **Hallucination Problems**: LLMs frequently hallucinate quote marks, brackets, commas, and other syntax elements that break JSON parsing
2. **Consistency Challenges**: LLMs struggle with maintaining proper nesting and matching brackets in complex structures
3. **UTF-8 Encoding Issues**: Some delimiter characters can cause encoding problems across different environments
4. **Parsing Complexity**: Error recovery in nested formats is difficult when an LLM makes a small mistake

## Solution
LSF solves these problems through:

1. **Explicit Tokens**: Using unmistakable token markers (`$o~`, `$a~`, `$f~`, etc.) that are rare in natural text
2. **Forward-only Parsing**: Simplified parsing model that doesn't require matching closing delimiters
3. **Flat Structure**: Even nested data is represented in a way that's easier for LLMs to maintain
4. **Type Hints**: Built-in support for common data types (numbers, booleans, dates)
5. **UTF-8 Safety**: Using `~` delimiter which is safe across all environments

## User Experience Goals

1. **Developer Simplicity**: Make it simple for developers to integrate LSF into their LLM applications
2. **Performance**: Deliver parsing speed comparable to or better than JSON
3. **Reliability**: Dramatically reduce structured data errors in LLM interactions
4. **Consistency**: Ensure LSF works the same way across all implementation languages
5. **Documentation**: Provide clear examples and implementation guides

## Usage Scenarios

1. **API Responses**: LLMs generating structured API responses
2. **Data Extraction**: Extracting structured data from unstructured text
3. **Configuration**: LLMs generating configuration files
4. **Multi-turn Dialogues**: Maintaining structured context across conversation turns
5. **Tool Use**: Enabling reliable tool calling in LLM applications 