"""LSF (LLM-Safe Format) Python implementation."""
from typing import Union, Optional, List, Dict, Any

from .parser.token_scanner import TokenScanner
from .parser.dom_builder import DOMBuilder
from .parser.dom_navigator import DOMNavigator
from .parser.visitor import LSFToJSONVisitor
from .parser.encoder import LSFEncoder
from .parser.types import ParseResult, LSFNode


def parse_to_dom(input_data: Union[str, bytes]) -> ParseResult:
    """
    Parse LSF data to DOM structure.
    
    Args:
        input_data: LSF formatted string or bytes
        
    Returns:
        ParseResult with nodes or error
    """
    try:
        # Convert to bytes if string
        if isinstance(input_data, str):
            buffer = input_data.encode('utf-8')
        else:
            buffer = input_data
        
        # Scan tokens
        tokens = TokenScanner.scan(buffer)
        
        # Build DOM
        return DOMBuilder.build(tokens, buffer)
    except Exception as e:
        return ParseResult(success=False, nodes=None, error_message=str(e))


def parse_to_json(input_data: Union[str, bytes]) -> Optional[str]:
    """
    Parse LSF data directly to JSON string.
    
    Args:
        input_data: LSF formatted string or bytes
        
    Returns:
        JSON string or None on error
    """
    try:
        # Parse to DOM
        result = parse_to_dom(input_data)
        if not result.success or result.nodes is None:
            return None
        
        # Convert to bytes for navigator
        if isinstance(input_data, str):
            buffer = input_data.encode('utf-8')
        else:
            buffer = input_data
        
        # Navigate and convert to JSON
        navigator = DOMNavigator(buffer, result.nodes)
        visitor = LSFToJSONVisitor(navigator)
        return visitor.to_json_string()
    except:
        return None


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
]