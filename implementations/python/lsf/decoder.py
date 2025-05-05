"""
LSF Decoder for Python

This module provides the decoder component for LSF (LLM-Safe Format).
"""

import base64
from typing import Any, Dict, List, Optional, Tuple


class LSFDecoder:
    """
    Decoder for LSF (LLM-Safe Format)
    
    This class provides methods for decoding LSF formatted strings to Python objects.
    """
    
    def __init__(self):
        self._errors = []
    
    def decode(self, lsf_str: str) -> Dict[str, Dict[str, Any]]:
        """
        Decode an LSF string to a Python dictionary
        
        Args:
            lsf_str: The LSF formatted string
            
        Returns:
            Dictionary representing the parsed data
            
        Example:
            >>> decoder = LSFDecoder()
            >>> decoder.decode("$o~user$r~$f~id$f~123$r~$f~name$f~John$r~")
            {'user': {'id': '123', 'name': 'John'}}
        """
        self._errors = []
        result = {}
        current_obj = None
        
        # Pre-process: remove all whitespace between records
        # This preserves whitespace within field values but removes it between records
        parts = []
        i = 0
        while i < len(lsf_str):
            if lsf_str[i:i+3] in ["$o~", "$f~", "$t~", "$e~", "$x~", "$v~"]:
                parts.append(lsf_str[i:i+3])
                i += 3
            elif lsf_str[i:i+3] == "$r~":
                parts.append(lsf_str[i:i+3])
                i += 3
                # Skip whitespace after record terminator
                while i < len(lsf_str) and lsf_str[i].isspace():
                    i += 1
            elif lsf_str[i:i+3] == "$l~":
                parts.append(lsf_str[i:i+3])
                i += 3
            else:
                parts.append(lsf_str[i])
                i += 1
        
        lsf_str = ''.join(parts)
        
        # Split by record terminator and process each record
        for record in lsf_str.split('$r~'):
            if not record.strip():
                continue
                
            if record.startswith('$o~'):
                # New object
                current_obj = record[3:]
                result[current_obj] = {}
                
            elif record.startswith('$t~') and current_obj:
                # Typed field
                try:
                    parts = record[3:].split('$f~', 2)
                    if len(parts) == 3:
                        type_hint, key, value = parts
                        result[current_obj][key] = self._convert_typed_value(type_hint, value)
                except Exception as e:
                    self._errors.append(f"Error parsing typed field {record}: {str(e)}")
                    
            elif record.startswith('$f~') and current_obj:
                # Regular field or list
                try:
                    key_val = record[3:].split('$f~')
                    if len(key_val) == 2:
                        k, v = key_val
                        if '$l~' in v:
                            # List field
                            result[current_obj][k] = v.split('$l~')
                        else:
                            # Regular field
                            result[current_obj][k] = v
                except Exception as e:
                    self._errors.append(f"Error parsing field {record}: {str(e)}")
                    
            elif record.startswith('$e~'):
                # Error marker
                self._errors.append(record[3:])
                
            # We ignore transaction markers ($x~) during decoding
                
        return result
    
    def _convert_typed_value(self, type_hint: str, value: str) -> Any:
        """
        Convert a value based on its type hint
        
        Args:
            type_hint: The type hint string
            value: The value to convert
            
        Returns:
            The converted value
            
        Raises:
            ValueError: If type_hint is not recognized
        """
        if type_hint == "int":
            return int(value)
        elif type_hint == "float":
            return float(value)
        elif type_hint == "bool":
            return value.lower() == "true"
        elif type_hint == "null":
            return None
        elif type_hint == "bin":
            return base64.b64decode(value)
        elif type_hint == "str":
            return value
        else:
            raise ValueError(f"Unknown type hint: {type_hint}")
    
    def get_errors(self) -> List[str]:
        """
        Get any errors encountered during decoding
        
        Returns:
            List of error messages
        """
        return self._errors 