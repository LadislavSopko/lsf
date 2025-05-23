import { LSFNode, ParseResult } from './types';
import { DOMNavigator as DOMNavigatorClass } from './dom-navigator';
import { NODE_TYPE } from './dom-builder'; // Need NODE_TYPE constants

// Simple StringBuilder for efficient string concatenation
class StringBuilder {
    private parts: string[] = [];
    private length: number = 0;
    // TODO: Consider pre-allocation based on estimated size

    append(str: string): void {
        this.parts.push(str);
        this.length += str.length;
    }

    toString(): string {
        return this.parts.join('');
    }

    getLength(): number {
        return this.length;
    }
}

// Visitor Interface (as per plan)
export interface Visitor {
  visitObject(nodeIndex: number): void;
  visitField(nodeIndex: number): void;
  visitValue(nodeIndex: number): void;
  getResult(): any; // Return type depends on visitor (string for JSON)
}

// LSF -> JSON Visitor Implementation
export class LSFToJSONVisitor implements Visitor {
  private result: StringBuilder;
  private navigator: DOMNavigatorClass;
  private parseResult: ParseResult;

  constructor(parseResult: ParseResult) {
    this.parseResult = parseResult;
    this.navigator = parseResult.navigator as DOMNavigatorClass;
    // TODO: Estimate output size based on input buffer size or node count?
    this.result = new StringBuilder();
  }

  // Public entry point to start traversal from the root
  buildJSON(): string {
      // Get all root indices to handle multiple objects
      const rootIndices = this.navigator.getRootIndices();
      
      if (rootIndices.length === 0) {
          // No root objects found
          return "{}";
      }
      
      if (rootIndices.length === 1) {
          // Single root object - return as single JSON object
          this.visit(rootIndices[0]);
          return this.getResult();
      }
      
      // Multiple root objects - return as JSON array
      this.result.append('[');
      for (let i = 0; i < rootIndices.length; i++) {
          if (i > 0) {
              this.result.append(',');
          }
          this.visit(rootIndices[i]);
      }
      this.result.append(']');
      return this.getResult();
  }
  
  // Generic visit method to dispatch based on node type
  private visit(nodeIndex: number): void {
      const nodeType = this.navigator.getType(nodeIndex);
      switch (nodeType) {
          case NODE_TYPE.OBJECT:
              this.visitObject(nodeIndex);
              break;
          case NODE_TYPE.FIELD:
              this.visitField(nodeIndex);
              break;
          case NODE_TYPE.VALUE:
              this.visitValue(nodeIndex);
              break;
          default:
              console.error(`Unknown node type encountered: ${nodeType} at index ${nodeIndex}`);
              // Optionally throw an error
              break;
      }
  }

  visitObject(nodeIndex: number): void {
    // TODO: Implement Object -> { ... } conversion
    this.result.append('{');
    const children = this.navigator.getChildren(nodeIndex);
    let firstField = true;
    for (const childIndex of children) {
        // Object children should be Fields
        if (this.navigator.getType(childIndex) === NODE_TYPE.FIELD) {
            if (!firstField) {
                this.result.append(',');
            }
            this.visitField(childIndex);
            firstField = false;
        } else {
             console.error(`Object node ${nodeIndex} has non-field child ${childIndex}`);
        }
    }
    this.result.append('}');
  }

  visitField(nodeIndex: number): void {
    // TODO: Implement Field -> "name": value or "name": [value1, value2]
    const fieldName = this.navigator.getName(nodeIndex);
    // JSON requires keys to be strings, escape fieldName
    this.result.append(JSON.stringify(fieldName || '__implicit_field__')); // Use placeholder for implicit
    this.result.append(':');

    const children = this.navigator.getChildren(nodeIndex);
    if (children.length === 0) {
        this.result.append('null'); // Field with no values -> null?
    } else if (children.length === 1) {
        // Single value
        this.visitValue(children[0]);
    } else {
        // Implicit array
        this.result.append('[');
        let firstValue = true;
        for (const childIndex of children) {
             if (this.navigator.getType(childIndex) === NODE_TYPE.VALUE) {
                if (!firstValue) {
                    this.result.append(',');
                }
                this.visitValue(childIndex);
                firstValue = false;
            } else {
                 console.error(`Field node ${nodeIndex} has non-value child ${childIndex}`);
            }
        }
        this.result.append(']');
    }
  }

  visitValue(nodeIndex: number): void {
    // TODO: Implement Value -> JSON primitive based on type hint
    const typeHint = this.navigator.getTypeHint(nodeIndex);
    const rawValue = this.navigator.getValue(nodeIndex); // Get decoded string value

    switch (String.fromCharCode(typeHint)) {
      case 'n': // number (integer)
        // Try parsing as int, fallback to float? Or just use parseFloat?
        const intVal = parseInt(rawValue, 10);
        this.result.append(isNaN(intVal) ? 'null' : String(intVal)); 
        break;
      case 'f': // float
        const floatVal = parseFloat(rawValue);
        this.result.append(isNaN(floatVal) ? 'null' : String(floatVal));
        break;
      case 'b': // boolean
        // Define LSF boolean representation ('true'/'false', '1'/'0'?)
        // Assuming 'true'/'false' case-insensitive for now
        const boolVal = rawValue.toLowerCase() === 'true';
        this.result.append(String(boolVal));
        break;
      case 'd': // date -> ISO string?
        // TODO: Define LSF date format (e.g., epoch ms, ISO string)
        // Assuming ISO 8601 string for now
        // Add validation? Fallback?
        this.result.append(JSON.stringify(rawValue)); // Treat as string for now
        break;
      case 'z': // null
        this.result.append('null');
        break;
      case 's': // string
      default: // Default to string
        this.result.append(JSON.stringify(rawValue)); // Includes escaping
        break;
    }
  }

  getResult(): string {
    return this.result.toString();
  }
} 