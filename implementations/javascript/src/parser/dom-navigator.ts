import { LSFNode, ParseResult } from './types';

// Define the interface based on types.ts for clarity if not importing directly
// export interface DOMNavigator {
//     getName(nodeIndex: number): string;
//     getValue(nodeIndex: number): string;
//     getChildren(nodeIndex: number): number[];
//     getRawValue(nodeIndex: number): {start: number, length: number};
//     getType(nodeIndex: number): number;
//     getTypeHint(nodeIndex: number): number;
// }

export class DOMNavigator {
  private textDecoder = new TextDecoder(); // Use TextDecoder for UTF-8 decoding
  private nodes: LSFNode[];
  private buffer: Uint8Array;

  constructor(parseResult: ParseResult) {
      if (!parseResult || !parseResult.nodes || !parseResult.buffer) {
          throw new Error("Invalid ParseResult provided to DOMNavigator");
      }
      this.nodes = parseResult.nodes;
      this.buffer = parseResult.buffer;
      // Inject self into parseResult (optional, depends on design)
      // parseResult.navigator = this; 
  }

  private getNode(nodeIndex: number): LSFNode | null {
      if (nodeIndex < 0 || nodeIndex >= this.nodes.length) {
          console.error(`[DOMNavigator] Invalid nodeIndex: ${nodeIndex}`);
          return null;
      }
      return this.nodes[nodeIndex];
  }

  getName(nodeIndex: number): string {
    const node = this.getNode(nodeIndex);
    if (!node || node.nameLength === 0) return '';
    // Decode the specific byte range from the buffer
    return this.textDecoder.decode(this.buffer.subarray(node.nameStart, node.nameStart + node.nameLength));
  }

  getValue(nodeIndex: number): string {
    const node = this.getNode(nodeIndex);
    if (!node || node.valueLength === 0) return '';
    // Decode the specific byte range from the buffer
    return this.textDecoder.decode(this.buffer.subarray(node.valueStart, node.valueStart + node.valueLength));
  }

  // Returns indices of children
  getChildren(nodeIndex: number): number[] {
    const node = this.getNode(nodeIndex);
    // Return a copy to prevent external modification?
    return node ? [...node.children] : []; 
  }

  // Returns the raw byte range for the value - useful for non-string types
  getRawValue(nodeIndex: number): {start: number, length: number} {
    const node = this.getNode(nodeIndex);
    if (!node) return { start: -1, length: 0 }; // Indicate error or invalid node
    return { start: node.valueStart, length: node.valueLength };
  }

  getType(nodeIndex: number): number {
    const node = this.getNode(nodeIndex);
    return node ? node.type : -1; // Return -1 or throw error for invalid index?
  }

  getTypeHint(nodeIndex: number): number {
    const node = this.getNode(nodeIndex);
    return node ? node.typeHint : 0; // Return 0 (no hint) for invalid index or if node not found?
  }

  // Get all root node indices (nodes with no parent)
  getRootIndices(): number[] {
    const rootIndices: number[] = [];
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      // In TypeScript implementation, check if node has no parent
      // We need to check how parent is stored - likely through a parent property or by checking if it's a top-level object
      if (node.type === 0 && !this.isChildOfAnyNode(i)) {
        rootIndices.push(i);
      }
    }
    return rootIndices;
  }

  private isChildOfAnyNode(nodeIndex: number): boolean {
    // Check if this node is in any other node's children array
    for (const node of this.nodes) {
      if (node.children && node.children.includes(nodeIndex)) {
        return true;
      }
    }
    return false;
  }
}

// Integration Step: Update DOMBuilder to use this Navigator
// Need to modify DOMBuilder.buildDOM to instantiate and return this class
// Example in DOMBuilder.buildDOM:
//  ...
//  const finalNodes = ...;
//  const finalResult: Omit<ParseResult, 'navigator'> = { 
//      root: rootIndex, nodes: finalNodes, buffer: this.buffer 
//  };
//  const navigator = new DOMNavigator(finalResult as ParseResult); // Cast needed temporarily
//  return { ...finalResult, navigator };
// ... 