"""Type definitions for LSF parser."""
from dataclasses import dataclass
from enum import IntEnum
from typing import List, Optional, Union


class TokenType(IntEnum):
    """LSF token types."""
    OBJECT = ord('o')  # 111
    FIELD = ord('f')   # 102
    VALUE = ord('v')   # 118
    TYPE_HINT = ord('t')  # 116


class ValueHint(IntEnum):
    """Type hints for values."""
    NONE = 0
    NUMBER = ord('n')    # Integer
    FLOAT = ord('f')     # Float
    BOOLEAN = ord('b')   # Boolean
    DATETIME = ord('d')  # DateTime
    STRING = ord('s')    # String
    NULL = ord('z')      # Null


@dataclass
class TokenInfo:
    """Information about a scanned token."""
    type: TokenType
    position: int
    data_start: int
    data_length: int


@dataclass
class LSFNode:
    """A node in the LSF DOM tree."""
    type: TokenType
    parent_index: int
    token_position: int
    data_position: int
    data_length: int
    type_hint: ValueHint
    children_indices: List[int]


@dataclass
class ParseResult:
    """Result of parsing LSF data."""
    success: bool
    nodes: Optional[List[LSFNode]]
    error_message: Optional[str] = None