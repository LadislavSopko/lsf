# LSF Python Benchmarks

This directory contains benchmarking tools for the Python implementation of LSF (LLM-Safe Format).

## Overview

These benchmarks measure various aspects of LSF performance and efficiency compared to standard JSON:

1. **Performance** - Encoding/decoding speed comparison with JSON
2. **Token Efficiency** - Analysis of token usage when using LSF in LLM contexts
3. **Decoder Optimization** - Analysis and improvements for the LSF decoder
4. **Optimized Decoder** - Implementations of optimized decoders for better performance

## Running Benchmarks

From the `implementations/python` directory, run the following commands:

```bash
# Basic performance benchmarks
python -m benchmarks.performance

# Token efficiency analysis
python -m benchmarks.token_efficiency

# Decoder optimization analysis
python -m benchmarks.decoder_optimization
```

## Files

- `performance.py` - Measures encoding/decoding performance against JSON
- `token_efficiency.py` - Measures token efficiency of LSF vs JSON for LLM contexts
- `decoder_optimization.py` - Analyzes performance bottlenecks in the decoder
- `optimized_decoder.py` - Provides optimized LSF decoder implementations
- `scenarios.py` - Shared benchmark data scenarios and utilities

## Benchmark Results

### Performance

LSF performance compared to JSON varies by operation:
- **Encoding**: LSF is generally comparable to JSON.stringify()
- **Decoding**: The default LSF decoder is currently 3-9x slower than JSON.parse()
- **Memory Usage**: LSF uses slightly more memory during parsing operations

### Token Efficiency

LSF offers significant token efficiency over JSON:
- 48-52% fewer tokens on average compared to compact JSON
- Up to 83% fewer tokens for deeply nested/complex data
- Most efficient for repetitive structures with potential for referencing

### Optimized Decoders

Three alternative decoder implementations are provided:

1. **FastLSFDecoder** - Optimizes using pre-compiled regex patterns and lookup tables
2. **NonRegexDecoder** - Avoids regular expressions entirely for faster parsing
3. **StreamingDecoder** - Uses a single-pass approach with minimal memory overhead

## Integration

To use the optimized decoders in your code:

```python
from benchmarks.optimized_decoder import get_optimized_decoder

# Get the preferred optimization type
decoder = get_optimized_decoder('fast')  # Options: 'fast', 'nonregex', 'streaming'

# Use just like the standard decoder
lsf_string = "..."
data = decoder.decode(lsf_string)
```

## Notes

The benchmark results should be considered relative rather than absolute, as performance can vary significantly based on hardware, Python version, and data characteristics. 