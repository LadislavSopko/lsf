#!/usr/bin/env python
"""
LSF vs JSON Token Efficiency Analysis

This script analyzes the token efficiency of LSF compared to JSON
with a focus on LLM input/output efficiency.
"""

import json
import datetime
from typing import Dict, Any, List

# Import LSF
from lsf import to_lsf, from_lsf, lsf_to_json_pretty, lsf_to_json

# Import shared scenarios
from benchmarks.scenarios import SCENARIOS, estimate_tokens

# Function to analyze a scenario
def analyze_scenario(scenario: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze token efficiency for a specific scenario."""
    name = scenario["name"]
    description = scenario["description"]
    data = scenario["data"]
    
    # Create different representations
    lsf_string = to_lsf(data)
    json_string = json.dumps(data)
    json_pretty_string = json.dumps(data, indent=2)
    
    # Calculate sizes and estimated tokens
    lsf_bytes = len(lsf_string.encode('utf-8'))
    json_bytes = len(json_string.encode('utf-8'))
    json_pretty_bytes = len(json_pretty_string.encode('utf-8'))
    
    lsf_tokens = estimate_tokens(lsf_string)
    json_tokens = estimate_tokens(json_string)
    json_pretty_tokens = estimate_tokens(json_pretty_string)
    
    # Calculate ratios
    bytes_ratio = round(lsf_bytes / json_bytes, 2)
    tokens_ratio = round(lsf_tokens / json_tokens, 2)
    pretty_bytes_ratio = round(lsf_bytes / json_pretty_bytes, 2)
    pretty_tokens_ratio = round(lsf_tokens / json_pretty_tokens, 2)
    
    # Results
    return {
        "name": name,
        "description": description,
        "lsf_bytes": lsf_bytes,
        "json_bytes": json_bytes,
        "json_pretty_bytes": json_pretty_bytes,
        "lsf_tokens": lsf_tokens,
        "json_tokens": json_tokens,
        "json_pretty_tokens": json_pretty_tokens,
        "bytes_ratio": bytes_ratio,
        "tokens_ratio": tokens_ratio,
        "pretty_bytes_ratio": pretty_bytes_ratio,
        "pretty_tokens_ratio": pretty_tokens_ratio,
        "lsf_sample": lsf_string[:100] + "..." if len(lsf_string) > 100 else lsf_string,
        "json_sample": json_string[:100] + "..." if len(json_string) > 100 else json_string
    }

# Run analysis for all scenarios
def run_analysis():
    """Run token efficiency analysis across all scenarios."""
    print('LSF vs JSON Token Efficiency Analysis\n')
    print('=======================================\n')
    
    # Summary results list
    summary_results = []
    
    # Analyze each scenario
    for scenario in SCENARIOS:
        results = analyze_scenario(scenario)
        summary_results.append(results)
        
        print(f"## {results['name']}")
        print(f"{results['description']}\n")
        
        print('Size Comparison:')
        print(f"  LSF:             {results['lsf_bytes']} bytes / ~{results['lsf_tokens']} tokens")
        print(f"  JSON (compact):  {results['json_bytes']} bytes / ~{results['json_tokens']} tokens")
        print(f"  JSON (pretty):   {results['json_pretty_bytes']} bytes / ~{results['json_pretty_tokens']} tokens")
        
        print('\nEfficiency Ratios (LSF/JSON):')
        print(f"  vs JSON compact: {results['bytes_ratio']}x bytes, {results['tokens_ratio']}x tokens")
        print(f"  vs JSON pretty:  {results['pretty_bytes_ratio']}x bytes, {results['pretty_tokens_ratio']}x tokens")
        
        print('\nSamples:')
        print(f"  LSF:    {results['lsf_sample']}")
        print(f"  JSON:   {results['json_sample']}")
        
        print('\n---------------------------------------\n')
    
    # Print summary table
    print('## Summary Table')
    print('| Scenario | LSF Size | JSON Size | Pretty JSON | LSF/JSON Ratio | vs Pretty |')
    print('|----------|----------|-----------|-------------|----------------|----------|')
    
    for result in summary_results:
        print(
            f"| {result['name']} | {result['lsf_bytes']} B / {result['lsf_tokens']} T | "
            f"{result['json_bytes']} B / {result['json_tokens']} T | "
            f"{result['json_pretty_bytes']} B / {result['json_pretty_tokens']} T | "
            f"{result['bytes_ratio']}x / {result['tokens_ratio']}x | "
            f"{result['pretty_bytes_ratio']}x / {result['pretty_tokens_ratio']}x |"
        )
    
    # Calculate averages
    avg_bytes_ratio = sum(r["bytes_ratio"] for r in summary_results) / len(summary_results)
    avg_tokens_ratio = sum(r["tokens_ratio"] for r in summary_results) / len(summary_results)
    avg_pretty_bytes_ratio = sum(r["pretty_bytes_ratio"] for r in summary_results) / len(summary_results)
    avg_pretty_tokens_ratio = sum(r["pretty_tokens_ratio"] for r in summary_results) / len(summary_results)
    
    print('|----------|----------|-----------|-------------|----------------|----------|')
    print(f"| **AVERAGE** | | | | **{avg_bytes_ratio:.2f}x / {avg_tokens_ratio:.2f}x** | "
          f"**{avg_pretty_bytes_ratio:.2f}x / {avg_pretty_tokens_ratio:.2f}x** |")
    
    print('\n## Conclusion')
    
    if avg_tokens_ratio < 1:
        print(f"LSF is on average {(1 - avg_tokens_ratio) * 100:.2f}% more token-efficient than JSON.")
        print(f"When compared to pretty-printed JSON, LSF is {(1 - avg_pretty_tokens_ratio) * 100:.2f}% more token-efficient.")
    else:
        print(f"LSF uses on average {(avg_tokens_ratio - 1) * 100:.2f}% more tokens than JSON.")
        print(f"When compared to pretty-printed JSON, LSF uses {(avg_pretty_tokens_ratio - 1) * 100:.2f}% less tokens.")
    
    print('\nNote: Token estimation is very approximate and actual token counts will vary depending on the specific tokenizer and model used.')

if __name__ == "__main__":
    print('Starting token efficiency analysis...')
    run_analysis() 