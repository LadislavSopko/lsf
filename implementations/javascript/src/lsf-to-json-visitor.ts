/**
 * Ultra-fast LSF to JSON converter using visitor pattern
 * Directly writes to string builder without intermediate objects
 */

import { LSFDOMNavigator, LSFNode, parseLSF, LSFParseResult, ValueSpan } from './lsf-dom-parser-preallocated';

// Constants for faster comparison
const NODE_TYPE = {
  OBJECT: 0,
  FIELD: 1,
  VALUE: 2,
  LIST: 3,
} as const;

const TYPE_HINT = {
  NUMBER: 110,  // n
  FLOAT: 102,   // f
  BOOLEAN: 98,  // b
  DATE: 100,    // d
} as const;

/**
 * StringBuilder optimized for JSON generation
 */
class JSONStringBuilder {
  private chunks: string[] = [];
  private index = 0;
  
  // Pre-allocate chunk array
  constructor(initialCapacity = 1000) {
    this.chunks = new Array(initialCapacity);
  }
  
  /**
   * Append string to builder
   */
  append(str: string): void {
    this.chunks[this.index++] = str;
    
    // Grow if needed (rarely)
    if (this.index >= this.chunks.length) {
      this.grow();
    }
  }
  
  /**
   * Append character
   */
  appendChar(char: string): void {
    this.chunks[this.index++] = char;
    
    if (this.index >= this.chunks.length) {
      this.grow();
    }
  }
  
  /**
   * Append quoted string (with escaping)
   */
  appendQuoted(str: string): void {
    this.appendChar('"');
    
    // Fast path for strings without special characters
    let needsEscaping = false;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      if (char === 34 || char === 92 || char < 32) { // ", \, or control chars
        needsEscaping = true;
        break;
      }
    }
    
    if (!needsEscaping) {
      this.append(str);
    } else {
      // Slow path with escaping
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        switch (char) {
          case '"': this.append('\\"'); break;
          case '\\': this.append('\\\\'); break;
          case '\n': this.append('\\n'); break;
          case '\r': this.append('\\r'); break;
          case '\t': this.append('\\t'); break;
          default: this.append(char);
        }
      }
    }
    
    this.appendChar('"');
  }
  
  /**
   * Build final JSON string
   */
  toString(): string {
    return this.chunks.slice(0, this.index).join('');
  }
  
  /**
   * Reset builder for reuse
   */
  reset(): void {
    this.index = 0;
  }
  
  /**
   * Grow chunk array
   */
  private grow(): void {
    const newSize = this.chunks.length * 2;
    const newChunks = new Array(newSize);
    
    for (let i = 0; i < this.index; i++) {
      newChunks[i] = this.chunks[i];
    }
    
    this.chunks = newChunks;
  }
}

/**
 * Visitor for LSF to JSON conversion
 */
class LSFToJSONVisitor {
  private navigator: LSFDOMNavigator;
  private builder: JSONStringBuilder;
  private nodes: LSFNode[];
  private values: ValueSpan[];
  private nodeChildren: number[];
  private buffer: Uint8Array;
  private textDecoder = new TextDecoder();
  
  constructor(navigator: LSFDOMNavigator, nodes: LSFNode[], values: ValueSpan[], nodeChildren: number[], buffer: Uint8Array) {
    this.navigator = navigator;
    this.nodes = nodes;
    this.values = values;
    this.nodeChildren = nodeChildren;
    this.buffer = buffer;
    this.builder = new JSONStringBuilder();
  }
  
  /**
   * Visit LSF tree and generate JSON
   */
  visit(rootNode: number): string {
    this.builder.reset();
    this.visitNode(rootNode);
    return this.builder.toString();
  }
  
  /**
   * Visit a single node
   */
  private visitNode(nodeIndex: number): void {
    // Access node directly from the stored array
    if (nodeIndex < 0 || nodeIndex >= this.nodes.length) return;
    const node = this.nodes[nodeIndex];
    if (!node) return;
    
    // Get children using the navigator
    const children = this.navigator.getChildren(nodeIndex);
    
    // Switch on the node's type property
    switch (node.type) { 
      case 0: // Object
        this.visitObject(nodeIndex, children);
        break;
        
      case 1: // Field
        this.visitField(nodeIndex, children);
        break;
        
      case 2: // Value
        this.visitValue(nodeIndex, node);
        break;
        
      case 3: // List
        this.visitList(nodeIndex, node);
        break;
    }
  }
  
  /**
   * Visit object node
   */
  private visitObject(nodeIndex: number, children: number[]): void {
    this.builder.appendChar('{');
    let firstField = true;
    
    for (const childIndex of children) {
      // Check the type of the child node directly
      if (childIndex >= 0 && childIndex < this.nodes.length && this.nodes[childIndex]?.type === 1) { // Field
        if (!firstField) {
          this.builder.appendChar(',');
        }
        firstField = false;
        this.visitNode(childIndex); // Visit the field node
      }
    }
    
    this.builder.appendChar('}');
  }
  
  /**
   * Visit field node
   */
  private visitField(nodeIndex: number, children: number[]): void {
    // Get field key using navigator
    const key = this.navigator.getName(nodeIndex);
    this.builder.appendQuoted(key);
    this.builder.appendChar(':');
    
    // Visit the first child node (value or list)
    if (children.length > 0) {
      this.visitNode(children[0]);
    } else {
      this.builder.append('null'); // Field with no value
    }
  }
  
  /**
   * Visit value node
   */
  private visitValue(nodeIndex: number, node: LSFNode): void {
    // Get type hint directly from the node
    const typeHint = node.typeHint; 
    const value = this.navigator.getValue(nodeIndex); // Get raw value string via navigator
    
    if (typeHint === 0) { // string (no type hint)
      this.builder.appendQuoted(value);
    } else {
      // Handle typed values
      switch (typeHint) {
        case TYPE_HINT.NUMBER:
        case TYPE_HINT.FLOAT:
          this.builder.append(value); // Append directly as JSON number
          break;
        case TYPE_HINT.BOOLEAN:
          this.builder.append(value.toLowerCase() === 'true' ? 'true' : 'false');
          break;
        case TYPE_HINT.DATE:
          this.builder.appendQuoted(value); // Append as JSON string
          break;
        default:
          this.builder.appendQuoted(value); // Treat unknown types as string
      }
    }
  }
  
  /**
   * Visit list node
   */
  private visitList(nodeIndex: number, node: LSFNode): void {
    // List items are stored as value spans in the `values` array.
    // The list node's childrenStart/childrenCount point to indices in the `values` array.
    const spanStartIndex = node.childrenStart;
    const spanCount = node.childrenCount;
    
    this.builder.appendChar('[');
    let firstItem = true;
    
    for (let i = 0; i < spanCount; i++) {
      const valueSpanIndex = spanStartIndex + i;
      if (valueSpanIndex < this.values.length) {
        const span = this.values[valueSpanIndex];
        if (span) {
          if (!firstItem) {
            this.builder.appendChar(',');
          }
          firstItem = false;
          
          // Decode the value from the buffer using the span
          const itemValue = this.textDecoder.decode(this.buffer.subarray(span.start, span.start + span.length));
          // Lists currently only store raw string values, no type hints per item.
          this.builder.appendQuoted(itemValue); 
        }
      }
    }
    
    this.builder.appendChar(']');
  }
}

/**
 * Public API for fast LSF to JSON conversion
 */
export class LSFToJSON {
  /**
   * Convert LSF string to JSON using visitor pattern
   */
  static convert(lsfString: string): string {
    // Call the modified parseLSF
    const parseResult = parseLSF(lsfString);
    
    if (parseResult.root === -1) {
      return '{}'; // Return empty object for invalid/empty input
    }
    
    // Instantiate visitor with all necessary data from parseResult
    const visitor = new LSFToJSONVisitor(
      parseResult.navigator,
      parseResult.nodes,
      parseResult.values,
      parseResult.nodeChildren,
      parseResult.buffer
    );
    return visitor.visit(parseResult.root);
  }
  
  /**
   * Convert LSF string to JSON object
   */
  static convertToObject(lsfString: string): any {
    const jsonString = this.convert(lsfString);
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse generated JSON:", e);
      return null; // Or rethrow/handle error appropriately
    }
  }
  
  /**
   * Convert multiple LSF objects (assuming root contains multiple object children)
   */
  static convertArray(lsfString: string): string {
    const parseResult = parseLSF(lsfString);
    
    if (parseResult.root === -1) {
      return '[]';
    }
    
    // Get children of the root node
    const children = parseResult.navigator.getChildren(parseResult.root);
    const builder = new JSONStringBuilder(); // Use a local builder for the array structure
    
    // Instantiate the visitor once with the parsed data
    const visitor = new LSFToJSONVisitor(
        parseResult.navigator,
        parseResult.nodes,
        parseResult.values,
        parseResult.nodeChildren,
        parseResult.buffer
    );
    
    builder.appendChar('[');
    let firstObject = true;
    
    for (const childIndex of children) {
      // Check the node type directly from the nodes array
      if (childIndex >= 0 && childIndex < parseResult.nodes.length && parseResult.nodes[childIndex]?.type === 0) { // Check if it's an object (type 0)
        if (!firstObject) {
          builder.appendChar(',');
        }
        firstObject = false;
        
        // Reset the visitor's internal builder and visit the object
        const jsonStr = visitor.visit(childIndex); 
        builder.append(jsonStr);
      }
    }
    
    builder.appendChar(']');
    return builder.toString();
  }
  
  /**
   * Stream conversion for large datasets
   */
  static *convertStream(lsfString: string): Generator<string, void, unknown> {
    const parseResult = parseLSF(lsfString);
    
    if (parseResult.root === -1) return;
    
    const children = parseResult.navigator.getChildren(parseResult.root);
    const visitor = new LSFToJSONVisitor(
        parseResult.navigator,
        parseResult.nodes,
        parseResult.values,
        parseResult.nodeChildren,
        parseResult.buffer
      );
    
    for (const childIndex of children) {
       // Check the node type directly
      if (childIndex >= 0 && childIndex < parseResult.nodes.length && parseResult.nodes[childIndex]?.type === 0) { // Check if it's an object (type 0)
        yield visitor.visit(childIndex);
      }
    }
  }
}

/**
 * Performance comparison
 */
// Simplified benchmark focusing only on the direct-to-string visitor
export function benchmarkVisitor(lsfString: string, iterations: number = 1000): {
  visitorTime: number;
} {
  // Visitor pattern benchmark (direct-to-string)
  const visitorStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    LSFToJSON.convert(lsfString); // Use the correct static method
  }
  const visitorEnd = performance.now();
  
  const visitorTime = (visitorEnd - visitorStart) / iterations;
  
  return {
    visitorTime
  };
}

// Usage examples:
/*
// Direct string conversion (fastest)
const jsonString = LSFToJSON.convert(lsfString);

// Convert to JS object (with parsing overhead)
const jsonObject = LSFToJSON.convertToObject(lsfString);

// Convert array
const jsonArray = LSFToJSON.convertArray(multiObjectLSF);

// Streaming
for (const jsonString of LSFToJSON.convertStream(largeLSF)) {
  const obj = JSON.parse(jsonString);
  processObject(obj);
}
*/