"""
Simplified LSF API for Python

This module provides simple functions for common LSF operations.
"""

import base64
from typing import Any, Dict, List, Union

from .encoder import LSFEncoder
from .decoder import LSFDecoder


def to_lsf(data: Dict[str, Dict[str, Any]]) -> str:
    """
    Convert a nested dictionary to LSF format
    
    Args:
        data: Dictionary to convert (must have object names as top-level keys)
        
    Returns:
        LSF formatted string
        
    Example:
        >>> to_lsf({"user": {"id": 123, "name": "John", "tags": ["admin", "user"]}})
        '$o~user$r~$f~id$f~123$r~$f~name$f~John$r~$f~tags$f~admin$l~user$r~'
    """
    encoder = LSFEncoder()
    
    for obj_name, obj_data in data.items():
        encoder.start_object(obj_name)
        
        for key, value in obj_data.items():
            if isinstance(value, list):
                encoder.add_list(key, value)
            elif isinstance(value, int) and not isinstance(value, bool):
                encoder.add_typed_field(key, value, "int")
            elif isinstance(value, float):
                encoder.add_typed_field(key, value, "float")
            elif isinstance(value, bool):
                encoder.add_typed_field(key, value, "bool")
            elif value is None:
                encoder.add_typed_field(key, value, "null")
            elif isinstance(value, bytes):
                encoder.add_typed_field(key, value, "bin")
            else:
                encoder.add_field(key, value)
    
    return encoder.to_string()


def from_lsf(lsf_str: str) -> Dict[str, Dict[str, Any]]:
    """
    Convert an LSF string to a nested dictionary
    
    Args:
        lsf_str: LSF formatted string
        
    Returns:
        Dictionary representing the parsed data
        
    Example:
        >>> from_lsf('$o~user$r~$f~id$f~123$r~$f~name$f~John$r~')
        {'user': {'id': '123', 'name': 'John'}}
    """
    decoder = LSFDecoder()
    return decoder.decode(lsf_str) 