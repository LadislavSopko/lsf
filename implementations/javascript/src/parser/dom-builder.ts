import { LSFNode, ParseResult, TokenInfo, DOMNavigator } from './types';
import { TokenScanResult, TokenScanner } from './token-scanner';
import { DOMNavigator as DOMNavigatorClass } from './dom-navigator'; // Import the actual navigator

// Re-define CHAR_CODE or import from token-scanner if exported
const CHAR_CODE = {
  O: 111, // o
  F: 102, // f
  V: 118, // v
  T: 116, // t
};

// Constants for node types (Export this)
export const NODE_TYPE = {
  OBJECT: 0,
  FIELD: 1,
  VALUE: 2,
};

export class DOMBuilder {
  private nodes!: LSFNode[];
  private nodeCount: number = 0;
  private nodeCapacity: number = 0;

  private tokens!: TokenScanResult;
  private buffer!: Uint8Array;
  
  private static NODE_ESTIMATE_FACTOR = 1.5;
  private static MIN_CAPACITY = 256;

  private currentObjectNodeIndex = -1;
  private currentFieldNodeIndex = -1;
  private lastValueNodeIndex = -1;
  private topLevelNodeIndices: number[] = [];

  constructor(tokenResult: TokenScanResult) {
    this.tokens = tokenResult;
    this.buffer = tokenResult.buffer;

    this.nodeCapacity = Math.max(DOMBuilder.MIN_CAPACITY, Math.ceil(tokenResult.count * DOMBuilder.NODE_ESTIMATE_FACTOR));

    this.nodes = new Array(this.nodeCapacity);
    for (let i = 0; i < this.nodeCapacity; i++) {
        this.nodes[i] = { type: 0, nameStart: 0, nameLength: 0, valueStart: 0, valueLength: 0, children: [], typeHint: 0 };
    }
    
    this.resetState();
  }

  private resetState(): void {
      this.nodeCount = 0;
      this.topLevelNodeIndices = [];
      this.currentObjectNodeIndex = -1;
      this.currentFieldNodeIndex = -1;
      this.lastValueNodeIndex = -1;
  }

  // Helper to ensure an object context exists, creating anonymous if needed
  private ensureObjectContext(): void {
      if (this.currentObjectNodeIndex === -1) {
          const implicitObjIndex = this.allocateNode();
          const node = this.nodes[implicitObjIndex]; // Get ref after potential grow
          node.type = NODE_TYPE.OBJECT;
          node.nameStart = 0; // Indicate anonymous
          node.nameLength = 0;
          this.topLevelNodeIndices.push(implicitObjIndex);
          this.currentObjectNodeIndex = implicitObjIndex;
          this.currentFieldNodeIndex = -1; // Reset field context for new object
          this.lastValueNodeIndex = -1;
      }
  }

  // Helper to ensure a field context exists, creating default if needed
  private ensureFieldContext(): void {
      this.ensureObjectContext(); // First, ensure we are inside an object
      if (this.currentFieldNodeIndex === -1) {
          const implicitFieldIndex = this.allocateNode();
          const node = this.nodes[implicitFieldIndex]; // Get ref after potential grow
          node.type = NODE_TYPE.FIELD;
          node.nameStart = 0; // Indicate implicit/default field
          node.nameLength = 0;
          this.addChild(this.currentObjectNodeIndex, implicitFieldIndex);
          this.currentFieldNodeIndex = implicitFieldIndex;
          this.lastValueNodeIndex = -1; // Reset value context for new field
      }
  }

  buildDOM(): ParseResult {
    if (this.tokens.count === 0) {
        // Need a way to return ParseResult with a null/dummy navigator?
        // Or maybe navigator constructor handles empty nodes array.
        const emptyResult: Omit<ParseResult, 'navigator'> = { root: -1, nodes: [], buffer: this.buffer };
        // Cast needed because TS can't know navigator constructor handles this.
        // Or refactor constructor/return type.
        const navigator = new DOMNavigatorClass(emptyResult as ParseResult); 
        return { ...emptyResult, navigator };
    }

    this.resetState(); // Reset state for build

    for (let i = 0; i < this.tokens.count; i++) {
        const currentTokenType = this.tokens.types[i];
        const currentTokenPos = this.tokens.positions[i];

        // Determine content span using <token><data> strategy
        const contentStart = currentTokenPos + 3; // Start after token like $o~
        const nextTokenPos = (i + 1 < this.tokens.count) ? this.tokens.positions[i + 1] : this.buffer.length;
        const contentEnd = nextTokenPos;
        const contentLength = Math.max(0, contentEnd - contentStart); // Ensure non-negative

        switch (currentTokenType) {
            case CHAR_CODE.O: { // $o~
                const newNodeIndex = this.allocateNode();
                const node = this.nodes[newNodeIndex];
                node.type = NODE_TYPE.OBJECT;
                node.nameStart = contentStart;
                node.nameLength = contentLength;
                
                this.topLevelNodeIndices.push(newNodeIndex);
                this.currentObjectNodeIndex = newNodeIndex;
                this.currentFieldNodeIndex = -1; // Reset context
                this.lastValueNodeIndex = -1;
                break;
            }
            case CHAR_CODE.F: { // $f~
                this.ensureObjectContext(); // Ensure we have an object
                const newNodeIndex = this.allocateNode();
                const node = this.nodes[newNodeIndex];
                node.type = NODE_TYPE.FIELD;
                node.nameStart = contentStart;
                node.nameLength = contentLength;
                
                this.addChild(this.currentObjectNodeIndex, newNodeIndex);
                this.currentFieldNodeIndex = newNodeIndex;
                this.lastValueNodeIndex = -1; // Reset context
                break;
            }
            case CHAR_CODE.V: { // $v~
                this.ensureFieldContext(); // Ensure we have object and field
                const newNodeIndex = this.allocateNode();
                const node = this.nodes[newNodeIndex];
                node.type = NODE_TYPE.VALUE;
                node.valueStart = contentStart;
                node.valueLength = contentLength;
                
                this.addChild(this.currentFieldNodeIndex, newNodeIndex);
                this.lastValueNodeIndex = newNodeIndex; // Track this value node
                break;
            }
            case CHAR_CODE.T: { // $t~
                if (this.lastValueNodeIndex !== -1) {
                    const valueNode = this.nodes[this.lastValueNodeIndex];
                    // Type hint is the single byte immediately following $t~
                    // But contentStart/Length refers to text BETWEEN $t~ and next token
                    const typeHintCharPos = currentTokenPos + 3; // Position right after $t~
                    if (typeHintCharPos < this.buffer.length) { 
                         // Check if the hint char itself is part of the next token's marker
                         if (typeHintCharPos < nextTokenPos) {
                             const typeHintByte = this.buffer[typeHintCharPos];
                             const typeChar = String.fromCharCode(typeHintByte);
                             
                             // Validate type hint according to LSF spec
                             if (typeChar === 'n' || typeChar === 'f' || typeChar === 'b' || 
                                 typeChar === 'd' || typeChar === 's' || typeChar === 'z') {
                                 valueNode.typeHint = typeHintByte;
                             } else {
                                 throw new Error(`Invalid type hint '${typeChar}' at position ${typeHintCharPos}. Valid types are: n, f, b, d, s`);
                             }
                         } else {
                             console.warn(`Type hint character position overlaps with next token at index ${i}. Hint ignored.`);
                         }
                    } else {
                        console.warn(`Incomplete type hint at end of buffer, index ${i}. Hint ignored.`);
                    }
                } else {
                    console.warn(`Standalone $t~ token encountered at position ${currentTokenPos}, index ${i}. Ignoring.`);
                }
                this.lastValueNodeIndex = -1; // $t~ always resets the last value context
                break;
            }
        }
    }

    // Trim nodes array first
    const finalNodes = this.nodes.slice(0, this.nodeCount);
    const rootIndex = this.topLevelNodeIndices.length > 0 ? this.topLevelNodeIndices[0] : -1;

    // Prepare the result data needed by the navigator
    const resultDataForNavigator: Omit<ParseResult, 'navigator'> = {
        root: rootIndex,
        nodes: finalNodes,
        buffer: this.buffer,
    };

    // Instantiate the real navigator
    // We need to cast here because the object doesn't have the navigator property yet.
    const navigator = new DOMNavigatorClass(resultDataForNavigator as ParseResult);

    // Return the complete ParseResult including the navigator
    return {
      root: rootIndex,
      nodes: finalNodes,
      buffer: this.buffer,
      navigator: navigator, 
    };
  }

  private allocateNode(): number {
    if (this.nodeCount >= this.nodeCapacity) {
      this.growNodeArray();
    }
    const newNodeIndex = this.nodeCount++;
    // Re-initialize node to default state after potential grow
    const node = this.nodes[newNodeIndex];
    node.type = 0; node.nameStart = 0; node.nameLength = 0; node.valueStart = 0;
    node.valueLength = 0; 
    node.children = []; // Initialize children array
    node.typeHint = 0;
    return newNodeIndex;
  }

  private addChild(parentIndex: number, childIndex: number): void {
    if (parentIndex < 0 || parentIndex >= this.nodeCount || childIndex < 0 || childIndex >= this.nodeCount) {
        console.error(`[addChild] Invalid index. Parent: ${parentIndex}, Child: ${childIndex}, NodeCount: ${this.nodeCount}`);
        return;
    }
    
    const parentNode = this.nodes[parentIndex];
    parentNode.children.push(childIndex); // Add to parent's own list
  }
  
  private growNodeArray(): void {
    const oldCapacity = this.nodeCapacity;
    this.nodeCapacity *= 2;
    console.log(`Growing node array from ${oldCapacity} to ${this.nodeCapacity}`);
    const newNodes = new Array(this.nodeCapacity);
    for(let i = 0; i < oldCapacity; i++) {
        newNodes[i] = this.nodes[i];
    }
    for (let i = oldCapacity; i < this.nodeCapacity; i++) {
        // Initialize new slots
        newNodes[i] = { type: 0, nameStart: 0, nameLength: 0, valueStart: 0, valueLength: 0, children: [], typeHint: 0 };
    }
    this.nodes = newNodes;
  }
} 