# LSF TypeScript Implementation Benchmark Results

## Overview

This document summarizes the performance benchmark results for the LSF v1.3 TypeScript implementation. Tests compare LSF encoding/decoding performance against native JSON operations and also measure the performance improvements from the UltraFastLSFParser implementation.

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
   - UltraFastLSFParser is:
     - ~50% faster than the standard decoder on small data
     - ~66% faster than the standard decoder on medium data
     - ~68% faster than the standard decoder on large data
   - UltraFastLSFParser outperforms JSON.parse on large datasets

4. **Parser Factory Performance:**
   - The AUTO selection strategy performs as well as directly using the fast parser
   - Fast parser is ~75% faster than the standard parser

## Detailed Results

### Data Sizes
- Small data: 103 chars (JSON), 113 chars (LSF)
- Medium data: 9,965 chars (JSON), 3,004 chars (LSF)
- Large data: 379,937 chars (JSON), 39,307 chars (LSF)

### Encoding Benchmarks

| Test | Total (ms) | Avg (ms/op) |
|------|------------|-------------|
| Encode small data (LSFSimple) | 16.00 | 0.0016 |
| Encode small data (JSON.stringify) | 3.89 | 0.0004 |
| Encode medium data (LSFSimple) | 10.12 | 0.0202 |
| Encode medium data (JSON.stringify) | 19.33 | 0.0387 |
| Encode large data (LSFSimple) | 9.03 | 0.4515 |
| Encode large data (JSON.stringify) | 28.90 | 1.4451 |

### Decoding Benchmarks

| Test | Total (ms) | Avg (ms/op) |
|------|------------|-------------|
| Decode small data (LSFDecoder) | 32.30 | 0.0065 |
| Decode small data (UltraFastLSFParser) | 16.02 | 0.0032 |
| Decode small data (JSON.parse) | 3.33 | 0.0007 |
| Decode medium data (LSFDecoder) | 31.22 | 0.1561 |
| Decode medium data (UltraFastLSFParser) | 10.41 | 0.0520 |
| Decode medium data (JSON.parse) | 12.48 | 0.0624 |
| Decode large data (LSFDecoder) | 25.14 | 2.5141 |
| Decode large data (UltraFastLSFParser) | 8.04 | 0.8035 |
| Decode large data (JSON.parse) | 13.60 | 1.3603 |

### Parser Factory Benchmarks

| Test | Total (ms) | Avg (ms/op) |
|------|------------|-------------|
| Parser factory (STANDARD) with medium data | 27.52 | 0.1376 |
| Parser factory (FAST) with medium data | 6.75 | 0.0337 |
| Parser factory (AUTO) with medium data | 6.52 | 0.0326 |

### Round-Trip Benchmarks

| Test | Total (ms) | Avg (ms/op) |
|------|------------|-------------|
| LSF round-trip (medium data) | 15.30 | 0.1530 |
| JSON round-trip (medium data) | 8.80 | 0.0880 |

## Analysis and Recommendations

### Format Efficiency

The LSF format shows significant size advantages over JSON for medium to large datasets. The size reduction is due to:

1. More efficient representation of nested objects
2. More compact type markers
3. Elimination of redundant syntax elements

For small objects, LSF is slightly larger than JSON due to the overhead of format markers, but this difference becomes negligible as data size increases.

### Performance Characteristics

1. **Encoding:** LSF encoding is more efficient than JSON for larger datasets, offering up to 3x better performance for large data structures.

2. **Decoding:** The UltraFastLSFParser implementation provides substantial performance improvements over the standard decoder:
   - 2-3x faster depending on data size
   - Outperforms JSON.parse for large datasets
   - More efficient memory usage

3. **Parser Selection:** The automatic parser selection strategy works effectively, choosing the best parser based on data characteristics.

### Implementation Recommendations

1. **Use the UltraFastLSFParser for best performance**
   - The standard decoder should only be used when compatibility with older versions is required

2. **Use the AUTO selection strategy with getParser**
   - This provides the best balance of performance across different data sizes

3. **LSF is most beneficial for medium to large data structures**
   - Particularly efficient for data with many nested objects and repeated structure

## Test Environment

Tests were performed on:
- Windows 10
- Node.js 16+
- TypeScript LSF v1.3.0 implementation 