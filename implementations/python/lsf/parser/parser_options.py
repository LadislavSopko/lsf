"""Parser options for LSF."""
from dataclasses import dataclass


@dataclass
class ParserOptions:
    """Options for configuring LSF parser behavior."""
    
    max_input_size: int = 10 * 1024 * 1024  # 10MB default
    """Maximum allowed input size in bytes."""
    
    validate_type_hints: bool = True
    """Whether to validate type hints during parsing."""
    
    @classmethod
    def default(cls) -> 'ParserOptions':
        """Get default parser options."""
        return cls()