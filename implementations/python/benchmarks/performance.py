#!/usr/bin/env python
"""
LSF vs JSON Performance Benchmark

This script compares the performance of LSF and JSON for encoding/decoding operations
across different data sizes and complexity levels.
"""

import json
import time
import datetime
from collections import defaultdict
from typing import Dict, Any, List, Callable, Tuple

# Import LSF
from lsf import LSFEncoder, LSFDecoder, to_lsf, from_lsf

# Import shared scenarios
from benchmarks.scenarios import DATA_SETS, estimate_tokens

# Utility for timing operations
def measure_time(func: Callable, iterations: int = 1) -> Tuple[float, float]:
    """Measure execution time for a function over multiple iterations."""
    start_time = time.time()
    
    for _ in range(iterations):
        func()
        
    end_time = time.time()
    total_time_ms = (end_time - start_time) * 1000  # convert to ms
    avg_time_ms = total_time_ms / iterations
    
    return total_time_ms, avg_time_ms

# Size reporting in tokens and bytes
def format_size(obj: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate and format size metrics for JSON and LSF representations."""
    json_string = json.dumps(obj)
    lsf_string = to_lsf(obj)
    
    json_bytes = len(json_string.encode('utf-8'))
    lsf_bytes = len(lsf_string.encode('utf-8'))
    
    json_tokens = estimate_tokens(json_string)
    lsf_tokens = estimate_tokens(lsf_string)
    
    return {
        "json_bytes": json_bytes,
        "lsf_bytes": lsf_bytes,
        "json_tokens": json_tokens,
        "lsf_tokens": lsf_tokens,
        "bytes_ratio": round(lsf_bytes / json_bytes, 2),
        "tokens_ratio": round(lsf_tokens / json_tokens, 2)
    }

# Profile memory usage of decoder
def profile_decoder_memory(data_set: Dict[str, Any], iterations: int = 1000):
    """Profile memory usage of LSF decoder vs JSON parser."""
    import tracemalloc
    
    # Get encoded data
    json_string = json.dumps(data_set)
    lsf_string = to_lsf(data_set)
    
    # Profile JSON
    tracemalloc.start()
    for _ in range(iterations):
        data = json.loads(json_string) 
    json_current, json_peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    
    # Profile LSF
    tracemalloc.start()
    for _ in range(iterations):
        data = from_lsf(lsf_string)
    lsf_current, lsf_peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    
    return {
        "json_peak_bytes": json_peak,
        "lsf_peak_bytes": lsf_peak,
        "memory_ratio": round(lsf_peak / json_peak, 2)
    }

def profile_decoder_steps(lsf_string: str):
    """Profile individual steps in the LSF decoder to identify bottlenecks."""
    decoder = LSFDecoder()
    
    # Setup profiling
    import cProfile
    import pstats
    import io
    from pstats import SortKey
    
    # Profile the decoder execution
    pr = cProfile.Profile()
    pr.enable()
    result = decoder.decode(lsf_string)
    pr.disable()
    
    # Get stats as string
    s = io.StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats(SortKey.CUMULATIVE)
    ps.print_stats(15)  # Print top 15 time-consuming functions
    
    return s.getvalue()

# Run benchmarks for each data set
def run_benchmarks():
    """Run benchmarks comparing LSF and JSON performance."""
    iterations = {
        "small": 10000,
        "medium": 5000,
        "large": 500
    }
    
    print("LSF vs JSON Performance Benchmark\n")
    print("==================================\n")
    
    # For each data set
    for data_set_name, data_set in DATA_SETS.items():
        iters = iterations.get(data_set_name, 1000)
        print(f"\n## {data_set_name.upper()} DATA SET ({iters} iterations)")
        
        # Get size metrics
        size_metrics = format_size(data_set)
        print("\nSize Comparison:")
        print(f"  JSON: {size_metrics['json_bytes']} bytes / ~{size_metrics['json_tokens']} tokens")
        print(f"  LSF:  {size_metrics['lsf_bytes']} bytes / ~{size_metrics['lsf_tokens']} tokens")
        print(f"  Ratio (LSF/JSON): {size_metrics['bytes_ratio']}x bytes, {size_metrics['tokens_ratio']}x tokens")
        
        # Prepare data
        json_string = None
        lsf_string = None
        json_parsed = None
        lsf_parsed = None
        
        # Benchmark JSON stringify
        json_stringify_total, json_stringify_avg = measure_time(
            lambda: json.dumps(data_set), 
            iters
        )
        
        # Benchmark LSF encode
        lsf_encode_total, lsf_encode_avg = measure_time(
            lambda: to_lsf(data_set),
            iters
        )
        
        # Create strings for parsing benchmarks
        json_string = json.dumps(data_set)
        lsf_string = to_lsf(data_set)
        
        # Benchmark JSON parse
        json_parse_total, json_parse_avg = measure_time(
            lambda: json.loads(json_string),
            iters
        )
        
        # Benchmark LSF decode
        lsf_decode_total, lsf_decode_avg = measure_time(
            lambda: from_lsf(lsf_string),
            iters
        )
        
        # Output results table
        print("\nPerformance Comparison:")
        print("| Operation     | JSON (avg ms) | LSF (avg ms) | LSF/JSON Ratio |")
        print("|---------------|--------------|--------------|----------------|")
        print(f"| Encode        | {json_stringify_avg:.4f} | {lsf_encode_avg:.4f} | {lsf_encode_avg / json_stringify_avg:.2f} |")
        print(f"| Decode        | {json_parse_avg:.4f} | {lsf_decode_avg:.4f} | {lsf_decode_avg / json_parse_avg:.2f} |")
        print(f"| Total         | {json_stringify_avg + json_parse_avg:.4f} | {lsf_encode_avg + lsf_decode_avg:.4f} | {(lsf_encode_avg + lsf_decode_avg) / (json_stringify_avg + json_parse_avg):.2f} |")
        
        # Verify data consistency
        json_parsed = json.loads(json_string)
        lsf_parsed = from_lsf(lsf_string)
        is_consistent = json.dumps(json_parsed, sort_keys=True) == json.dumps(lsf_parsed, sort_keys=True)
        print(f"\nData consistency check: {'PASSED' if is_consistent else 'FAILED'}")
        
        # For medium and large datasets, profile decoder memory and steps
        if data_set_name in ["medium", "large"]:
            print("\nDecoder Profiling:")
            
            # Profile decoder memory usage
            memory_profile = profile_decoder_memory(data_set, min(100, iters))
            print(f"Memory Usage (Peak):")
            print(f"  JSON: {memory_profile['json_peak_bytes'] / 1024:.2f} KB")
            print(f"  LSF:  {memory_profile['lsf_peak_bytes'] / 1024:.2f} KB")
            print(f"  Ratio (LSF/JSON): {memory_profile['memory_ratio']}x")
            
            # Profile decoder steps - only for detailed analysis
            if data_set_name == "large":
                print("\nDecoder Step Profiling (Top 15 functions):")
                profile_results = profile_decoder_steps(lsf_string)
                for line in profile_results.splitlines()[:20]:  # Print top 20 lines
                    print(f"  {line}")
    
    print("\n==================================")

if __name__ == "__main__":
    print("Starting benchmarks...")
    run_benchmarks() 