"""
LSF (LLM-Safe Format) Python Implementation

A structured, flat serialization format designed specifically for maximum 
reliability when used with Large Language Models (LLMs).
"""

from .encoder import LSFEncoder
from .decoder import LSFDecoder
from .simple import to_lsf, from_lsf

__version__ = "1.2.0"

__all__ = [
    "LSFEncoder", 
    "LSFDecoder", 
    "to_lsf", 
    "from_lsf"
] 