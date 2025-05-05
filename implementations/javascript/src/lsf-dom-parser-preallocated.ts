/**
 * LSF Two-Pass DOM Parser with Pre-allocated Arrays
 * Maximum performance through upfront memory allocation
 */

// Constants
const CHAR = {
  DOLLAR: 36,
  TILDE: 126,
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
export interface ValueSpan {
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
    let currentPos = 0;
    this.tokenCount = 0;

    while (currentPos + 2 < len) {
      if (this.buffer[currentPos] === CHAR.DOLLAR && this.buffer[currentPos + 2] === CHAR.TILDE) {
        const tokenChar = this.buffer[currentPos + 1];
        const tokenStart = currentPos;

        this.tokens[this.tokenCount] = tokenChar;
        this.tokenPositions[this.tokenCount] = tokenStart;
        this.tokenCount++;
        
        currentPos = tokenStart + 3; // Jump position to after the token
      } else {
        currentPos++;
      }
    }
  }
  
  /**
   * Pass 2: Build DOM with pre-allocated nodes
   */
  private buildDOM(): number {
    if (this.tokenCount === 0) return -1;
    
    const nodeStack: number[] = [];
    let currentObject = -1;
    let rootNode = -1;
    let tokenPos = 0;
    const bufferEnd = this.buffer.length;

    this.nodeCount = 0;
    this.valueCount = 0;
    this.childrenCount = 0;
    
    while (tokenPos < this.tokenCount) {
      const tokenType = this.tokens[tokenPos];
      const tokenStart = this.tokenPositions[tokenPos];
      const dataStart = tokenStart + 3; // Data always starts after the 3-byte delimiter
      
      // Determine the end position for data following this token
      const nextTokenStart = (tokenPos + 1 < this.tokenCount) ? this.tokenPositions[tokenPos + 1] : bufferEnd;
      let dataLength = nextTokenStart - dataStart;
      if (dataLength < 0) dataLength = 0;

      switch (tokenType) {
        case CHAR.O: { // Object ($o~)
          const nodeIndex = this.allocateNode();
          const node = this.nodes[nodeIndex];
          node.type = 0; // object
          node.childrenStart = this.childrenCount;
          node.childrenCount = 0;
          
          // Object name is the data following this $o~ token
          node.nameStart = dataStart;
          node.nameLength = dataLength;
          
          if (rootNode === -1) rootNode = nodeIndex;
          if (nodeStack.length > 0) this.addChild(nodeStack[nodeStack.length - 1], nodeIndex);
          
          nodeStack.push(nodeIndex);
          currentObject = nodeIndex;
          tokenPos++;
          break;
        }
        
        case CHAR.F: { // Field separator ($f~)
          if (currentObject < 0 || tokenPos === 0) { // Field outside object or $f~ is first token
              tokenPos++;
              break; 
          }
          
          // Field KEY is the data between the previous token's end and this token's start
          const prevTokenEnd = this.tokenPositions[tokenPos - 1] + 3;
          const keyDataStart = prevTokenEnd;
          let keyDataLength = tokenStart - keyDataStart;
          if (keyDataLength < 0) keyDataLength = 0;
                    
          if (keyDataLength <= 0) { // No key between tokens?
              tokenPos++; 
              break; 
          }

          const fieldIndex = this.allocateNode();
          const field = this.nodes[fieldIndex];
          field.type = 1; // field
          field.nameStart = keyDataStart;
          field.nameLength = keyDataLength;
          field.childrenStart = this.childrenCount;
          field.childrenCount = 0;
          
          // Field VALUE is the data AFTER THIS $f~ token (or a list/typed value)
          const valueNodeIndex = this.allocateNode();
          const valueNode = this.nodes[valueNodeIndex];
          const valueDataStart = dataStart;
          // Use the dataLength calculated at the start of the loop for the data following $f~
          let valueDataLength = dataLength; 

          // Check next token to see if it's a list or type hint
          const nextTokenPos = tokenPos + 1;
          if (nextTokenPos < this.tokenCount) {
              const nextTokenType = this.tokens[nextTokenPos];
              const nextTokenActualStart = this.tokenPositions[nextTokenPos]; // Use the actual start pos
              
              if (nextTokenType === CHAR.L) { // LIST
                  valueNode.type = 3; // list
                  // List content starts after $f~ (valueDataStart) and ends before $l~ (nextTokenActualStart)
                  let listContentLength = nextTokenActualStart - valueDataStart;
                  if (listContentLength < 0) listContentLength = 0;
                  const list = this.parseListSpans(valueDataStart, listContentLength, nextTokenPos); // Pass start index of first $l~
                  valueNode.valueStart = valueDataStart; // Span of the raw list content area
                  valueNode.valueLength = listContentLength;
                  valueNode.childrenStart = list.spanStart; // Indices into value spans array
                  valueNode.childrenCount = list.spanCount;
                  tokenPos = list.nextTokenPos; // Advance past the list
              } else if (nextTokenType === CHAR.T) { // TYPE HINT
                  valueNode.type = 2; // value
                  // Value data is between $f~ and $t~
                  valueNode.valueStart = valueDataStart;
                  let typedValueLength = nextTokenActualStart - valueDataStart;
                  valueNode.valueLength = typedValueLength < 0 ? 0 : typedValueLength;
                  
                  // Type hint character is data AFTER the $t~ token
                  const typeHintDataStart = nextTokenActualStart + 3;
                  const typeHintNextTokenStart = (nextTokenPos + 1 < this.tokenCount) ? this.tokenPositions[nextTokenPos + 1] : bufferEnd;
                  let typeHintDataLength = typeHintNextTokenStart - typeHintDataStart;
                  if (typeHintDataLength > 0) {
                      valueNode.typeHint = this.buffer[typeHintDataStart];
                  } else {
                      valueNode.typeHint = 0; // No type hint char found
                  }
                  tokenPos = nextTokenPos + 1; // Skip $f~ token AND $t~ token
              } else { // SIMPLE VALUE (next token is $r~ or another $f~)
                  valueNode.type = 2; // value
                  valueNode.valueStart = valueDataStart;
                  valueNode.valueLength = valueDataLength; // Use length calculated at loop start
                  tokenPos++; // Skip $f~ token
              }
          } else { // $f~ is last token - simple value
              valueNode.type = 2; // value
              valueNode.valueStart = valueDataStart;
              valueNode.valueLength = dataLength; // Use length calculated at loop start
              tokenPos++; // Skip $f~ token
          }
          
          this.addChild(fieldIndex, valueNodeIndex);
          this.addChild(currentObject, fieldIndex);
          break;
        }
        
        case CHAR.R: { // Record end ($r~)
          if (nodeStack.length > 0) {
             const topNodeIndex = nodeStack[nodeStack.length - 1];
             if (this.nodes[topNodeIndex].type === 0) { // Ensure it's an object
                 nodeStack.pop();
                 currentObject = nodeStack.length > 0 ? nodeStack[nodeStack.length - 1] : -1;
             }
          }
          tokenPos++;
          break;
        }
        
        // Other tokens ($v~, $t~, $l~) are generally skipped here
        // as their data/effect is handled when processing the preceding $f~ or $o~
        default: 
          tokenPos++;
          break;
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
   * Parse list items and store their spans.
   * listContentLength is length of the segment between $f~ (exclusive) and first $l~ (exclusive).
   * firstListTokenIndex is the index of that first $l~ token in the tokens array.
   */
  private parseListSpans(listContentStart: number, listContentLength: number, firstListTokenIndex: number): { spanStart: number; spanCount: number; nextTokenPos: number } {
    const spanStartIndex = this.valueCount;
    let currentTokenIndex = firstListTokenIndex;
    let lastItemStart = listContentStart; // First item starts where the list content segment starts
    const listContentEnd = listContentStart + listContentLength; // Calculate absolute end

    while (currentTokenIndex < this.tokenCount) {
      const tokenType = this.tokens[currentTokenIndex];
      const tokenStart = this.tokenPositions[currentTokenIndex];

      if (tokenType === CHAR.L) { // List item separator ($l~)
        // Data for the previous item ends here
        let itemLength = tokenStart - lastItemStart;
        if (itemLength > 0) {
            this.allocateValueSpan(lastItemStart, itemLength);
        }
        lastItemStart = tokenStart + 3; // Next item starts after this $l~
        currentTokenIndex++;
      } else { 
        // Any other token ($f~, $r~, $t~, $o~, etc.) terminates the list parsing.
        break; 
      }
    }

    // Process the last item (data between last $l~ start and the start of the terminating token)
    const terminatorTokenStart = (currentTokenIndex < this.tokenCount) ? this.tokenPositions[currentTokenIndex] : this.buffer.length;
    let lastItemLength = terminatorTokenStart - lastItemStart;
    if (lastItemLength > 0) {
        this.allocateValueSpan(lastItemStart, lastItemLength);
    }
    
    // currentTokenIndex is the index of the token that terminated the list
    return {
      spanStart: spanStartIndex,
      spanCount: this.valueCount - spanStartIndex,
      nextTokenPos: currentTokenIndex 
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
// Define a more detailed return type
export interface LSFParseResult {
  navigator: LSFDOMNavigator;
  root: number;
  nodes: LSFNode[];
  values: ValueSpan[];
  nodeChildren: number[];
  buffer: Uint8Array;
}

export function parseLSF(input: string): LSFParseResult {
  const parser = new LSFDOMParser(input);
  const result = parser.parse(); // parse now returns { root: number }
  
  // Access internal arrays directly (consider getters if encapsulation is preferred)
  const nodes = (parser as any).nodes as LSFNode[];
  const values = (parser as any).values as ValueSpan[];
  const nodeChildren = (parser as any).nodeChildren as number[];
  const buffer = (parser as any).buffer as Uint8Array;
  
  return {
    navigator: new LSFDOMNavigator(nodes, buffer, nodeChildren),
    root: result.root,
    nodes: nodes,
    values: values,
    nodeChildren: nodeChildren,
    buffer: buffer
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