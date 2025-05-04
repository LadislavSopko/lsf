# LSF v1.3 TypeScript Benchmark Summary

## Key Metrics

| Metric | Result |
|--------|--------|
| Size Efficiency (large data) | 89.7% smaller than JSON |
| Encoding Speed (large data) | 3.2x faster than JSON |
| UltraFastLSFParser vs Standard | 2-3x faster decoding |
| UltraFastLSFParser vs JSON.parse | 41% faster for large data |

## Size Comparison

| Data Type | JSON Size | LSF Size | Difference |
|-----------|-----------|----------|------------|
| Small Data | 103 bytes | 113 bytes | +9.7% (larger) |
| Medium Data | 9,965 bytes | 3,004 bytes | -69.9% (smaller) |
| Large Data | 379,937 bytes | 39,307 bytes | -89.7% (smaller) |

## Performance Summary

### Encoding (avg ms/op)
| Data Size | LSF | JSON | Comparison |
|-----------|-----|------|------------|
| Small | 0.0016 | 0.0004 | 4x slower |
| Medium | 0.0202 | 0.0387 | 1.9x faster |
| Large | 0.4515 | 1.4451 | 3.2x faster |

### Decoding (avg ms/op)
| Data Size | Standard LSF | UltraFast LSF | JSON.parse | UltraFast vs Standard | UltraFast vs JSON |
|-----------|--------------|---------------|------------|------------------------|------------------|
| Small | 0.0065 | 0.0032 | 0.0007 | 2x faster | 4.6x slower |
| Medium | 0.1561 | 0.0520 | 0.0624 | 3x faster | 1.2x faster |
| Large | 2.5141 | 0.8035 | 1.3603 | 3.1x faster | 1.7x faster |

## Parser Comparison (medium data)

| Parser | Avg Time (ms/op) | Relative Performance |
|--------|------------------|----------------------|
| Standard | 0.1376 | Baseline |
| Fast | 0.0337 | 4.1x faster |
| Auto | 0.0326 | 4.2x faster |

## Round-Trip Performance (medium data)

| Format | Avg Time (ms/op) |
|--------|------------------|
| LSF | 0.1530 |
| JSON | 0.0880 |

## Recommendations

1. **For Large Data:** Use LSF with UltraFastLSFParser for significant performance and size benefits
2. **For Medium Data:** LSF with UltraFastLSFParser offers comparable or better performance than JSON
3. **For Small Data:** JSON offers better performance, but the difference is negligible for most applications
4. **Parser Selection:** Use the AUTO selection (default) for optimal performance

## Testing Environment
- Windows 10
- Node.js 16+
- TypeScript LSF v1.3.0 implementation 