"""
LSF to JSON conversion utilities

This module provides functions to convert between LSF and JSON formats.
"""

import json
from typing import Any, Dict, Optional, Union

from .decoder import LSFDecoder


def lsf_to_json(
    lsf_string: str, 
    indent: Optional[int] = None, 
    sort_keys: bool = False
) -> str:
    """
    Convert an LSF string to a JSON string
    
    Args:
        lsf_string: The LSF formatted string
        indent: Indentation level for pretty-printing (None for compact)
        sort_keys: Whether to sort dictionary keys in the output
        
    Returns:
        JSON formatted string
        
    Example:
        >>> lsf_to_json("$o~user$r~$f~name$f~John$r~$f~age$f~30$r~")
        '{"user":{"name":"John","age":"30"}}'
        
        >>> lsf_to_json("$o~user$r~$f~name$f~John$r~", indent=2)
        '{
          "user": {
            "name": "John"
          }
        }'
    """
    # First decode LSF to Python objects
    decoder = LSFDecoder()
    data = decoder.decode(lsf_string)
    
    # Convert to JSON
    return json.dumps(data, indent=indent, sort_keys=sort_keys)


def lsf_to_json_pretty(lsf_string: str) -> str:
    """
    Convert an LSF string to a pretty-printed JSON string
    
    This is a convenience wrapper around lsf_to_json with indent=2
    
    Args:
        lsf_string: The LSF formatted string
        
    Returns:
        Pretty-printed JSON string
        
    Example:
        >>> lsf_to_json_pretty("$o~user$r~$f~name$f~John$r~")
        '{
          "user": {
            "name": "John"
          }
        }'
    """
    return lsf_to_json(lsf_string, indent=2) 