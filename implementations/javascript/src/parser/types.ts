/**
 * Represents a node in the LSF DOM tree
 */
export interface LSFNode {
  /** Node type: 0=object, 1=field, 2=value */
  type: number;
  /** Position in buffer where name starts */
  nameStart: number;
  /** Length of name in bytes */
  nameLength: number;
  /** Position in buffer where value starts */
  valueStart: number;
  /** Length of value in bytes */
  valueLength: number;
  /** Indices of child nodes */
  children: number[];
  /** Type hint character code (0 if none) */
  typeHint: number;
}

/**
 * Information about a parsed token
 */
export interface TokenInfo {
  /** Token type (using character code for efficiency) */
  type: number;
  /** Position in buffer */
  position: number;
}

/**
 * Interface for navigating the LSF DOM tree
 */
export interface DOMNavigator {
    /** Get the name of a node */
    getName(nodeIndex: number): string;
    /** Get the string value of a node */
    getValue(nodeIndex: number): string;
    /** Get child node indices */
    getChildren(nodeIndex: number): number[];
    /** Get raw value position and length in buffer */
    getRawValue(nodeIndex: number): {start: number, length: number};
    /** Get node type (0=object, 1=field, 2=value) */
    getType(nodeIndex: number): number;
    /** Get type hint character code */
    getTypeHint(nodeIndex: number): number;
}

/**
 * Result of parsing LSF data
 */
export interface ParseResult {
  /** Index of root node */
  root: number;
  /** All nodes in the DOM tree */
  nodes: LSFNode[];
  /** Original buffer (zero-copy) */
  buffer: Uint8Array;
  /** Navigator for traversing the DOM tree */
  navigator: DOMNavigator;
}
