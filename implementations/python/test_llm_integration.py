#!/usr/bin/env python3
"""Test LSF generation with real LLM integration."""

import os
import sys
import json
import re
import anthropic
from dotenv import load_dotenv
from test_cases import test_cases
import lsf

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variable
api_key = os.environ.get("ANTHROPIC_API_KEY")
if not api_key:
    print("Please set ANTHROPIC_API_KEY in .env file or environment variable")
    sys.exit(1)

# Parse command line arguments
format_type = sys.argv[1] if len(sys.argv) > 1 else "lsf"
test_case_index = int(sys.argv[2]) if len(sys.argv) > 2 else 0

# Get test case
if test_case_index >= len(test_cases):
    print(f"Test case {test_case_index} not found")
    sys.exit(1)

test_case = test_cases[test_case_index]

print(f"\nTesting {format_type.upper()} format")
print(f"Test case: {test_case['name']}")
print(f"{test_case['description']}")
print("\nInput data:")
print(json.dumps(test_case['data'], indent=2))

# Get the appropriate prompt based on format
if format_type == "lsf":
    prompt = lsf.get_llm_prompt(include_example=True, style="detailed")
elif format_type == "json":
    prompt = "Generate the following data as valid JSON. Ensure all strings are properly escaped."
else:
    print(f"Unknown format: {format_type}")
    sys.exit(1)

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=api_key)

try:
    # Call Anthropic API
    message = client.messages.create(
        model="claude-3-7-sonnet-latest",
        max_tokens=4000,
        temperature=0,
        messages=[{
            "role": "user",
            "content": f"{prompt}\n\nData to convert:\n{json.dumps(test_case['data'], indent=2)}\n\nReturn ONLY the {format_type.upper()} data, no explanations."
        }]
    )
    
    generated = message.content[0].text.strip()
    print("\n✓ Generated output:")
    print(generated)
    
    # Try to parse
    print("\n🔍 Attempting to parse...")
    
    try:
        if format_type == "json":
            parsed = json.loads(generated)
            print("✓ Successfully parsed JSON!")
            print("\nParsed result:")
            print(json.dumps(parsed, indent=2))
        elif format_type == "lsf":
            # Parse LSF and convert to JSON
            json_result = lsf.parse_to_json(generated)
            
            if json_result is None:
                raise Exception("LSF parsing failed: returned None")
            
            print("✓ Successfully parsed LSF!")
            print("\nParsed result:")
            print(json_result)
            
    except Exception as e:
        print(f"✗ Parsing failed: {e}")
        
        if format_type == "lsf":
            print("\nDebug info:")
            tokens = re.findall(r'\$[ovft]~', generated)
            print(f"Generated LSF tokens: {' '.join(tokens)}")

except Exception as ex:
    print(f"Error: {ex}")
    sys.exit(1)