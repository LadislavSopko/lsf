/**
 * Ultra-fast LSF to JSON converter using visitor pattern
 * Directly writes to string builder without intermediate objects
 */

import { LSFDOMNavigator } from './lsf-dom-parser';

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
  private textDecoder = new TextDecoder();
  
  constructor(navigator: LSFDOMNavigator) {
    this.navigator = navigator;
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
    const nodeType = this.navigator.getNodeType(nodeIndex);
    const children = this.navigator.getChildren(nodeIndex);
    
    switch (nodeType) {
      case NODE_TYPE.OBJECT:
        this.visitObject(nodeIndex, children);
        break;
        
      case NODE_TYPE.FIELD:
        this.visitField(nodeIndex, children);
        break;
        
      case NODE_TYPE.VALUE:
        this.visitValue(nodeIndex);
        break;
        
      case NODE_TYPE.LIST:
        this.visitList(nodeIndex);
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
      if (this.navigator.getNodeType(childIndex) === NODE_TYPE.FIELD) {
        if (!firstField) {
          this.builder.appendChar(',');
        }
        firstField = false;
        
        this.visitNode(childIndex);
      }
    }
    
    this.builder.appendChar('}');
  }
  
  /**
   * Visit field node
   */
  private visitField(nodeIndex: number, children: number[]): void {
    // Get field key
    const key = this.navigator.getName(nodeIndex);
    this.builder.appendQuoted(key);
    this.builder.appendChar(':');
    
    // Visit value
    if (children.length > 0) {
      this.visitNode(children[0]);
    } else {
      this.builder.append('null');
    }
  }
  
  /**
   * Visit value node
   */
  private visitValue(nodeIndex: number): void {
    const typeHint = this.navigator.getTypeHint(nodeIndex);
    
    if (typeHint === 0) { // string
      const value = this.navigator.getValue(nodeIndex);
      this.builder.appendQuoted(value);
    } else {
      const value = this.navigator.getValue(nodeIndex);
      
      switch (typeHint) {
        case TYPE_HINT.NUMBER:
        case TYPE_HINT.FLOAT:
          this.builder.append(value);
          break;
          
        case TYPE_HINT.BOOLEAN:
          this.builder.append(value.toLowerCase());
          break;
          
        case TYPE_HINT.DATE:
          this.builder.appendQuoted(value);
          break;
          
        default:
          this.builder.appendQuoted(value);
      }
    }
  }
  
  /**
   * Visit list node
   */
  private visitList(nodeIndex: number): void {
    const listSpans = this.navigator.getListSpans(nodeIndex);
    
    this.builder.appendChar('[');
    let firstItem = true;
    
    for (const span of listSpans) {
      if (!firstItem) {
        this.builder.appendChar(',');
      }
      firstItem = false;
      
      const value = this.navigator.getValueFromSpan(span);
      this.builder.appendQuoted(value);
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
    const { navigator, root } = parseLSF(lsfString);
    
    if (root === -1) {
      return '{}';
    }
    
    const visitor = new LSFToJSONVisitor(navigator);
    return visitor.visit(root);
  }
  
  /**
   * Convert LSF string to JSON object
   */
  static convertToObject(lsfString: string): any {
    const jsonString = this.convert(lsfString);
    return JSON.parse(jsonString);
  }
  
  /**
   * Convert multiple LSF objects
   */
  static convertArray(lsfString: string): string {
    const { navigator, root } = parseLSF(lsfString);
    
    if (root === -1) {
      return '[]';
    }
    
    const children = navigator.getChildren(root);
    const builder = new JSONStringBuilder();
    const visitor = new LSFToJSONVisitor(navigator);
    
    builder.appendChar('[');
    let firstObject = true;
    
    for (const childIndex of children) {
      if (navigator.getNodeType(childIndex) === NODE_TYPE.OBJECT) {
        if (!firstObject) {
          builder.appendChar(',');
        }
        firstObject = false;
        
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
    const { navigator, root } = parseLSF(lsfString);
    
    if (root === -1) return;
    
    const children = navigator.getChildren(root);
    const visitor = new LSFToJSONVisitor(navigator);
    
    for (const childIndex of children) {
      if (navigator.getNodeType(childIndex) === NODE_TYPE.OBJECT) {
        yield visitor.visit(childIndex);
      }
    }
  }
}

/**
 * Performance comparison
 */
export function benchmarkVisitorVsObject(lsfString: string, iterations: number = 1000): {
  visitorTime: number;
  objectTime: number;
  speedup: number;
} {
  // Visitor pattern benchmark
  const visitorStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    LSFToJSON.convert(lsfString);
  }
  const visitorEnd = performance.now();
  
  // Object conversion benchmark
  const objectStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const converter = LSFToJSON.fromString(lsfString);
    JSON.stringify(converter.toJSON());
  }
  const objectEnd = performance.now();
  
  const visitorTime = (visitorEnd - visitorStart) / iterations;
  const objectTime = (objectEnd - objectStart) / iterations;
  
  return {
    visitorTime,
    objectTime,
    speedup: objectTime / visitorTime
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