"""Visitor pattern implementation for LSF to JSON conversion."""
import json
from typing import List, Optional, Any
from .types import TokenType, ValueHint
from .dom_navigator import DOMNavigator


class LSFToJSONVisitor:
    """Converts LSF DOM to JSON string."""
    
    def __init__(self, navigator: DOMNavigator):
        """Initialize visitor with navigator."""
        self.navigator = navigator
        self.result: List[str] = []
    
    def to_json_string(self) -> str:
        """Convert LSF DOM to JSON string."""
        root_indices = self.navigator.get_root_indices()
        
        if not root_indices:
            return '{}'
        
        if len(root_indices) == 1:
            # Single root object
            self.visit_object(root_indices[0])
        else:
            # Multiple root objects - return as array
            self.result.append('[')
            for i, root_index in enumerate(root_indices):
                if i > 0:
                    self.result.append(',')
                self.visit_object(root_index)
            self.result.append(']')
        
        return ''.join(self.result)
    
    def visit_object(self, node_index: int) -> None:
        """Visit an object node."""
        self.result.append('{')
        
        children = self.navigator.get_children_indices(node_index)
        first_field = True
        
        for child_index in children:
            child = self.navigator.get_node(child_index)
            if child and child.type == TokenType.FIELD:
                if not first_field:
                    self.result.append(',')
                self.visit_field(child_index)
                first_field = False
        
        self.result.append('}')
    
    def visit_field(self, node_index: int) -> None:
        """Visit a field node."""
        # Get field name
        field_name = self.navigator.get_node_data_as_string(node_index)
        if not field_name:
            field_name = '__implicit_field__'
        
        # Add field name
        self.result.append(json.dumps(field_name))
        self.result.append(':')
        
        # Get children (values)
        children = self.navigator.get_children_indices(node_index)
        
        if not children:
            self.result.append('null')
        elif len(children) == 1:
            # Single value
            self.visit_value(children[0])
        else:
            # Multiple values - array
            self.result.append('[')
            for i, child_index in enumerate(children):
                if i > 0:
                    self.result.append(',')
                self.visit_value(child_index)
            self.result.append(']')
    
    def visit_value(self, node_index: int) -> None:
        """Visit a value node."""
        node = self.navigator.get_node(node_index)
        if not node:
            self.result.append('null')
            return
        
        raw_value = self.navigator.get_node_data_as_string(node_index)
        
        # Apply type hint
        if node.type_hint == ValueHint.NUMBER:
            try:
                self.result.append(str(int(raw_value)))
            except ValueError:
                self.result.append('null')
        elif node.type_hint == ValueHint.FLOAT:
            try:
                self.result.append(str(float(raw_value)))
            except ValueError:
                self.result.append('null')
        elif node.type_hint == ValueHint.BOOLEAN:
            if raw_value.lower() == 'true':
                self.result.append('true')
            elif raw_value.lower() == 'false':
                self.result.append('false')
            else:
                self.result.append('null')
        elif node.type_hint == ValueHint.NULL:
            self.result.append('null')
        else:
            # String or no type hint
            self.result.append(json.dumps(raw_value))