# LSF Prompt Generator

This directory contains the code generator for LLM prompts used across all LSF implementations.

## Purpose

To maintain a single source of truth for LLM prompts while generating native code files for each implementation (C#, TypeScript, Python).

## Usage

```bash
cd implementations/prompt-gen
npm run generate
```

This will generate:
- `../csharp/Zerox.LSF/Zerox.LSF/LLMPrompts.cs`
- `../javascript/src/llm-prompts.ts`
- `../python/lsf/llm_prompts.py`

## Modifying Prompts

1. Edit `prompts.json` with your changes
2. Run `npm run generate`
3. Rebuild and test all implementations
4. Commit all changes (including generated files)

## Structure

- `prompts.json` - The single source of truth for all prompts
- `generate.js` - The code generator script
- Generated files are tracked in git for ease of use

## Why This Approach?

- Single source of truth for prompts
- No runtime file loading issues
- Works on all platforms (Windows, Linux, macOS)
- Simple for users - no build complexity
- Easy to verify all implementations use same prompts