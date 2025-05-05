export interface LSFNode {
  type: number;          // 0=object, 1=field, 2=value
  nameStart: number;     // Position in buffer where name starts
  nameLength: number;    // Length of name in bytes
  valueStart: number;    // Position in buffer where value starts
  valueLength: number;   // Length of value in bytes
  childrenStart: number; // Index into children array
  childrenCount: number; // Number of children
  typeHint: number;      // Type hint character code (0 if none)
}

export interface TokenInfo {
  type: number;          // Token type (using character code for efficiency)
  position: number;      // Position in buffer
}

// Forward declaration for DOMNavigator if needed later
export interface DOMNavigator {
    // Define methods later
}

export interface ParseResult {
  root: number;          // Index of root node
  nodes: LSFNode[];      // All nodes
  nodeChildren: number[];// Flat array of child indices
  buffer: Uint8Array;    // Original buffer (zero-copy)
  navigator: DOMNavigator; // Navigator for easy access
}
