"""DOM navigator for LSF format."""
from typing import List, Optional, Union
from .types import LSFNode, TokenType


class DOMNavigator:
    """Provides navigation methods for LSF DOM."""
    
    def __init__(self, buffer: bytes, nodes: List[LSFNode]):
        """
        Initialize navigator.
        
        Args:
            buffer: Original input buffer
            nodes: List of LSF nodes from DOM builder
        """
        self.buffer = buffer
        self.nodes = nodes
    
    def get_node(self, node_index: int) -> Optional[LSFNode]:
        """Get node at specified index."""
        if 0 <= node_index < len(self.nodes):
            return self.nodes[node_index]
        return None
    
    def get_node_data(self, node_index: int) -> bytes:
        """Get raw data bytes for a node."""
        node = self.get_node(node_index)
        if not node or node.data_length == 0:
            return b''
        return self.buffer[node.data_position:node.data_position + node.data_length]
    
    def get_node_data_as_string(self, node_index: int) -> str:
        """Get node data as UTF-8 string."""
        data = self.get_node_data(node_index)
        return data.decode('utf-8', errors='replace')
    
    def get_children_indices(self, node_index: int) -> List[int]:
        """Get indices of child nodes."""
        node = self.get_node(node_index)
        return node.children_indices if node else []
    
    def get_root_indices(self) -> List[int]:
        """Get all root node indices (nodes with parent_index == -1)."""
        roots = []
        for i, node in enumerate(self.nodes):
            if node.parent_index == -1:
                roots.append(i)
        return roots
    
    def accept(self, visitor, node_index: int):
        """Accept a visitor for the given node."""
        node = self.get_node(node_index)
        if not node:
            return
            
        if node.type == TokenType.OBJECT:
            visitor.visit_object(node_index)
        elif node.type == TokenType.FIELD:
            visitor.visit_field(node_index)
        elif node.type == TokenType.VALUE:
            visitor.visit_value(node_index)