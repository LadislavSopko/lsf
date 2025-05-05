export interface LSFNode {
  type: number;          // 0=object, 1=field, 2=value
  nameStart: number;     // Position in buffer where name starts
  nameLength: number;    // Length of name in bytes
  valueStart: number;    // Position in buffer where value starts
  valueLength: number;   // Length of value in bytes
  children: number[];    // Indices of child nodes
  typeHint: number;      // Type hint character code (0 if none)
}

export interface TokenInfo {
  type: number;          // Token type (using character code for efficiency)
  position: number;      // Position in buffer
}

// Forward declaration for DOMNavigator if needed later
export interface DOMNavigator {
    // Define methods based on DOMNavigator class
    getName(nodeIndex: number): string;
    getValue(nodeIndex: number): string;
    getChildren(nodeIndex: number): number[];
    getRawValue(nodeIndex: number): {start: number, length: number};
    getType(nodeIndex: number): number;
    getTypeHint(nodeIndex: number): number;
    // Add private getNode maybe? Or keep it internal to class?
    // Probably keep internal, interface is the public API.
}

export interface ParseResult {
  root: number;          // Index of root node
  nodes: LSFNode[];      // All nodes
  buffer: Uint8Array;    // Original buffer (zero-copy)
  navigator: DOMNavigator; // Now references the interface with methods
}
