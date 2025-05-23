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


def get_llm_prompt(include_example: bool = True, style: str = "minimal") -> str:
    """
    Get a prompt for instructing LLMs to generate LSF format.
    
    Args:
        include_example: Whether to include an example in the prompt. Default is True.
        style: The style of prompt to generate. "minimal" or "detailed". Default is "minimal".
        
    Returns:
        A prompt string for LLM LSF generation.
        
    Note:
        The prompts returned by this function are defined in docs/LLM_PROMPT.md
        to ensure consistency across all language implementations.
        
    Example:
        prompt = get_llm_prompt()
        full_prompt = f"{prompt}\n\nConvert this data: {json.dumps(data)}"
    """
    if style == "detailed":
        prompt = """Generate output in LSF (LLM-Safe Format):

TOKENS:
- $o~ = start object
- $f~ = field name follows
- $v~ = value follows  
- $t~ = type hint follows (single character)

TYPES:
- n = integer (e.g., 42)
- f = float (e.g., 3.14)
- b = boolean (true/false)
- d = datetime (ISO format)
- s = string (optional, default)
- z = null

RULES:
1. NO quotes, brackets, or commas anywhere
2. NO newlines between tokens (continuous stream)
3. Arrays: repeat $v~ for same field
4. Multi-line strings: write actual newlines, not \\n
5. Write all special characters as-is
6. NO escaping - write everything literally"""
        
        if include_example:
            prompt += """\n\nEXAMPLE:
$o~$f~name$v~John Doe$f~age$v~30$t~n$f~active$v~true$t~b$f~tags$v~admin$v~user"""
            
        return prompt
    
    # Minimal style (default)
    prompt = """Output in LSF format:
$o~=object, $f~=field, $v~=value, $t~=type(n=int,f=float,b=bool,d=date,z=null)
NO quotes/brackets. Arrays: repeat $v~. Continuous line."""
    
    if include_example:
        prompt += "\nExample: $o~$f~name$v~John$f~age$v~30$t~n$f~tags$v~a$v~b"
        
    return prompt


# Public API
__all__ = [
    'parse_to_dom',
    'parse_to_json',
    'encode_to_string',
    'encode_to_bytes',
    'get_llm_prompt',
    'ParseResult',
    'LSFNode',
    'ParserOptions',
]