"""Tests for TokenScanner."""
import pytest
from lsf.parser import TokenScanner, TokenType


class TestTokenScanner:
    """Test cases for TokenScanner."""
    
    def test_scan_empty_input_returns_empty_list(self):
        """Empty input should return empty token list."""
        tokens = TokenScanner.scan("")
        assert tokens == []
    
    def test_scan_no_tokens_returns_empty_list(self):
        """Input without tokens should return empty list."""
        tokens = TokenScanner.scan("This is just plain text.")
        assert tokens == []
    
    def test_scan_single_object_token(self):
        """Should scan single object token."""
        tokens = TokenScanner.scan("$o~MyObject")
        assert len(tokens) == 1
        assert tokens[0].type == TokenType.OBJECT
        assert tokens[0].position == 0
        assert tokens[0].data_start == 3
        assert tokens[0].data_length == 8
    
    def test_scan_multiple_tokens_in_order(self):
        """Should scan multiple tokens in order."""
        lsf = "$o~$f~field$v~value"
        tokens = TokenScanner.scan(lsf)
        
        assert len(tokens) == 3
        
        # Object token
        assert tokens[0].type == TokenType.OBJECT
        assert tokens[0].data_length == 0  # Empty name
        
        # Field token
        assert tokens[1].type == TokenType.FIELD
        assert tokens[1].data_length == 5  # "field"
        
        # Value token
        assert tokens[2].type == TokenType.VALUE
        assert tokens[2].data_length == 5  # "value"
    
    def test_scan_adjacent_tokens(self):
        """Should handle adjacent tokens correctly."""
        tokens = TokenScanner.scan("$o~$f~$v~")
        assert len(tokens) == 3
        assert all(t.data_length == 0 for t in tokens)
    
    def test_scan_ignores_non_token_dollar_signs(self):
        """Should ignore dollar signs that aren't tokens."""
        tokens = TokenScanner.scan("$100 $x~ $o $o!")
        assert len(tokens) == 0
    
    def test_scan_partial_token_at_end_ignored(self):
        """Should ignore incomplete tokens at end."""
        tokens = TokenScanner.scan("$o~test$f")
        assert len(tokens) == 1
        assert tokens[0].type == TokenType.OBJECT
    
    def test_scan_token_at_very_end(self):
        """Should handle token at very end of input."""
        tokens = TokenScanner.scan("data$v~")
        assert len(tokens) == 1
        assert tokens[0].type == TokenType.VALUE
        assert tokens[0].data_length == 0
    
    def test_scan_type_hint_token(self):
        """Should scan type hint tokens correctly."""
        tokens = TokenScanner.scan("$v~123$t~n")
        assert len(tokens) == 2
        
        # Value token
        assert tokens[0].type == TokenType.VALUE
        assert tokens[0].data_length == 3
        
        # Type hint token
        assert tokens[1].type == TokenType.TYPE_HINT
        assert tokens[1].data_length == 1  # Just 'n'
    
    def test_scan_unicode_data(self):
        """Should handle Unicode data correctly."""
        lsf = "$o~测试$f~名称$v~Hello 世界"
        tokens = TokenScanner.scan(lsf)
        
        assert len(tokens) == 3
        # Note: data_length is in bytes, not characters
        assert tokens[0].data_length == 6  # "测试" in UTF-8
        assert tokens[1].data_length == 6  # "名称" in UTF-8