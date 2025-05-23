"""Tests for LSFToJSONVisitor."""
import pytest
import json
from lsf import parse_to_json


class TestLSFToJSONVisitor:
    """Test cases for LSF to JSON conversion."""
    
    def test_simple_object_conversion(self):
        """Should convert simple object to JSON."""
        lsf = "$o~$f~name$v~Test$f~value$v~123"
        result = parse_to_json(lsf)
        
        assert result is not None
        data = json.loads(result)
        assert data == {"name": "Test", "value": "123"}
    
    def test_implicit_array_conversion(self):
        """Should convert implicit arrays correctly."""
        lsf = "$o~$f~tags$v~python$v~lsf$v~parser"
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == {"tags": ["python", "lsf", "parser"]}
    
    def test_type_hints_conversion(self):
        """Should apply type hints during conversion."""
        lsf = "$o~$f~count$v~42$t~n$f~price$v~99.99$t~f$f~active$v~true$t~b"
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == {
            "count": 42,
            "price": 99.99,
            "active": True
        }
    
    def test_empty_object_conversion(self):
        """Should convert empty object."""
        lsf = "$o~EmptyObj"
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == {}
    
    def test_empty_values_and_fields(self):
        """Should handle empty values and fields."""
        lsf = "$o~$f~empty$v~$f~null_field"
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == {
            "empty": "",
            "null_field": None  # Field with no value
        }
    
    def test_multiple_objects_as_array(self):
        """Multiple root objects should return as array."""
        lsf = "$o~user1$f~name$v~Alice$f~age$v~25$t~n$o~user2$f~name$v~Bob$f~age$v~30$t~n"
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == [
            {"name": "Alice", "age": 25},
            {"name": "Bob", "age": 30}
        ]
    
    def test_multiple_anonymous_objects(self):
        """Multiple anonymous objects as array."""
        lsf = "$o~$f~type$v~first$o~$f~type$v~second$o~$f~type$v~third"
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == [
            {"type": "first"},
            {"type": "second"},
            {"type": "third"}
        ]
    
    def test_mixed_named_anonymous_objects(self):
        """Mixed named and anonymous objects."""
        lsf = "$o~Named1$f~type$v~named$o~$f~type$v~anonymous$o~Named2$f~type$v~named2"
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == [
            {"type": "named"},
            {"type": "anonymous"},
            {"type": "named2"}
        ]
    
    def test_null_type_hint(self):
        """Should handle null type hint."""
        lsf = "$o~$f~value$v~null$t~z"
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == {"value": None}
    
    def test_invalid_number_returns_null(self):
        """Invalid number should return null."""
        lsf = "$o~$f~num$v~abc$t~n"
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == {"num": None}
    
    def test_invalid_boolean_returns_null(self):
        """Invalid boolean should return null."""
        lsf = "$o~$f~bool$v~yes$t~b"
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == {"bool": None}
    
    def test_implicit_field_name(self):
        """Implicit field gets special name."""
        lsf = "$o~MyObj$v~implicit_value"
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == {"__implicit_field__": "implicit_value"}
    
    def test_string_escaping(self):
        """Should properly escape strings."""
        lsf = '$o~$f~text$v~"Hello\\nWorld"\\t/'
        result = parse_to_json(lsf)
        
        data = json.loads(result)
        assert data == {"text": '"Hello\\nWorld"\\t/'}