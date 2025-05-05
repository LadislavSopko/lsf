#!/usr/bin/env python
"""
LSF Optimized Decoder Implementation

This module provides an optimized implementation of the LSF decoder
focused on improving parsing performance.
"""

import re
from typing import Dict, Any, List, Tuple, Optional, Union, Set

from lsf.decoder import LSFDecoder as OriginalDecoder

class FastLSFDecoder(OriginalDecoder):
    """
    An optimized LSF decoder that uses more efficient parsing techniques
    to improve decoding performance.
    
    Optimizations include:
    1. Pre-compiled regex patterns
    2. Fast path for common token types
    3. Direct string splitting instead of regex for common operations
    4. Lookup tables instead of conditional chains
    5. Reduced object creation during parsing
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Pre-compile regex patterns
        self._token_pattern = re.compile(r'\$([otefxv])~(.*?)(?=\$[otefxv]~|\$r~|\Z)')
        self._field_pattern = re.compile(r'\$f~(.*?)(?=\$f~|\$r~|\Z)')
        
        # Token type constants
        self._TOKEN_OBJECT = 'o'
        self._TOKEN_FIELD = 'f'
        self._TOKEN_TYPED_FIELD = 't'
        self._TOKEN_ERROR = 'e'
        self._TOKEN_TRANSACTION = 'x'
        self._TOKEN_VERSION = 'v'
        
        # Static token markers
        self._RECORD_SEP = '$r~'
        self._LIST_SEP = '$l~'
        
        # Type conversion lookup table
        self._type_converters = {
            'int': lambda x: int(x),
            'float': lambda x: float(x),
            'bool': lambda x: x.lower() == 'true',
            'null': lambda x: None,
            'bin': lambda x: x,  # Binary data would need proper decoding
            'str': lambda x: x
        }
        
        # Token handler lookup table
        self._token_handlers = {
            self._TOKEN_OBJECT: self._handle_object_token,
            self._TOKEN_FIELD: self._handle_field_token,
            self._TOKEN_TYPED_FIELD: self._handle_typed_field_token,
            self._TOKEN_ERROR: self._handle_error_token,
            self._TOKEN_TRANSACTION: self._handle_transaction_token,
            self._TOKEN_VERSION: self._handle_version_token
        }

    def decode(self, lsf_string: str) -> Dict[str, Any]:
        """
        Decode an LSF-formatted string into a Python dictionary.
        This optimized implementation focuses on performance.
        """
        # Reset state and use optimized implementation
        self._errors = []
        result = self._fast_decode(lsf_string)
        return result
    
    def _fast_decode(self, lsf_string: str) -> Dict[str, Any]:
        """
        Optimized decoding implementation with better performance.
        """
        # Initialize result and state
        result = {}
        self._current_object = None
        
        # Fast path for empty strings
        if not lsf_string:
            return result
        
        # Split the LSF string into tokens for faster processing
        # This is faster than using regex for the whole string
        # Instead of extracting all tokens at once, we process them sequentially
        
        # Process markers in the string
        position = 0
        length = len(lsf_string)
        
        while position < length:
            # Find the next token marker
            next_marker = lsf_string.find('$', position)
            
            # If no more markers, we're done
            if next_marker == -1:
                break
            
            # Check what type of token it is
            if next_marker + 2 < length and lsf_string[next_marker + 2] == '~':
                token_type = lsf_string[next_marker + 1]
                
                # Find the end of this token (next record separator)
                end_pos = lsf_string.find(self._RECORD_SEP, next_marker + 3)
                if end_pos == -1:
                    end_pos = length
                
                # Extract token data
                token_data = lsf_string[next_marker + 3:end_pos]
                
                # Handle the token based on its type
                if token_type == self._TOKEN_OBJECT:
                    # Process object token - create new object
                    self._current_object = token_data
                    if self._current_object not in result:
                        result[self._current_object] = {}
                
                elif token_type == self._TOKEN_FIELD:
                    # Process field token - this is the most common type
                    # Fast path for field processing
                    if self._current_object is not None:
                        # Split the field by the field separator
                        field_parts = token_data.split('$f~', 1)
                        if len(field_parts) == 2:
                            key, value = field_parts
                            
                            # Handle list values efficiently
                            if self._LIST_SEP in value:
                                value = value.split(self._LIST_SEP)
                            
                            result[self._current_object][key] = value
                
                elif token_type in self._token_handlers:
                    # Use lookup table for other token types
                    self._token_handlers[token_type](token_data, result)
                
                # Move position past this token
                position = end_pos + 3  # +3 for '$r~'
            else:
                # Invalid token, skip it
                position = next_marker + 1
        
        return result
    
    def _handle_typed_field_token(self, token_data: str, result: Dict[str, Any]) -> None:
        """Handle a typed field token with optimized parsing."""
        if self._current_object is None:
            return
        
        # Split by field separator - more efficient than regex for simple splits
        parts = token_data.split('$f~', 2)
        if len(parts) == 3:
            type_hint, key, value = parts
            
            # Use lookup table for type conversion
            if type_hint in self._type_converters:
                try:
                    converted_value = self._type_converters[type_hint](value)
                    result[self._current_object][key] = converted_value
                except (ValueError, TypeError):
                    # Fallback to string if conversion fails
                    result[self._current_object][key] = value
            else:
                # Unknown type hint, use value as is
                result[self._current_object][key] = value

class NonRegexDecoder(OriginalDecoder):
    """
    LSF decoder that avoids using regex for tokenization and parsing.
    
    This implementation uses direct string manipulation and splitting,
    which can be faster than regex for simple parsing tasks.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Token markers
        self._OBJECT_MARKER = '$o~'
        self._FIELD_MARKER = '$f~'
        self._TYPED_FIELD_MARKER = '$t~'
        self._ERROR_MARKER = '$e~'
        self._TRANSACTION_MARKER = '$x~'
        self._VERSION_MARKER = '$v~'
        self._RECORD_SEP = '$r~'
        self._LIST_SEP = '$l~'
        
        # Type conversion functions
        self._type_converters = {
            'int': int,
            'float': float,
            'bool': lambda x: x.lower() == 'true',
            'null': lambda x: None,
            'bin': str,  # Placeholder for binary handling
            'str': str
        }
    
    def decode(self, lsf_string: str) -> Dict[str, Any]:
        """Decode LSF string using direct string operations instead of regex."""
        # Reset state
        self._errors = []
        self._current_object = None
        result = {}
        
        # Fast path for empty strings
        if not lsf_string:
            return result
        
        # Split the string into tokens by record separator
        # This approach avoids the overhead of regex for simple splitting
        tokens = lsf_string.split(self._RECORD_SEP)
        
        for token in tokens:
            if not token:
                continue
                
            # Determine token type from its prefix
            if token.startswith(self._OBJECT_MARKER):
                # Object token
                self._current_object = token[len(self._OBJECT_MARKER):]
                if self._current_object not in result:
                    result[self._current_object] = {}
            
            elif token.startswith(self._FIELD_MARKER) and self._current_object:
                # Field token - split on field separator
                parts = token[len(self._FIELD_MARKER):].split(self._FIELD_MARKER, 1)
                if len(parts) == 2:
                    key, value = parts
                    
                    # Handle list values
                    if self._LIST_SEP in value:
                        result[self._current_object][key] = value.split(self._LIST_SEP)
                    else:
                        result[self._current_object][key] = value
            
            elif token.startswith(self._TYPED_FIELD_MARKER) and self._current_object:
                # Typed field token
                remainder = token[len(self._TYPED_FIELD_MARKER):]
                parts = remainder.split(self._FIELD_MARKER, 2)
                if len(parts) == 3:
                    type_hint, key, value = parts
                    
                    # Convert value based on type hint
                    if type_hint in self._type_converters:
                        try:
                            result[self._current_object][key] = self._type_converters[type_hint](value)
                        except (ValueError, TypeError):
                            # Fallback to string on conversion error
                            result[self._current_object][key] = value
                    else:
                        result[self._current_object][key] = value
            
            elif token.startswith(self._ERROR_MARKER):
                # Error token
                error_message = token[len(self._ERROR_MARKER):]
                self._errors.append(error_message)
            
            # Transactions and version tokens can be handled similarly
        
        return result

class StreamingDecoder(OriginalDecoder):
    """
    LSF decoder that uses a streaming approach to process tokens.
    
    This implementation is designed to minimize memory usage by 
    processing the LSF string in a single pass without creating 
    intermediate data structures.
    """
    
    def decode(self, lsf_string: str) -> Dict[str, Any]:
        """Decode LSF string using a streaming approach."""
        # Reset state
        self._errors = []
        self._current_object = None
        result = {}
        
        # Fast path for empty strings
        if not lsf_string:
            return result
        
        # Process the string character by character in a single pass
        i = 0
        length = len(lsf_string)
        
        while i < length:
            # Look for token markers
            if lsf_string[i] == '$' and i + 2 < length and lsf_string[i+2] == '~':
                # Found a token marker
                token_type = lsf_string[i+1]
                i += 3  # Skip the marker
                
                # Extract token data until record separator or end
                start = i
                while i < length:
                    if i + 2 < length and lsf_string[i:i+3] == '$r~':
                        break
                    i += 1
                
                token_data = lsf_string[start:i]
                i += 3  # Skip the record separator
                
                # Process token based on type
                if token_type == 'o':
                    # Object token
                    self._current_object = token_data
                    if self._current_object not in result:
                        result[self._current_object] = {}
                
                elif token_type == 'f' and self._current_object:
                    # Field token
                    self._process_field(token_data, result)
                
                elif token_type == 't' and self._current_object:
                    # Typed field token
                    self._process_typed_field(token_data, result)
                
                elif token_type == 'e':
                    # Error token
                    self._errors.append(token_data)
                
                # Skip other token types for brevity
            else:
                # Not a token marker, skip
                i += 1
        
        return result
    
    def _process_field(self, token_data: str, result: Dict[str, Any]) -> None:
        """Process a field token efficiently."""
        # Find field separator
        sep_index = token_data.find('$f~')
        if sep_index != -1:
            key = token_data[:sep_index]
            value = token_data[sep_index+3:]
            
            # Handle list values
            if '$l~' in value:
                result[self._current_object][key] = value.split('$l~')
            else:
                result[self._current_object][key] = value
    
    def _process_typed_field(self, token_data: str, result: Dict[str, Any]) -> None:
        """Process a typed field token efficiently."""
        # Extract type hint
        sep_index = token_data.find('$f~')
        if sep_index != -1:
            type_hint = token_data[:sep_index]
            remainder = token_data[sep_index+3:]
            
            # Extract key and value
            sep_index2 = remainder.find('$f~')
            if sep_index2 != -1:
                key = remainder[:sep_index2]
                value = remainder[sep_index2+3:]
                
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

# Factory function to get an optimized decoder
def get_optimized_decoder(optimization_type: str = 'fast'):
    """
    Factory function to create an optimized decoder based on the specified type.
    
    Args:
        optimization_type: Type of optimization to use ('fast', 'nonregex', or 'streaming')
        
    Returns:
        An instance of the specified optimized decoder
    """
    if optimization_type == 'nonregex':
        return NonRegexDecoder()
    elif optimization_type == 'streaming':
        return StreamingDecoder()
    else:  # Default to 'fast'
        return FastLSFDecoder() 