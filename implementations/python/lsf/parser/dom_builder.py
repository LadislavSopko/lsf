"""DOM builder for LSF format."""
from typing import List, Union, Optional, Tuple
from .types import TokenInfo, TokenType, LSFNode, ParseResult, ValueHint
from .token_scanner import TokenScanner


class DOMBuilder:
    """Builds a DOM tree from LSF tokens."""
    
    @staticmethod
    def build(tokens: List[TokenInfo], buffer: bytes) -> ParseResult:
        """
        Build DOM from tokens.
        
        Args:
            tokens: List of tokens from scanner
            buffer: Original input buffer
            
        Returns:
            ParseResult with nodes or error
        """
        if not tokens:
            return ParseResult(success=True, nodes=[])
            
        nodes: List[LSFNode] = []
        current_object_index = -1
        current_field_index = -1
        orphaned_type_hint: Optional[Tuple[TokenInfo, int]] = None
        
        for token in tokens:
            if token.type == TokenType.OBJECT:
                # Create object node
                node = LSFNode(
                    type=TokenType.OBJECT,
                    parent_index=-1,
                    token_position=token.position,
                    data_position=token.data_start,
                    data_length=token.data_length,
                    type_hint=ValueHint.NONE,
                    children_indices=[]
                )
                node_index = len(nodes)
                nodes.append(node)
                current_object_index = node_index
                current_field_index = -1
                
            elif token.type == TokenType.FIELD:
                # Need a current object
                if current_object_index == -1:
                    # Create implicit object
                    implicit_obj = LSFNode(
                        type=TokenType.OBJECT,
                        parent_index=-1,
                        token_position=token.position,
                        data_position=0,
                        data_length=0,
                        type_hint=ValueHint.NONE,
                        children_indices=[]
                    )
                    current_object_index = len(nodes)
                    nodes.append(implicit_obj)
                
                # Create field node
                node = LSFNode(
                    type=TokenType.FIELD,
                    parent_index=current_object_index,
                    token_position=token.position,
                    data_position=token.data_start,
                    data_length=token.data_length,
                    type_hint=ValueHint.NONE,
                    children_indices=[]
                )
                node_index = len(nodes)
                nodes.append(node)
                
                # Add to parent's children
                nodes[current_object_index].children_indices.append(node_index)
                current_field_index = node_index
                
            elif token.type == TokenType.VALUE:
                # Need a current field
                if current_field_index == -1:
                    # Create implicit field
                    if current_object_index == -1:
                        # Also need implicit object
                        implicit_obj = LSFNode(
                            type=TokenType.OBJECT,
                            parent_index=-1,
                            token_position=token.position,
                            data_position=0,
                            data_length=0,
                            type_hint=ValueHint.NONE,
                            children_indices=[]
                        )
                        current_object_index = len(nodes)
                        nodes.append(implicit_obj)
                    
                    implicit_field = LSFNode(
                        type=TokenType.FIELD,
                        parent_index=current_object_index,
                        token_position=token.position,
                        data_position=0,
                        data_length=0,
                        type_hint=ValueHint.NONE,
                        children_indices=[]
                    )
                    current_field_index = len(nodes)
                    nodes.append(implicit_field)
                    nodes[current_object_index].children_indices.append(current_field_index)
                
                # Create value node
                node = LSFNode(
                    type=TokenType.VALUE,
                    parent_index=current_field_index,
                    token_position=token.position,
                    data_position=token.data_start,
                    data_length=token.data_length,
                    type_hint=ValueHint.NONE,
                    children_indices=[]
                )
                node_index = len(nodes)
                
                # Don't apply orphaned type hints
                
                nodes.append(node)
                nodes[current_field_index].children_indices.append(node_index)
                
            elif token.type == TokenType.TYPE_HINT:
                # Apply to previous value node if exists
                if nodes and nodes[-1].type == TokenType.VALUE:
                    if token.data_length > 0:
                        hint_char = buffer[token.data_start]
                        nodes[-1].type_hint = ValueHint(hint_char)
                else:
                    # Orphaned type hint
                    orphaned_type_hint = (token, len(nodes) - 1)
        
        return ParseResult(success=True, nodes=nodes)