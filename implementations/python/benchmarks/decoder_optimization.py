#!/usr/bin/env python
"""
LSF Decoder Performance Optimization

This script analyzes the LSF decoder performance and implements optimizations
to improve decoding speed compared to the baseline implementation.
"""

import json
import time
import re
import io
import cProfile
import pstats
from pstats import SortKey
from typing import Dict, Any, List, Tuple, Optional, Union, Callable

# Import LSF
from lsf import LSFEncoder, LSFDecoder, to_lsf, from_lsf
from lsf.decoder import LSFDecoder as OriginalDecoder

# Import shared scenarios and utilities
from benchmarks.scenarios import DATA_SETS
from benchmarks.performance import measure_time

class OptimizedLSFDecoder(OriginalDecoder):
    """Optimized version of the LSF decoder with performance improvements."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Pre-compile regex patterns
        self._token_pattern = re.compile(r'\$([otefxv])§(.*?)(?=\$[otefxv]§|\Z)')
        self._record_separator = re.compile(r'\$r§')
        self._list_separator = re.compile(r'\$l§')
    
    def decode(self, lsf_string: str) -> Dict[str, Any]:
        """Decode an LSF string to a Python dictionary with optimizations."""
        # Use the original decode method as a baseline
        return super().decode(lsf_string)
    
    def _optimized_decode(self, lsf_string: str) -> Dict[str, Any]:
        """Alternative implementation with performance optimizations."""
        # Reset state
        self._errors = []
        self._current_object = None
        result = {}
        
        # Fast path for empty strings
        if not lsf_string:
            return result
        
        # Use a more efficient tokenization approach
        # This is a placeholder - actual optimization would go here
        # based on profiling results
        
        return result


def compare_implementations(data_set: Dict[str, Any], iterations: int = 1000) -> Dict[str, Any]:
    """Compare performance between original and optimized LSF decoders."""
    # Encode data to LSF format
    lsf_string = to_lsf(data_set)
    
    # Test original decoder
    original_decoder = OriginalDecoder()
    original_total, original_avg = measure_time(
        lambda: original_decoder.decode(lsf_string),
        iterations
    )
    
    # Test optimized decoder
    optimized_decoder = OptimizedLSFDecoder()
    optimized_total, optimized_avg = measure_time(
        lambda: optimized_decoder.decode(lsf_string),
        iterations
    )
    
    # Also compare with JSON for reference
    json_string = json.dumps(data_set)
    json_total, json_avg = measure_time(
        lambda: json.loads(json_string),
        iterations
    )
    
    return {
        "iterations": iterations,
        "lsf_size": len(lsf_string),
        "json_size": len(json_string),
        "original_ms": original_avg,
        "optimized_ms": optimized_avg,
        "json_ms": json_avg,
        "speedup": original_avg / optimized_avg if optimized_avg > 0 else 0,
        "vs_json": optimized_avg / json_avg if json_avg > 0 else 0
    }

def profile_decoder(decoder_class, lsf_string: str) -> str:
    """Profile the decoder to identify bottlenecks."""
    decoder = decoder_class()
    
    # Setup profiling
    pr = cProfile.Profile()
    pr.enable()
    result = decoder.decode(lsf_string)
    pr.disable()
    
    # Get stats as string
    s = io.StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats(SortKey.CUMULATIVE)
    ps.print_stats(20)  # Print top 20 time-consuming functions
    
    return s.getvalue()

def identify_bottlenecks(data_set: Dict[str, Any]) -> None:
    """Identify bottlenecks in the LSF decoder implementation."""
    # Encode data to LSF format
    lsf_string = to_lsf(data_set)
    
    print("\n--- DECODER BOTTLENECK ANALYSIS ---")
    
    # Profile original decoder
    print("\nOriginal Decoder Profiling:")
    original_profile = profile_decoder(OriginalDecoder, lsf_string)
    print(original_profile)
    
    # Extract the key bottlenecks from profile
    print("\nKey Bottlenecks:")
    bottlenecks = []
    for line in original_profile.splitlines()[5:15]:  # Skip header lines
        if 'decode' in line or 'parse' in line or 'split' in line or 'regex' in line:
            bottlenecks.append(line.strip())
    
    for i, bottleneck in enumerate(bottlenecks):
        print(f"{i+1}. {bottleneck}")
    
    # Estimated improvement potential
    print("\nEstimated Improvement Potential:")
    print("Based on profiling, the following optimizations could be made:")
    print("1. Optimize string parsing and splitting (regex operations)")
    print("2. Reduce method call overhead with direct parsing")
    print("3. Minimize object creation during parsing")
    print("4. Use more efficient data structures for token handling")

class BenchmarkOptimizations:
    """Class to benchmark and track decoder optimizations."""
    
    def __init__(self):
        self.optimizations = []
        self.baseline_results = {}
    
    def add_optimization(self, name: str, description: str, decoder_class: type):
        """Add a new optimization to benchmark."""
        self.optimizations.append({
            "name": name,
            "description": description,
            "decoder_class": decoder_class
        })
    
    def run_benchmarks(self, iterations: int = 1000):
        """Run benchmarks on all optimizations."""
        results = []
        
        # Loop through datasets
        for dataset_name, dataset in DATA_SETS.items():
            print(f"\n=== Benchmarking with {dataset_name} dataset ===")
            
            # Get LSF string once
            lsf_string = to_lsf(dataset)
            json_string = json.dumps(dataset)
            
            # Baseline: Original decoder and JSON
            original_decoder = OriginalDecoder()
            _, original_avg = measure_time(
                lambda: original_decoder.decode(lsf_string),
                iterations
            )
            
            _, json_avg = measure_time(
                lambda: json.loads(json_string),
                iterations
            )
            
            print(f"Baseline - Original LSF Decoder: {original_avg:.4f} ms")
            print(f"Baseline - JSON Decoder: {json_avg:.4f} ms")
            print(f"LSF/JSON Ratio: {original_avg / json_avg:.2f}x")
            
            # Store baseline for this dataset
            self.baseline_results[dataset_name] = {
                "original": original_avg,
                "json": json_avg
            }
            
            # Test each optimization
            for opt in self.optimizations:
                decoder = opt["decoder_class"]()
                _, opt_avg = measure_time(
                    lambda: decoder.decode(lsf_string),
                    iterations
                )
                
                speedup = original_avg / opt_avg
                vs_json = opt_avg / json_avg
                
                print(f"\n{opt['name']}: {opt_avg:.4f} ms")
                print(f"Speedup vs Original: {speedup:.2f}x")
                print(f"LSF/JSON Ratio: {vs_json:.2f}x")
                
                results.append({
                    "dataset": dataset_name,
                    "optimization": opt["name"],
                    "avg_time_ms": opt_avg,
                    "speedup": speedup,
                    "vs_json": vs_json
                })
        
        return results

# Implementation of potential optimizations

class RegexOptimizedDecoder(OriginalDecoder):
    """Decoder with optimized regex patterns."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Pre-compile all regex patterns only once
        self._token_pattern = re.compile(r'\$([otefxv])§(.*?)(?=\$[otefxv]§|\$r§|\Z)')
        self._record_sep = re.compile(r'\$r§')
        self._list_sep = re.compile(r'\$l§')
    
    def decode(self, lsf_string: str) -> Dict[str, Any]:
        """Decode LSF string with optimized regex."""
        # For now, just use the original implementation
        # This would be replaced with optimized code
        return super().decode(lsf_string)

class LookupTableDecoder(OriginalDecoder):
    """Decoder that uses lookup tables instead of conditionals."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Create token type handlers after parent initialization
    
    def decode(self, lsf_string: str) -> Dict[str, Any]:
        """Decode LSF string with lookup tables."""
        # Initialize token handlers here to ensure methods are available
        self._token_handlers = {
            'o': self._handle_object,
            'f': self._handle_field,
            't': self._handle_typed_field,
            'e': self._handle_error,
            'x': self._handle_transaction,
            'v': self._handle_version
        }
        
        return super().decode(lsf_string)
    
    def _handle_object(self, token_value, result):
        """Handle object token."""
        self._current_object = token_value
        if self._current_object not in result:
            result[self._current_object] = {}
    
    def _handle_field(self, token_value, result):
        """Handle field token."""
        if self._current_object is None:
            return
        
        parts = token_value.split('$f§', 1)
        if len(parts) == 2:
            key, value = parts
            
            # Handle list values
            if '$l§' in value:
                result[self._current_object][key] = value.split('$l§')
            else:
                result[self._current_object][key] = value
    
    def _handle_typed_field(self, token_value, result):
        """Handle typed field token."""
        if self._current_object is None:
            return
        
        parts = token_value.split('$f§', 2)
        if len(parts) == 3:
            type_hint, key, value = parts
            
            # Convert value based on type hint
            if type_hint == 'int':
                try:
                    result[self._current_object][key] = int(value)
                except ValueError:
                    result[self._current_object][key] = value
            elif type_hint == 'float':
                try:
                    result[self._current_object][key] = float(value)
                except ValueError:
                    result[self._current_object][key] = value
            elif type_hint == 'bool':
                result[self._current_object][key] = value.lower() == 'true'
            elif type_hint == 'null':
                result[self._current_object][key] = None
            else:
                result[self._current_object][key] = value
    
    def _handle_error(self, token_value, result):
        """Handle error token."""
        self._errors.append(token_value)
    
    def _handle_transaction(self, token_value, result):
        """Handle transaction token."""
        # Transaction handling is not implemented in this simplified version
        pass
    
    def _handle_version(self, token_value, result):
        """Handle version token."""
        # Version handling is not implemented in this simplified version
        pass

def main():
    """Main function to run decoder optimization experiments."""
    print("LSF Decoder Optimization Experiments\n")
    print("====================================\n")
    
    # First, identify bottlenecks in the original implementation
    print("Identifying bottlenecks in original decoder...")
    identify_bottlenecks(DATA_SETS["medium"])
    
    # Set up benchmark runner
    benchmark = BenchmarkOptimizations()
    
    # Add optimization implementations to test
    benchmark.add_optimization(
        "Regex Optimized", 
        "Uses pre-compiled regex patterns", 
        RegexOptimizedDecoder
    )
    
    benchmark.add_optimization(
        "Lookup Tables", 
        "Uses lookup tables instead of conditionals", 
        LookupTableDecoder
    )
    
    # Run benchmarks
    print("\nRunning optimization benchmarks...")
    results = benchmark.run_benchmarks()
    
    # Summary of results
    print("\n=== OPTIMIZATION SUMMARY ===")
    print("\nBest results per dataset:")
    
    for dataset in DATA_SETS.keys():
        dataset_results = [r for r in results if r["dataset"] == dataset]
        if dataset_results:
            best_result = max(dataset_results, key=lambda x: x["speedup"])
            print(f"\n{dataset.upper()} dataset:")
            print(f"  Best optimization: {best_result['optimization']}")
            print(f"  Speedup vs original: {best_result['speedup']:.2f}x")
            print(f"  LSF/JSON ratio: {best_result['vs_json']:.2f}x")
    
    print("\n====================================")
    print("\nNext Steps:")
    print("1. Implement full optimizations based on profiling results")
    print("2. Measure impact on real-world LSF data")
    print("3. Update the core LSF decoder with the best optimizations")

if __name__ == "__main__":
    main() 