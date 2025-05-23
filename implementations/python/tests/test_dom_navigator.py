"""Tests for DOMNavigator."""
import pytest
from lsf import parse_to_dom
from lsf.parser import DOMNavigator, TokenType


class TestDOMNavigator:
    """Test cases for DOM navigator."""
    
    def test_get_node(self):
        """Should get node by index."""
        result = parse_to_dom("$o~Test$f~field$v~value")
        nav = DOMNavigator(b"$o~Test$f~field$v~value", result.nodes)
        
        # Valid indices
        assert nav.get_node(0).type == TokenType.OBJECT
        assert nav.get_node(1).type == TokenType.FIELD
        assert nav.get_node(2).type == TokenType.VALUE
        
        # Invalid indices
        assert nav.get_node(-1) is None
        assert nav.get_node(3) is None
    
    def test_get_node_data_as_string(self):
        """Should get node data as string."""
        lsf = "$o~MyObject$f~myField$v~myValue"
        result = parse_to_dom(lsf)
        nav = DOMNavigator(lsf.encode('utf-8'), result.nodes)
        
        assert nav.get_node_data_as_string(0) == "MyObject"
        assert nav.get_node_data_as_string(1) == "myField"
        assert nav.get_node_data_as_string(2) == "myValue"
        
        # Invalid index
        assert nav.get_node_data_as_string(99) == ""
    
    def test_get_children_indices(self):
        """Should get children indices."""
        result = parse_to_dom("$o~$f~tags$v~a$v~b$v~c")
        nav = DOMNavigator(b"", result.nodes)
        
        # Object has one field child
        assert nav.get_children_indices(0) == [1]
        
        # Field has three value children
        assert nav.get_children_indices(1) == [2, 3, 4]
        
        # Values have no children
        assert nav.get_children_indices(2) == []
    
    def test_get_root_indices(self):
        """Should get all root node indices."""
        # Single root
        result = parse_to_dom("$o~single$f~test$v~value")
        nav = DOMNavigator(b"", result.nodes)
        assert nav.get_root_indices() == [0]
        
        # Multiple roots
        result = parse_to_dom("$o~first$f~a$v~1$o~second$f~b$v~2")
        nav = DOMNavigator(b"", result.nodes)
        assert nav.get_root_indices() == [0, 3]
    
    def test_node_count(self):
        """Should provide correct node count."""
        result = parse_to_dom("$o~$f~a$v~1$f~b$v~2")
        nav = DOMNavigator(b"", result.nodes)
        
        # Can check via nodes list
        assert len(nav.nodes) == 5
    
    def test_unicode_data(self):
        """Should handle Unicode data correctly."""
        lsf = "$o~测试$f~名称$v~值"
        result = parse_to_dom(lsf)
        nav = DOMNavigator(lsf.encode('utf-8'), result.nodes)
        
        assert nav.get_node_data_as_string(0) == "测试"
        assert nav.get_node_data_as_string(1) == "名称"
        assert nav.get_node_data_as_string(2) == "值"