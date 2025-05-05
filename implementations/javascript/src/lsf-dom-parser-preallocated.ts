/**
 * LSF Two-Pass DOM Parser with Pre-allocated Arrays
 * Maximum performance through upfront memory allocation
 */

// Constants
const CHAR = {
  DOLLAR: 36,
  SECTION: 167,
  O: 111, F: 102, R: 114, L: 108, T: 116, V: 118,
  N: 110, B: 98, D: 100, S: 115
} as const;

// Pre-calculated estimates for memory allocation
const ESTIMATE = {
  TOKENS_PER_KB: 100,    // Rough estimate of tokens per KB
  NODES_PER_TOKEN: 0.3,  // Rough estimate of DOM nodes per token
  VALUES_PER_NODE: 0.7,  // Rough estimate of values per node
} as const;

// Value span with type hints
interface ValueSpan {
  start: number;
  length: number;
  // Lazy accessors (moved to separate calls for clarity)
}

// Node with pre-allocated children
export interface LSFNode {
  type: number;  // Using number for speed: 0=object, 1=field, 2=value, 3=list
  nameStart: number;
  nameLength: number;
  valueStart: number;
  valueLength: number;
  childrenStart: number;
  childrenCount: number;
  typeHint: number; // 0=none, n=110, f=102, b=98, d=100
}

/**
 * Ultra-fast pre-allocated LSF parser
 */
export class LSFDOMParser {
  private buffer: Uint8Array;
  private textDecoder = new TextDecoder();
  
  // Pre-allocated arrays
  private tokens: number[];        // Fixed-size token type array
  private tokenPositions: number[]; // Token positions
  private nodes: LSFNode[];        // Pre-allocated node array
  private values: ValueSpan[];     // Pre-allocated value spans
  private nodeChildren: number[];  // Pre-allocated children indices
  
  // Counters
  private tokenCount = 0;
  private nodeCount = 0;
  private valueCount = 0;
  private childrenCount = 0;
  
  constructor(input: string) {
    this.buffer = new TextEncoder().encode(input);
    
    // Estimate sizes based on input length
    const inputKB = Math.ceil(this.buffer.length / 1024);
    const tokenEstimate = inputKB * ESTIMATE.TOKENS_PER_KB;
    const nodeEstimate = Math.ceil(tokenEstimate * ESTIMATE.NODES_PER_TOKEN);
    const valueEstimate = Math.ceil(nodeEstimate * ESTIMATE.VALUES_PER_NODE);
    
    // Pre-allocate arrays
    this.tokens = new Array(tokenEstimate);
    this.tokenPositions = new Array(tokenEstimate);
    this.nodes = new Array(nodeEstimate);
    this.values = new Array(valueEstimate);
    this.nodeChildren = new Array(nodeEstimate * 10); // Average 10 children per node
    
    // Initialize node slots
    for (let i = 0; i < nodeEstimate; i++) {
      this.nodes[i] = {
        type: 0,
        nameStart: 0,
        nameLength: 0,
        valueStart: 0,
        valueLength: 0,
        childrenStart: 0,
        childrenCount: 0,
        typeHint: 0
      };
    }
  }
  
  /**
   * Parse in two passes with pre-allocated arrays
   */
  parse(): { root: number; nodes: LSFNode[]; buffer: Uint8Array } {
    this.tokenize();
    const root = this.buildDOM();
    
    return {
      root,
      nodes: this.nodes,
      buffer: this.buffer
    };
  }
  
  /**
   * Pass 1: Fast tokenization with minimal allocations
   */
  private tokenize(): void {
    const len = this.buffer.length;
    let pos = 0;
    this.tokenCount = 0;
    
    while (pos + 2 < len) {
      if (this.buffer[pos] === CHAR.DOLLAR && this.buffer[pos + 2] === CHAR.SECTION) {
        const tokenChar = this.buffer[pos + 1];
        
        // Store token type and position
        this.tokens[this.tokenCount] = tokenChar;
        this.tokenPositions[this.tokenCount] = pos;
        this.tokenCount++;
        
        // Grow arrays if needed (unlikely)
        if (this.tokenCount >= this.tokens.length) {
          this.growTokenArrays();
        }
      }
      pos++;
    }
  }
  
  /**
   * Pass 2: Build DOM with pre-allocated nodes
   */
  private buildDOM(): number {
    if (this.tokenCount === 0) return -1;
    
    const nodeStack: number[] = [];
    let currentObject = -1;
    let currentField = -1;
    let rootNode = -1;
    let tokenPos = 0;
    
    this.nodeCount = 0;
    this.valueCount = 0;
    this.childrenCount = 0;
    
    while (tokenPos < this.tokenCount) {
      const token = this.tokens[tokenPos];
      const tokenStart = this.tokenPositions[tokenPos];
      
      switch (token) {
        case CHAR.O: { // Object ($o§)
          const nodeIndex = this.allocateNode();
          const node = this.nodes[nodeIndex];
          
          node.type = 0; // object
          node.childrenStart = this.childrenCount;
          node.childrenCount = 0;
          
          // Find object name
          const nameStart = tokenStart + 3;
          const nameEnd = this.findNextTokenPos(tokenPos + 1, CHAR.R);
          node.nameStart = nameStart;
          node.nameLength = nameEnd - nameStart;
          
          // Set as root if first object
          if (rootNode === -1) {
            rootNode = nodeIndex;
          }
          
          // Add to parent if exists
          if (nodeStack.length > 0) {
            this.addChild(nodeStack[nodeStack.length - 1], nodeIndex);
          }
          
          nodeStack.push(nodeIndex);
          currentObject = nodeIndex;
          
          // Skip to after $r§
          tokenPos = this.findNextTokenIndex(tokenPos + 1, CHAR.R) + 1;
          break;
        }
        
        case CHAR.F: { // Field separator ($f§)
          if (currentField >= 0) {
            // Find value
            const valueStart = tokenStart + 3;
            const nextToken = this.findNextValueToken(tokenPos + 1);
            
            const valueNode = this.allocateNode();
            const field = this.nodes[currentField];
            
            if (nextToken.type === CHAR.L) { // List
              const listValueNode = this.nodes[valueNode];
              listValueNode.type = 3; // list
              const list = this.parseListSpans(valueStart, tokenPos + 1);
              listValueNode.valueStart = valueStart;
              listValueNode.valueLength = list.end - valueStart;
              listValueNode.childrenStart = list.spanStart;
              listValueNode.childrenCount = list.spanCount;
              tokenPos = list.nextTokenPos;
            } else { // Single value
              const singleValueNode = this.nodes[valueNode];
              singleValueNode.type = 2; // value
              singleValueNode.valueStart = valueStart;
              singleValueNode.valueLength = nextToken.pos - valueStart;
              
              // Check for type hint
              if (nextToken.type === CHAR.T) {
                const typePos = nextToken.pos + 3;
                singleValueNode.typeHint = this.buffer[typePos];
                tokenPos = this.findNextTokenIndex(this.tokens.indexOf(nextToken.type, tokenPos), CHAR.R) + 1;
              } else {
                const currentNextTokenIndex = this.tokens.indexOf(nextToken.type, tokenPos);
                tokenPos = currentNextTokenIndex + 1;
              }
            }
            
            this.addChild(currentField, valueNode);
            this.addChild(currentObject, currentField);
            currentField = -1;
          } else {
            tokenPos++;
          }
          break;
        }
        
        case CHAR.R: { // Record end ($r§)
          if (nodeStack.length > 0 && this.nodes[nodeStack[nodeStack.length - 1]].type === 0) {
            nodeStack.pop();
            currentObject = nodeStack.length > 0 ? nodeStack[nodeStack.length - 1] : -1;
          }
          tokenPos++;
          break;
        }
        
        case CHAR.V: { // Version - skip
          tokenPos = this.findNextTokenIndex(tokenPos + 1, CHAR.R) + 1;
          break;
        }
        
        default:
          tokenPos++;
          break;
      }
      
      // Check for field key between tokens
      const key = this.findKeyBetweenTokens(tokenPos - 1, tokenPos);
      if (key && currentObject >= 0) {
        currentField = this.allocateNode();
        const field = this.nodes[currentField];
        field.type = 1; // field
        field.nameStart = key.start;
        field.nameLength = key.length;
        field.childrenStart = this.childrenCount;
        field.childrenCount = 0;
      }
    }
    
    return rootNode;
  }
  
  /**
   * Allocate a new node from pre-allocated array
   */
  private allocateNode(): number {
    const index = this.nodeCount++;
    
    // Grow array if needed (unlikely)
    if (index >= this.nodes.length) {
      this.growNodeArray();
    }
    
    // Reset node
    const node = this.nodes[index];
    node.type = 0;
    node.nameStart = 0;
    node.nameLength = 0;
    node.valueStart = 0;
    node.valueLength = 0;
    node.childrenStart = 0;
    node.childrenCount = 0;
    node.typeHint = 0;
    
    return index;
  }
  
  /**
   * Add child to node
   */
  private addChild(parentIndex: number, childIndex: number): void {
    const parent = this.nodes[parentIndex];
    const childrenIndex = parent.childrenStart + parent.childrenCount;
    
    // Grow children array if needed
    if (childrenIndex >= this.nodeChildren.length) {
      this.growChildrenArray();
    }
    
    this.nodeChildren[childrenIndex] = childIndex;
    parent.childrenCount++;
  }
  
  /**
   * Helper methods for token searching
   */
  private findNextTokenPos(startPos: number, tokenType: number): number {
    for (let i = startPos; i < this.tokenCount; i++) {
      if (this.tokens[i] === tokenType) {
        return this.tokenPositions[i];
      }
    }
    return this.buffer.length;
  }
  
  private findNextTokenIndex(startPos: number, tokenType: number): number {
    for (let i = startPos; i < this.tokenCount; i++) {
      if (this.tokens[i] === tokenType) {
        return i;
      }
    }
    return this.tokenCount;
  }
  
  private findNextValueToken(startPos: number): { type: number; pos: number } {
    for (let i = startPos; i < this.tokenCount; i++) {
      const type = this.tokens[i];
      if (type === CHAR.R || type === CHAR.T || type === CHAR.L) {
        return { type, pos: this.tokenPositions[i] };
      }
    }
    return { type: 0, pos: this.buffer.length };
  }
  
  /**
   * Find the text content (key) between two token indices.
   */
  private findKeyBetweenTokens(prevTokenIndex: number, currentTokenIndex: number): { start: number; length: number } | null {
    if (prevTokenIndex < 0 || currentTokenIndex <= prevTokenIndex || currentTokenIndex >= this.tokenCount) {
      return null;
    }
    
    const start = this.tokenPositions[prevTokenIndex] + 3; // Position after the previous token's $x§
    const end = this.tokenPositions[currentTokenIndex];   // Position at the start of the current token's $x§
    
    if (start >= end) {
        return null; // No content between tokens
    }
    
    return { start, length: end - start };
  }
  
  /**
   * Parse list items and store their spans.
   */
  private parseListSpans(listStartPos: number, listTokenIndex: number): { spanStart: number; spanCount: number; end: number; nextTokenPos: number } {
    const spanStartIndex = this.valueCount;
    let currentTokenIndex = listTokenIndex;
    let lastPos = listStartPos;

    while (currentTokenIndex < this.tokenCount) {
      const tokenType = this.tokens[currentTokenIndex];
      const tokenPos = this.tokenPositions[currentTokenIndex];

      if (tokenType === CHAR.L) { // List item separator
        if (tokenPos > lastPos) { // Store span if content exists
          this.allocateValueSpan(lastPos, tokenPos - lastPos);
        }
        lastPos = tokenPos + 3; // Move past $l§
        currentTokenIndex++;
      } else if (tokenType === CHAR.F || tokenType === CHAR.R) { // End of list
        if (tokenPos > lastPos) { // Store last item span
          this.allocateValueSpan(lastPos, tokenPos - lastPos);
        }
        return {
          spanStart: spanStartIndex,
          spanCount: this.valueCount - spanStartIndex,
          end: tokenPos, // Position where list content ends
          nextTokenPos: currentTokenIndex // Index of the token that ended the list
        };
      } else {
        // Should not happen in a valid list, maybe throw error or log?
        currentTokenIndex++; // Skip unexpected token
      }
    }

    // Reached end of tokens unexpectedly
    if (this.buffer.length > lastPos) { // Store trailing content if any
      this.allocateValueSpan(lastPos, this.buffer.length - lastPos);
    }
    return {
      spanStart: spanStartIndex,
      spanCount: this.valueCount - spanStartIndex,
      end: this.buffer.length,
      nextTokenPos: this.tokenCount
    };
  }

  /**
   * Allocate a value span
   */
  private allocateValueSpan(start: number, length: number): number {
      const index = this.valueCount++;
      if (index >= this.values.length) {
          this.growValueArray();
      }
      this.values[index] = { start, length };
      return index;
  }
  
  /**
   * Array growth methods (rarely called)
   */
  private growTokenArrays(): void {
    const newSize = this.tokens.length * 2;
    const newTokens = new Array(newSize);
    const newPositions = new Array(newSize);
    
    for (let i = 0; i < this.tokenCount; i++) {
      newTokens[i] = this.tokens[i];
      newPositions[i] = this.tokenPositions[i];
    }
    
    this.tokens = newTokens;
    this.tokenPositions = newPositions;
  }
  
  private growNodeArray(): void {
    const newSize = this.nodes.length * 2;
    const newNodes = new Array(newSize);
    
    for (let i = 0; i < this.nodeCount; i++) {
      newNodes[i] = this.nodes[i];
    }
    
    // Initialize new slots
    for (let i = this.nodeCount; i < newSize; i++) {
      newNodes[i] = {
        type: 0, nameStart: 0, nameLength: 0,
        valueStart: 0, valueLength: 0,
        childrenStart: 0, childrenCount: 0,
        typeHint: 0
      };
    }
    
    this.nodes = newNodes;
  }
  
  private growChildrenArray(): void {
    const newSize = this.nodeChildren.length * 2;
    const newChildren = new Array(newSize);
    
    for (let i = 0; i < this.childrenCount; i++) {
      newChildren[i] = this.nodeChildren[i];
    }
    
    this.nodeChildren = newChildren;
  }
  
  private growValueArray(): void {
      const newSize = this.values.length * 2;
      const newValues = new Array(newSize);
      for (let i = 0; i < this.valueCount; i++) {
          newValues[i] = this.values[i];
      }
      this.values = newValues;
  }
}

/**
 * Helper class for navigating the DOM
 */
export class LSFDOMNavigator {
  constructor(
    private nodes: LSFNode[],
    private buffer: Uint8Array,
    private nodeChildren: number[],
    private textDecoder = new TextDecoder()
  ) {}
  
  /**
   * Get node name as string
   */
  getName(nodeIndex: number): string {
    const node = this.nodes[nodeIndex];
    return this.textDecoder.decode(
      this.buffer.subarray(node.nameStart, node.nameStart + node.nameLength)
    );
  }
  
  /**
   * Get node value as string
   */
  getValue(nodeIndex: number): string {
    const node = this.nodes[nodeIndex];
    return this.textDecoder.decode(
      this.buffer.subarray(node.valueStart, node.valueStart + node.valueLength)
    );
  }
  
  /**
   * Get children of a node
   */
  getChildren(nodeIndex: number): number[] {
    const node = this.nodes[nodeIndex];
    const children: number[] = [];
    
    const childrenStart = node.childrenStart;
    for (let i = 0; i < node.childrenCount; i++) {
      children.push(this.nodeChildren[childrenStart + i]);
    }
    
    return children;
  }
  
  /**
   * Get typed value
   */
  getTypedValue(nodeIndex: number): any {
    const node = this.nodes[nodeIndex];
    const value = this.getValue(nodeIndex);
    
    switch (node.typeHint) {
      case CHAR.N: return parseInt(value, 10);
      case CHAR.F: return parseFloat(value);
      case CHAR.B: return value.toLowerCase() === 'true';
      case CHAR.D: return new Date(value);
      default: return value;
    }
  }
}

/**
 * Public API
 */
export function parseLSF(input: string): { navigator: LSFDOMNavigator; root: number } {
  const parser = new LSFDOMParser(input);
  const result = parser.parse();
  
  // Access internal arrays (consider making them public or providing getters if preferred)
  const internalNodes = (parser as any).nodes as LSFNode[];
  const internalNodeChildren = (parser as any).nodeChildren as number[];
  const internalBuffer = (parser as any).buffer as Uint8Array;
  
  return {
    navigator: new LSFDOMNavigator(internalNodes, internalBuffer, internalNodeChildren),
    root: result.root
  };
}

// Usage example:
/*
const { navigator, root } = parseLSF(lsfString);

// Navigate DOM
const objectName = navigator.getName(root);
const children = navigator.getChildren(root);

// Get field value
const firstField = children[0];
const fieldKey = navigator.getName(firstField);
const fieldValueNode = navigator.getChildren(firstField)[0];
const fieldValue = navigator.getTypedValue(fieldValueNode);
*/