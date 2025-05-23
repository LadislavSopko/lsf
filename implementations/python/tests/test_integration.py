"""Integration tests for LSF Python implementation."""
import pytest
import json
from lsf import parse_to_json, encode_to_string


class TestIntegration:
    """Integration tests covering full workflows."""
    
    def test_round_trip_simple_object(self):
        """Should handle round-trip conversion."""
        original = {"name": "Test", "value": 42, "active": True}
        
        # Encode to LSF
        lsf = encode_to_string(original)
        
        # Parse back to JSON
        json_str = parse_to_json(lsf)
        
        # Compare
        parsed = json.loads(json_str)
        assert parsed == original
    
    def test_round_trip_with_types(self):
        """Should preserve types in round-trip."""
        original = {
            "integer": 123,
            "float": 45.67,
            "boolean": False,
            "string": "hello",
            "null": None
        }
        
        lsf = encode_to_string(original)
        json_str = parse_to_json(lsf)
        parsed = json.loads(json_str)
        
        assert parsed == original
        assert type(parsed["integer"]) == int
        assert type(parsed["float"]) == float
        assert type(parsed["boolean"]) == bool
        assert type(parsed["string"]) == str
        assert parsed["null"] is None
    
    def test_complex_structure(self):
        """Should handle complex but flat structure."""
        lsf = ("$o~config"
               "$f~name$v~MyApp"
               "$f~version$v~1.2.3"
               "$f~port$v~8080$t~n"
               "$f~debug$v~false$t~b"
               "$f~hosts$v~localhost$v~127.0.0.1$v~::1"
               "$f~timeout$v~30.5$t~f"
               "$f~description$v~")
        
        json_str = parse_to_json(lsf)
        data = json.loads(json_str)
        
        assert data == {
            "name": "MyApp",
            "version": "1.2.3",
            "port": 8080,
            "debug": False,
            "hosts": ["localhost", "127.0.0.1", "::1"],
            "timeout": 30.5,
            "description": ""
        }
    
    def test_unicode_round_trip(self):
        """Should handle Unicode in round-trip."""
        original = {
            "greeting": "你好世界",
            "emoji": "🎉🎊",
            "mixed": "Hello мир 世界"
        }
        
        lsf = encode_to_string(original)
        json_str = parse_to_json(lsf)
        parsed = json.loads(json_str)
        
        assert parsed == original
    
    def test_empty_edge_cases(self):
        """Should handle various empty cases."""
        # Empty object
        assert json.loads(parse_to_json("$o~")) == {}
        
        # Empty string values
        lsf = "$o~$f~empty$v~$f~spaces$v~   "
        data = json.loads(parse_to_json(lsf))
        assert data == {"empty": "", "spaces": "   "}
    
    def test_special_characters_in_values(self):
        """Should handle special characters."""
        lsf = '$o~$f~special$v~$@#%^&*()_+-=[]{}|;:,.<>?'
        json_str = parse_to_json(lsf)
        data = json.loads(json_str)
        
        assert data == {"special": "$@#%^&*()_+-=[]{}|;:,.<>?"}
    
    def test_lsf_tokens_in_values(self):
        """Should handle LSF tokens inside values."""
        # Only complete tokens at proper boundaries should be parsed
        # This test is actually creating multiple objects because $o~ is found
        lsf = '$o~$f~contains_dollar$v~Price is $100 and $50'
        json_str = parse_to_json(lsf)
        data = json.loads(json_str)
        
        assert data == {"contains_dollar": "Price is $100 and $50"}