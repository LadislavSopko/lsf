"""Tests for DOMBuilder."""
import pytest
from lsf import parse_to_dom
from lsf.parser import TokenType, ValueHint


class TestDOMBuilder:
    """Test cases for DOMBuilder."""
    
    def test_build_empty_input_returns_empty_nodes(self):
        """Empty input should return empty nodes."""
        result = parse_to_dom("")
        assert result.success
        assert result.nodes == []
    
    def test_build_simple_object_field_value(self):
        """Should build simple object with field and value."""
        result = parse_to_dom("$o~MyObject$f~field$v~value")
        
        assert result.success
        assert len(result.nodes) == 3
        
        # Object node
        obj = result.nodes[0]
        assert obj.type == TokenType.OBJECT
        assert obj.parent_index == -1
        assert obj.data_length == 8  # "MyObject"
        assert obj.children_indices == [1]
        
        # Field node
        field = result.nodes[1]
        assert field.type == TokenType.FIELD
        assert field.parent_index == 0
        assert field.data_length == 5  # "field"
        assert field.children_indices == [2]
        
        # Value node
        value = result.nodes[2]
        assert value.type == TokenType.VALUE
        assert value.parent_index == 1
        assert value.data_length == 5  # "value"
        assert value.children_indices == []
    
    def test_build_implicit_array(self):
        """Multiple values for same field create implicit array."""
        result = parse_to_dom("$o~$f~tags$v~a$v~b$v~c")
        
        assert result.success
        assert len(result.nodes) == 5
        
        # Field should have 3 value children
        field = result.nodes[1]
        assert field.children_indices == [2, 3, 4]
    
    def test_build_type_hints(self):
        """Should apply type hints to values."""
        result = parse_to_dom("$o~$f~num$v~42$t~n$f~bool$v~true$t~b")
        
        assert result.success
        assert len(result.nodes) == 5
        
        # Number value with hint
        num_val = result.nodes[2]
        assert num_val.type_hint == ValueHint.NUMBER
        
        # Boolean value with hint
        bool_val = result.nodes[4]
        assert bool_val.type_hint == ValueHint.BOOLEAN
    
    def test_build_implicit_object_from_field(self):
        """Field without object creates implicit object."""
        result = parse_to_dom("$f~field$v~value")
        
        assert result.success
        assert len(result.nodes) == 3
        
        # Implicit object
        obj = result.nodes[0]
        assert obj.type == TokenType.OBJECT
        assert obj.data_length == 0
        assert obj.parent_index == -1
    
    def test_build_implicit_field_from_value(self):
        """Value without field creates implicit field."""
        result = parse_to_dom("$v~LoneValue")
        
        assert result.success
        assert len(result.nodes) == 3
        
        # Implicit object
        assert result.nodes[0].type == TokenType.OBJECT
        assert result.nodes[0].data_length == 0
        
        # Implicit field
        assert result.nodes[1].type == TokenType.FIELD
        assert result.nodes[1].data_length == 0
        
        # Value
        assert result.nodes[2].type == TokenType.VALUE
    
    def test_build_multiple_objects(self):
        """Should handle multiple top-level objects."""
        result = parse_to_dom("$o~obj1$f~a$v~1$o~obj2$f~b$v~2")
        
        assert result.success
        assert len(result.nodes) == 6
        
        # First object
        obj1 = result.nodes[0]
        assert obj1.type == TokenType.OBJECT
        assert obj1.parent_index == -1
        
        # Second object
        obj2 = result.nodes[3]
        assert obj2.type == TokenType.OBJECT
        assert obj2.parent_index == -1
    
    def test_build_orphaned_type_hint(self):
        """Orphaned type hint should be ignored."""
        result = parse_to_dom("$o~$f~field$t~n$v~value")
        
        assert result.success
        # Type hint between field and value is orphaned
        value = result.nodes[2]
        assert value.type_hint == ValueHint.NONE  # Not applied
    
    def test_build_unicode_data(self):
        """Should handle Unicode data correctly."""
        result = parse_to_dom("$o~测试$f~名称$v~Hello 世界")
        
        assert result.success
        assert len(result.nodes) == 3
        
        # Verify data lengths in bytes
        assert result.nodes[0].data_length == 6  # "测试"
        assert result.nodes[1].data_length == 6  # "名称"