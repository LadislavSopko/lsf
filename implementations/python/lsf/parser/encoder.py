"""Encoder for converting Python objects to LSF format."""
from typing import Any, Dict, List, Union, Optional


class LSFEncoder:
    """Encodes Python objects to LSF format."""
    
    @staticmethod
    def encode_to_string(data: Any, object_name: Optional[str] = None) -> str:
        """
        Encode Python data to LSF string.
        
        Args:
            data: Python dict or list of dicts
            object_name: Optional name for the object
            
        Returns:
            LSF formatted string
            
        Raises:
            ValueError: If data is not a dict or list of dicts
        """
        if isinstance(data, list):
            # List of objects
            result = []
            for item in data:
                if not isinstance(item, dict):
                    raise ValueError("LSF 3.0 structure violation: List must contain only dictionaries")
                result.append(LSFEncoder._encode_object(item))
            return ''.join(result)
        elif isinstance(data, dict):
            # Single object
            return LSFEncoder._encode_object(data, object_name)
        else:
            raise ValueError("LSF 3.0 structure violation: Input must be a dict or list of dicts")
    
    @staticmethod
    def encode_to_bytes(data: Any, object_name: Optional[str] = None) -> bytes:
        """Encode to UTF-8 bytes."""
        return LSFEncoder.encode_to_string(data, object_name).encode('utf-8')
    
    @staticmethod
    def _encode_object(obj: Dict[str, Any], name: Optional[str] = None) -> str:
        """Encode a single object."""
        parts = ['$o~']
        if name:
            parts.append(name)
        
        for key, value in obj.items():
            parts.append('$f~')
            parts.append(str(key))
            
            # Handle different value types
            if value is None:
                parts.append('$v~null$t~z')
            elif isinstance(value, bool):
                parts.append(f'$v~{"true" if value else "false"}$t~b')
            elif isinstance(value, int):
                parts.append(f'$v~{value}$t~n')
            elif isinstance(value, float):
                parts.append(f'$v~{value}$t~f')
            elif isinstance(value, str):
                parts.append(f'$v~{value}')
            elif isinstance(value, (list, dict)):
                raise ValueError("LSF 3.0 structure violation: Nested objects or arrays are not allowed within fields")
            else:
                # Convert to string
                parts.append(f'$v~{str(value)}')
        
        return ''.join(parts)