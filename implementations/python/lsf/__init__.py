"""
LSF (LLM-Safe Format) Python Implementation

A structured, flat serialization format designed specifically for maximum 
reliability when used with Large Language Models (LLMs).
"""

from .encoder import LSFEncoder
from .decoder import LSFDecoder
from .simple import to_lsf, from_lsf
from .conversion import lsf_to_json, lsf_to_json_pretty

__version__ = "1.2.0"

__all__ = [
    "LSFEncoder", 
    "LSFDecoder", 
    "to_lsf", 
    "from_lsf",
    "lsf_to_json",
    "lsf_to_json_pretty"
] 