"""LSF (LLM-Safe Format) Python implementation."""
from typing import Union, Optional, List, Dict, Any

from .parser.token_scanner import TokenScanner
from .parser.dom_builder import DOMBuilder
from .parser.dom_navigator import DOMNavigator
from .parser.visitor import LSFToJSONVisitor
from .parser.encoder import LSFEncoder
from .parser.types import ParseResult, LSFNode
from .parser.parser_options import ParserOptions


def parse_to_dom(input_data: Union[str, bytes]) -> ParseResult:
    """
    Parse LSF data to DOM structure.
    
    Args:
        input_data: LSF formatted string or bytes
        
    Returns:
        ParseResult with nodes or error
    """
    # Convert to bytes if string
    if isinstance(input_data, str):
        buffer = input_data.encode('utf-8')
    else:
        buffer = input_data
    
    # Scan tokens
    tokens = TokenScanner.scan(buffer)
    
    # Build DOM
    return DOMBuilder.build(tokens, buffer)


def parse_to_json(input_data: Union[str, bytes], options: Optional[ParserOptions] = None) -> Optional[str]:
    """
    Parse LSF data directly to JSON string.
    
    Args:
        input_data: LSF formatted string or bytes
        options: Parser options (optional)
        
    Returns:
        JSON string or None on error
    """
    if options is None:
        options = ParserOptions.default()
    
    # Check size limit
    if isinstance(input_data, str):
        if len(input_data) > options.max_input_size:
            raise ValueError(f"Input size exceeds maximum allowed size of {options.max_input_size // (1024 * 1024)}MB")
        buffer = input_data.encode('utf-8')
    else:
        if len(input_data) > options.max_input_size:
            raise ValueError(f"Input size exceeds maximum allowed size of {options.max_input_size // (1024 * 1024)}MB")
        buffer = input_data
    
    # Parse to DOM with options
    # Convert to bytes if string
    if isinstance(input_data, str):
        parse_buffer = input_data.encode('utf-8')
    else:
        parse_buffer = input_data
    
    # Scan tokens
    tokens = TokenScanner.scan(parse_buffer)
    
    # Build DOM with options
    result = DOMBuilder.build(tokens, parse_buffer, options)
    if not result.success or result.nodes is None:
        return None
    
    # Navigate and convert to JSON
    navigator = DOMNavigator(buffer, result.nodes)
    visitor = LSFToJSONVisitor(navigator)
    return visitor.to_json_string()


def encode_to_string(data: Any, object_name: Optional[str] = None) -> str:
    """
    Encode Python data to LSF string.
    
    Args:
        data: Python dict or list of dicts
        object_name: Optional name for the object
        
    Returns:
        LSF formatted string
    """
    return LSFEncoder.encode_to_string(data, object_name)


def encode_to_bytes(data: Any, object_name: Optional[str] = None) -> bytes:
    """
    Encode Python data to LSF bytes.
    
    Args:
        data: Python dict or list of dicts
        object_name: Optional name for the object
        
    Returns:
        LSF formatted bytes
    """
    return LSFEncoder.encode_to_bytes(data, object_name)


# Public API
__all__ = [
    'parse_to_dom',
    'parse_to_json',
    'encode_to_string',
    'encode_to_bytes',
    'ParseResult',
    'LSFNode',
    'ParserOptions',
]