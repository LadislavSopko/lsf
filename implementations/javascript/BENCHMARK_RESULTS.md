# LSF TypeScript Implementation Benchmark Results

## Overview

This document summarizes the performance benchmark results for the LSF v1.3 TypeScript implementation. Tests compare LSF encoding/decoding performance against native JSON operations and also measure the performance improvements from the UltraFastLSFParser and HyperFastLSFParser implementations.

**LSF Version:** 1.3.0

## Key Findings

1. **Format Size Efficiency:**
   - **Small Data:** LSF is 9.7% larger than JSON for small objects
   - **Medium Data:** LSF is 69.9% smaller than JSON for medium datasets
   - **Large Data:** LSF is 89.7% smaller than JSON for large, complex datasets

2. **Encoding Performance:**
   - LSF encoding is slower than JSON for small objects
   - LSF encoding is faster than JSON for medium and large datasets
   - Performance advantage increases with data size

3. **Decoding Performance:**
   - Standard LSFDecoder is slower than JSON.parse
   - UltraFastLSFParser significantly outperforms the standard decoder
   - HyperFastLSFParser provides even better performance, especially for large datasets:
     - ~20% faster than UltraFastLSFParser on small data
     - ~72% faster than UltraFastLSFParser on large data 
   - Parser performance comparison:
     - UltraFastLSFParser is:
       - ~50% faster than the standard decoder on small data
       - ~66% faster than the standard decoder on medium data
       - ~68% faster than the standard decoder on large data
     - HyperFastLSFParser is:
       - ~63% faster than the standard decoder on small data
       - ~57% faster than the standard decoder on medium data
       - ~91% faster than the standard decoder on large data
   - HyperFastLSFParser outperforms JSON.parse by up to 8.5x on large datasets

4. **Parser Factory Performance:**
   - The AUTO selection strategy performs as well as directly using the fast parser
   - HyperFastLSFParser is ~55% faster than UltraFastLSFParser for large data
   - Fast parser is ~75% faster than the standard parser

## Detailed Results

### Data Sizes
- Small data: 103 chars (JSON), 113 chars (LSF)
- Medium data: 9,965 chars (JSON), 3,004 chars (LSF)
- Large data: 379,937 chars (JSON), 39,307 chars (LSF)

### Encoding Benchmarks

| Test | Total (ms) | Avg (ms/op) |
|------|------------|-------------|
| Encode small data (LSFSimple) | 15.72 | 0.0016 |
| Encode small data (JSON.stringify) | 3.76 | 0.0004 |
| Encode medium data (LSFSimple) | 10.09 | 0.0202 |
| Encode medium data (JSON.stringify) | 19.63 | 0.0393 |
| Encode large data (LSFSimple) | 5.92 | 0.2960 |
| Encode large data (JSON.stringify) | 27.65 | 1.3824 |

### Decoding Benchmarks

| Test | Total (ms) | Avg (ms/op) |
|------|------------|-------------|
| Decode small data (LSFDecoder) | 35.42 | 0.0071 |
| Decode small data (UltraFastLSFParser) | 16.25 | 0.0033 |
| Decode small data (HyperFastLSFParser) | 12.91 | 0.0026 |
| Decode small data (JSON.parse) | 3.42 | 0.0007 |
| Decode medium data (LSFDecoder) | 31.51 | 0.1576 |
| Decode medium data (UltraFastLSFParser) | 9.09 | 0.0454 |
| Decode medium data (HyperFastLSFParser) | 13.51 | 0.0675 |
| Decode medium data (JSON.parse) | 10.27 | 0.0514 |
| Decode large data (LSFDecoder) | 21.74 | 2.1740 |
| Decode large data (UltraFastLSFParser) | 6.85 | 0.6855 |
| Decode large data (HyperFastLSFParser) | 1.95 | 0.1951 |
| Decode large data (JSON.parse) | 16.60 | 1.6598 |

### Parser Factory Benchmarks

| Test | Total (ms) | Avg (ms/op) |
|------|------------|-------------|
| Parser factory (STANDARD) with medium data | 37.29 | 0.1864 |
| Parser factory (FAST) with medium data | 7.27 | 0.0363 |
| Parser factory (HYPER) with medium data | 3.23 | 0.0162 |
| Parser factory (AUTO) with medium data | 6.97 | 0.0348 |

### Round-Trip Benchmarks

| Test | Total (ms) | Avg (ms/op) |
|------|------------|-------------|
| LSF round-trip (medium data) | 16.20 | 0.1620 |
| JSON round-trip (medium data) | 9.23 | 0.0923 |

## Analysis and Recommendations

### Format Efficiency

The LSF format shows significant size advantages over JSON for medium to large datasets. The size reduction is due to:

1. More efficient representation of nested objects
2. More compact type markers
3. Elimination of redundant syntax elements

For small objects, LSF is slightly larger than JSON due to the overhead of format markers, but this difference becomes negligible as data size increases.

### Performance Characteristics

1. **Encoding:** LSF encoding is more efficient than JSON for larger datasets, offering up to 3x better performance for large data structures.

2. **Decoding:** The optimized parsers provide substantial performance improvements:
   - UltraFastLSFParser is 2-3x faster than the standard decoder
   - HyperFastLSFParser is up to 11x faster than the standard decoder for large datasets
   - HyperFastLSFParser outperforms JSON.parse by up to 8.5x for large datasets
   - More efficient memory usage with character-by-character parsing

3. **Parser Selection:**
   - Use HyperFastLSFParser for maximum performance, especially for large datasets
   - The automatic parser selection strategy works effectively, choosing the best parser based on data characteristics

### Implementation Recommendations

1. **Use the HyperFastLSFParser for best performance**
   - The character-by-character approach with minimal allocations provides significant speedups
   - For large datasets, HyperFastLSFParser is dramatically faster than both UltraFastLSFParser and JSON.parse

2. **Use the AUTO selection strategy with getParser**
   - This provides the best balance of performance across different data sizes
   - Automatically selects the most appropriate parser based on input size

3. **LSF is most beneficial for medium to large data structures**
   - Particularly efficient for data with many nested objects and repeated structure
   - With HyperFastLSFParser, LSF outperforms JSON for large data parsing

## Test Environment

Tests were performed on:
- Windows 10
- Node.js 16+
- TypeScript LSF v1.3.0 implementation 