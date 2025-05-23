"""Tests for LSFEncoder."""
import pytest
from lsf import encode_to_string, encode_to_bytes


class TestLSFEncoder:
    """Test cases for LSF encoder."""
    
    def test_encode_simple_object(self):
        """Should encode simple object."""
        data = {"name": "John", "age": 30}
        result = encode_to_string(data)
        
        assert "$o~" in result
        assert "$f~name$v~John" in result
        assert "$f~age$v~30$t~n" in result
    
    def test_encode_object_with_name(self):
        """Should encode object with name."""
        data = {"field": "value"}
        result = encode_to_string(data, "MyObject")
        
        assert result.startswith("$o~MyObject")
    
    def test_encode_various_types(self):
        """Should encode different value types with correct hints."""
        data = {
            "integer": 42,
            "float": 3.14,
            "bool_true": True,
            "bool_false": False,
            "string": "text",
            "null": None
        }
        result = encode_to_string(data)
        
        assert "$f~integer$v~42$t~n" in result
        assert "$f~float$v~3.14$t~f" in result
        assert "$f~bool_true$v~true$t~b" in result
        assert "$f~bool_false$v~false$t~b" in result
        assert "$f~string$v~text" in result  # No type hint for strings
        assert "$f~null$v~null$t~z" in result
    
    def test_encode_list_of_objects(self):
        """Should encode list of objects."""
        data = [
            {"id": 1, "name": "A"},
            {"id": 2, "name": "B"}
        ]
        result = encode_to_string(data)
        
        # Two objects
        assert result.count("$o~") == 2
        assert "$f~id$v~1$t~n" in result
        assert "$f~id$v~2$t~n" in result
    
    def test_encode_empty_object(self):
        """Should encode empty object."""
        result = encode_to_string({})
        assert result == "$o~"
    
    def test_encode_empty_string_value(self):
        """Should encode empty string value."""
        result = encode_to_string({"key": ""})
        assert "$f~key$v~" in result
    
    def test_encode_unicode_data(self):
        """Should encode Unicode data correctly."""
        data = {"text": "你好世界", "emoji": "😀"}
        result = encode_to_string(data)
        
        assert "$f~text$v~你好世界" in result
        assert "$f~emoji$v~😀" in result
    
    def test_encode_to_bytes(self):
        """Should encode to UTF-8 bytes."""
        data = {"test": "value"}
        result = encode_to_bytes(data)
        
        assert isinstance(result, bytes)
        assert b"$o~" in result
        assert b"$f~test$v~value" in result
    
    def test_encode_float_vs_integer(self):
        """Should distinguish between float and integer."""
        data = {"price": 99.99, "count": 100}
        result = encode_to_string(data)
        
        assert "$f~price$v~99.99$t~f" in result  # Float hint
        assert "$f~count$v~100$t~n" in result    # Integer hint
    
    # Error cases
    def test_encode_nested_object_raises_error(self):
        """Should raise error for nested objects."""
        data = {"user": {"name": "John"}}
        
        with pytest.raises(ValueError, match="Nested objects or arrays are not allowed"):
            encode_to_string(data)
    
    def test_encode_nested_array_raises_error(self):
        """Should raise error for arrays in fields."""
        data = {"items": [1, 2, 3]}
        
        with pytest.raises(ValueError, match="Nested objects or arrays are not allowed"):
            encode_to_string(data)
    
    def test_encode_list_with_non_dict_raises_error(self):
        """Should raise error if list contains non-dicts."""
        data = [{"id": 1}, "not a dict"]
        
        with pytest.raises(ValueError, match="List must contain only dictionaries"):
            encode_to_string(data)
    
    def test_encode_invalid_top_level_raises_error(self):
        """Should raise error for invalid top-level types."""
        with pytest.raises(ValueError, match="Input must be a dict or list of dicts"):
            encode_to_string("string")
        
        with pytest.raises(ValueError, match="Input must be a dict or list of dicts"):
            encode_to_string(123)
        
        with pytest.raises(ValueError, match="Input must be a dict or list of dicts"):
            encode_to_string(None)