"""
LSF Encoder for Python

This module provides the encoder component for LSF (LLM-Safe Format).
"""

import base64
from typing import Any, List, Optional, Union


class LSFEncoder:
    """
    Encoder for LSF (LLM-Safe Format)
    
    This class provides a fluent API for encoding data to LSF format.
    """
    
    def __init__(self):
        self._buffer = []
        self._current_object = None
    
    def start_object(self, name: str) -> 'LSFEncoder':
        """
        Start a new object with the given name
        
        Args:
            name: The name of the object
            
        Returns:
            self for chaining
        """
        self._buffer.append(f"$o§{name}$r§")
        self._current_object = name
        return self
    
    def add_field(self, key: str, value: Any) -> 'LSFEncoder':
        """
        Add a field to the current object
        
        Args:
            key: The field key
            value: The field value (converted to string)
            
        Returns:
            self for chaining
            
        Raises:
            ValueError: If no object has been started
        """
        if self._current_object is None:
            raise ValueError("No object started. Call start_object() first.")
        
        self._buffer.append(f"$f§{key}$f§{str(value)}$r§")
        return self
    
    def add_typed_field(self, key: str, value: Any, type_hint: str) -> 'LSFEncoder':
        """
        Add a typed field to the current object
        
        Args:
            key: The field key
            value: The field value
            type_hint: One of: "int", "float", "bool", "null", "bin", "str"
            
        Returns:
            self for chaining
            
        Raises:
            ValueError: If no object has been started or type_hint is invalid
        """
        if self._current_object is None:
            raise ValueError("No object started. Call start_object() first.")
        
        if type_hint not in ("int", "float", "bool", "null", "bin", "str"):
            raise ValueError(f"Invalid type hint: {type_hint}")
        
        # Handle binary data with base64 encoding
        if type_hint == "bin" and value is not None:
            value = base64.b64encode(value).decode('ascii')
        
        # Handle None for null type
        if type_hint == "null":
            value = ""
        
        self._buffer.append(f"$t§{type_hint}$f§{key}$f§{str(value)}$r§")
        return self
    
    def add_list(self, key: str, values: List[Any]) -> 'LSFEncoder':
        """
        Add a list field to the current object
        
        Args:
            key: The field key
            values: List of values
            
        Returns:
            self for chaining
            
        Raises:
            ValueError: If no object has been started
        """
        if self._current_object is None:
            raise ValueError("No object started. Call start_object() first.")
        
        if not values:
            # Empty list
            self._buffer.append(f"$f§{key}$f§$r§")
        else:
            items = "$l§".join(str(v) for v in values)
            self._buffer.append(f"$f§{key}$f§{items}$r§")
        
        return self
    
    def add_error(self, message: str) -> 'LSFEncoder':
        """
        Add an error message to the current object
        
        Args:
            message: Error message
            
        Returns:
            self for chaining
        """
        self._buffer.append(f"$e§{message}$r§")
        return self
    
    def end_transaction(self) -> 'LSFEncoder':
        """
        End the current transaction
        
        Returns:
            self for chaining
        """
        self._buffer.append("$x§$r§")
        return self
    
    def to_string(self) -> str:
        """
        Convert the buffer to an LSF string
        
        Returns:
            The LSF formatted string
        """
        return "".join(self._buffer) 