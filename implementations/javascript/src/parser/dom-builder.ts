import { LSFNode, ParseResult, TokenInfo, DOMNavigator } from './types';
import { TokenScanResult, TokenScanner } from './token-scanner';

// Re-define CHAR_CODE or import from token-scanner if exported
const CHAR_CODE = {
  O: 111, // o
  F: 102, // f
  V: 118, // v
  T: 116, // t
};

// Constants for node types
const NODE_TYPE = {
  OBJECT: 0,
  FIELD: 1,
  VALUE: 2,
};

export class DOMBuilder {
  private nodes!: LSFNode[];           // Pre-allocated array
  private nodeChildren!: number[];     // Pre-allocated flat array (Corrected type)
  private nodeCount: number = 0;
  private childrenCount: number = 0;
  private nodeCapacity: number = 0;
  private childrenCapacity: number = 0;

  private tokens!: TokenScanResult;
  private buffer!: Uint8Array;
  private tokenIndex: number = 0;

  // Constants for initial allocation estimation
  private static NODE_ESTIMATE_FACTOR = 1.5; // Guess: Nodes approx 1.5x tokens
  private static CHILDREN_ESTIMATE_FACTOR = 2; // Guess: Avg 2 children refs per node?
  private static MIN_CAPACITY = 256;

  constructor(tokenResult: TokenScanResult) {
    this.tokens = tokenResult;
    this.buffer = tokenResult.buffer;
    this.tokenIndex = 0;

    // Pre-allocate based on token count
    this.nodeCapacity = Math.max(DOMBuilder.MIN_CAPACITY, Math.ceil(tokenResult.count * DOMBuilder.NODE_ESTIMATE_FACTOR));
    this.childrenCapacity = Math.max(DOMBuilder.MIN_CAPACITY * 2, Math.ceil(this.nodeCapacity * DOMBuilder.CHILDREN_ESTIMATE_FACTOR));

    this.nodes = new Array(this.nodeCapacity).fill(null).map(() => ({ 
        type: 0, nameStart: 0, nameLength: 0, valueStart: 0, 
        valueLength: 0, childrenStart: -1, childrenCount: 0, typeHint: 0 
    })); // Initialize with default structure maybe? Or handle allocation differently.
    // Use a standard number array for flexibility, can optimize later if needed
    this.nodeChildren = new Array(this.childrenCapacity).fill(0);
    
    this.nodeCount = 0;
    this.childrenCount = 0;
  }

  buildDOM(): ParseResult {
    // TODO: Implement the core logic to process tokens and build the DOM
    // This will involve iterating through this.tokens, calling allocateNode, addChild,
    // and setting node properties based on token types and positions.

    // Placeholder: Need root node index
    const rootIndex = 0; 

    // Placeholder navigator
    const navigator: DOMNavigator = {
      // Implement navigator methods later
    };
    
    // Trim arrays before returning
    const finalNodes = this.nodes.slice(0, this.nodeCount);
    const finalChildren = this.nodeChildren.slice(0, this.childrenCount);

    return {
      root: rootIndex,
      nodes: finalNodes,
      nodeChildren: finalChildren,
      buffer: this.buffer,
      navigator: navigator, // Instantiate real navigator later
    };
  }

  private allocateNode(): number {
    if (this.nodeCount >= this.nodeCapacity) {
      this.growNodeArray();
    }
    const newNodeIndex = this.nodeCount++;
    // Initialize node properties (if not done in constructor)
    // this.nodes[newNodeIndex] = { ... default values ... };
    return newNodeIndex;
  }

  private addChild(parentIndex: number, childIndex: number): void {
    if (parentIndex < 0 || parentIndex >= this.nodeCount) {
        console.error(`Invalid parentIndex: ${parentIndex}`);
        return;
    }
    if (this.childrenCount >= this.childrenCapacity) {
      this.growChildrenArray();
    }

    const parentNode = this.nodes[parentIndex];
    if (parentNode.childrenStart === -1) {
      // First child
      parentNode.childrenStart = this.childrenCount;
    }
    // Ensure children are contiguous for this parent (important!)
    // This simple approach assumes children are added contiguously during build
    if (parentNode.childrenStart + parentNode.childrenCount !== this.childrenCount) {
        console.warn(`Non-contiguous child add detected for parent ${parentIndex}. Current childrenCount: ${this.childrenCount}, expected start: ${parentNode.childrenStart + parentNode.childrenCount}`);
        // Handle potential fragmentation or re-structure if needed, or rely on build order
    }
    
    this.nodeChildren[this.childrenCount++] = childIndex;
    parentNode.childrenCount++;
  }
  
  private growNodeArray(): void {
    const oldCapacity = this.nodeCapacity;
    this.nodeCapacity *= 2;
    console.log(`Growing node array from ${oldCapacity} to ${this.nodeCapacity}`);
    const newNodes = new Array(this.nodeCapacity).fill(null);
    // Copy existing nodes - Array.prototype.slice might be faster or System.arraycopy equivalent
    for(let i = 0; i < oldCapacity; i++) {
        newNodes[i] = this.nodes[i];
    }
    // Initialize new part if needed
    for (let i = oldCapacity; i < this.nodeCapacity; i++) {
        newNodes[i] = { type: 0, nameStart: 0, nameLength: 0, valueStart: 0, valueLength: 0, childrenStart: -1, childrenCount: 0, typeHint: 0 };
    }
    this.nodes = newNodes;
  }

  private growChildrenArray(): void {
    const oldCapacity = this.childrenCapacity;
    this.childrenCapacity *= 2;
    console.log(`Growing children array from ${oldCapacity} to ${this.childrenCapacity}`);
    const newChildren = new Array(this.childrenCapacity).fill(0); // Use standard array
    // Copy elements manually for standard array
    for(let i = 0; i < oldCapacity; i++) {
        newChildren[i] = this.nodeChildren[i];
    }
    // newChildren.set(this.nodeChildren); // set is for TypedArrays
    this.nodeChildren = newChildren;
  }
} 