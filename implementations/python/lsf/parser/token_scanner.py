"""Token scanner for LSF format."""
from typing import List, Union
from .types import TokenInfo, TokenType


class TokenScanner:
    """Scans LSF input for tokens."""
    
    # Token markers as bytes
    DOLLAR = ord('$')
    TILDE = ord('~')
    
    @staticmethod
    def scan(input_data: Union[str, bytes]) -> List[TokenInfo]:
        """
        Scan input for LSF tokens.
        
        Args:
            input_data: LSF formatted string or bytes
            
        Returns:
            List of TokenInfo objects
        """
        # Convert string to bytes if needed
        if isinstance(input_data, str):
            buffer = input_data.encode('utf-8')
        else:
            buffer = input_data
            
        tokens: List[TokenInfo] = []
        i = 0
        length = len(buffer)
        
        while i < length - 2:  # Need at least 3 chars for a token
            if buffer[i] == TokenScanner.DOLLAR:
                # Check if it's a valid token
                token_char = buffer[i + 1]
                if token_char in (ord('o'), ord('f'), ord('v'), ord('t')) and buffer[i + 2] == TokenScanner.TILDE:
                    # Found a valid token
                    token_type = TokenType(token_char)
                    token_position = i
                    i += 3  # Skip past token
                    
                    # Find data start and length
                    data_start = i
                    data_length = 0
                    
                    # For type hints, read exactly one character
                    if token_type == TokenType.TYPE_HINT:
                        if i < length:
                            data_length = 1
                            i += 1
                    else:
                        # Find next token or end of input
                        while i < length:
                            if i < length - 2 and buffer[i] == TokenScanner.DOLLAR:
                                next_char = buffer[i + 1]
                                if next_char in (ord('o'), ord('f'), ord('v'), ord('t')) and buffer[i + 2] == TokenScanner.TILDE:
                                    break
                            i += 1
                        data_length = i - data_start
                    
                    tokens.append(TokenInfo(
                        type=token_type,
                        position=token_position,
                        data_start=data_start,
                        data_length=data_length
                    ))
                else:
                    i += 1
            else:
                i += 1
                
        return tokens