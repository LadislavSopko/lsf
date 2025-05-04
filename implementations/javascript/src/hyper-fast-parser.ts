/**
 * HyperFastLSFParser - Extreme performance LSF parser
 * 
 * Single-pass character-by-character parser with minimal allocations
 * and function calls for maximum performance.
 */

import { LSFDocument } from './types';

/**
 * HyperFastLSFParser provides maximum performance parsing for LSF v1.3
 * through direct character-by-character parsing with minimal function calls.
 */
export class HyperFastLSFParser {
  private input: string;
  private inputLength: number;
  private result: LSFDocument = {};
  
  /**
   * Create a new HyperFastLSFParser
   * 
   * @param input LSF formatted string to parse
   */
  constructor(input: string) {
    this.input = input;
    this.inputLength = input.length;
  }
  
  /**
   * Parse the LSF string
   * 
   * @returns Parsed LSF document
   */
  public parse(): LSFDocument {
    this.result = {};
    
    let pos = 0;
    let currentObject: string | null = null;
    let currentKey: string | null = null;
    
    while (pos < this.inputLength) {
      // Fast token detection
      if (this.input[pos] === '$' && pos + 2 < this.inputLength && this.input[pos + 2] === '§') {
        // Get token type
        const tokenChar = this.input[pos + 1];
        
        switch (tokenChar) {
          case 'o': {
            // Object start: $o§
            pos += 3; // Skip token
            const objectNameStart = pos;
            
            // Find end of object name (until $r§)
            while (
              pos < this.inputLength && 
              !(this.input[pos] === '$' && 
                pos + 2 < this.inputLength && 
                this.input[pos + 1] === 'r' && 
                this.input[pos + 2] === '§')
            ) {
              pos++;
            }
            
            // Extract object name
            currentObject = this.input.substring(objectNameStart, pos);
            this.result[currentObject] = {};
            
            // Skip the $r§ token
            pos += 3;
            break;
          }
          
          case 'f': {
            // Field separator: $f§
            pos += 3; // Skip token
            
            // Start collecting field value
            const valueStart = pos;
            let value: string | string[] = '';
            let hasListSeparator = false;
            
            // Extract value until next token ($r§, $t§, or $l§)
            while (
              pos < this.inputLength && 
              !(this.input[pos] === '$' && 
                pos + 2 < this.inputLength && 
                (this.input[pos + 1] === 'r' || 
                 this.input[pos + 1] === 't' || 
                 this.input[pos + 1] === 'l') && 
                this.input[pos + 2] === '§')
            ) {
              pos++;
            }
            
            // Store the value
            value = this.input.substring(valueStart, pos);
            
            // Check what token we encountered
            if (pos < this.inputLength && this.input[pos] === '$' && pos + 2 < this.inputLength) {
              const nextTokenChar = this.input[pos + 1];
              
              if (nextTokenChar === 'l') {
                // List separator: $l§
                let listValues = [value];
                pos += 3; // Skip token
                
                // Process the list elements
                while (
                  pos < this.inputLength && 
                  !(this.input[pos] === '$' && 
                    pos + 2 < this.inputLength && 
                    this.input[pos + 1] === 'r' && 
                    this.input[pos + 2] === '§')
                ) {
                  const listItemStart = pos;
                  
                  // Find the end of this list item
                  while (
                    pos < this.inputLength && 
                    !(this.input[pos] === '$' && 
                      pos + 2 < this.inputLength && 
                      (this.input[pos + 1] === 'l' || 
                       this.input[pos + 1] === 'r') && 
                      this.input[pos + 2] === '§')
                  ) {
                    pos++;
                  }
                  
                  // Add list item
                  listValues.push(this.input.substring(listItemStart, pos));
                  
                  // Check if we hit the end or another list separator
                  if (pos < this.inputLength && 
                      this.input[pos] === '$' && 
                      pos + 2 < this.inputLength && 
                      this.input[pos + 1] === 'l' && 
                      this.input[pos + 2] === '§') {
                    pos += 3; // Skip the $l§ and continue
                  }
                }
                
                value = listValues;
              } else if (nextTokenChar === 't') {
                // Type marker: $t§
                pos += 3; // Skip token
                const typeStart = pos;
                
                // Find the end of the type code
                while (
                  pos < this.inputLength && 
                  !(this.input[pos] === '$' && 
                    pos + 2 < this.inputLength && 
                    this.input[pos + 1] === 'r' && 
                    this.input[pos + 2] === '§')
                ) {
                  pos++;
                }
                
                // Apply type conversion
                const typeCode = this.input.substring(typeStart, pos);
                value = this.convertTypedValue(value, typeCode);
              }
              
              // Skip the $r§ token
              if (pos < this.inputLength && 
                  this.input[pos] === '$' && 
                  pos + 2 < this.inputLength && 
                  this.input[pos + 1] === 'r' && 
                  this.input[pos + 2] === '§') {
                pos += 3;
              }
            }
            
            // Store the field in the current object
            if (currentObject !== null && currentKey !== null) {
              this.result[currentObject][currentKey] = value;
              currentKey = null;
            }
            
            break;
          }
          
          case 'r': {
            // Record end: $r§
            pos += 3; // Skip token
            break;
          }
          
          case 'v': {
            // Version marker: $v§ - skip until next $r§
            pos += 3; // Skip token
            
            while (
              pos < this.inputLength && 
              !(this.input[pos] === '$' && 
                pos + 2 < this.inputLength && 
                this.input[pos + 1] === 'r' && 
                this.input[pos + 2] === '§')
            ) {
              pos++;
            }
            
            // Skip the $r§ token
            if (pos < this.inputLength) {
              pos += 3;
            }
            break;
          }
          
          default:
            // Unknown token, just skip it
            pos += 3;
            break;
        }
      } else if (currentObject !== null && currentKey === null && !this.isWhitespace(this.input[pos])) {
        // Field key (not in a token and not whitespace)
        const keyStart = pos;
        
        // Read until field separator
        while (
          pos < this.inputLength && 
          !(this.input[pos] === '$' && 
            pos + 2 < this.inputLength && 
            this.input[pos + 1] === 'f' && 
            this.input[pos + 2] === '§')
        ) {
          pos++;
        }
        
        // Store key
        currentKey = this.input.substring(keyStart, pos);
      } else {
        // Skip character (whitespace or unknown)
        pos++;
      }
    }
    
    return this.result;
  }
  
  /**
   * Fast whitespace check
   */
  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\n' || char === '\t' || char === '\r';
  }
  
  /**
   * Convert a string value to the appropriate type based on the type code
   * 
   * @param value The string value
   * @param typeCode The type code (n, f, b, d, s)
   * @returns The converted value
   */
  private convertTypedValue(value: string, typeCode: string): any {
    switch (typeCode) {
      case 'n': return parseInt(value, 10);
      case 'f': return parseFloat(value);
      case 'b': return value.toLowerCase() === 'true';
      case 'd': return new Date(value);
      case 's': 
      default: return value;
    }
  }
}

/**
 * Direct parse function for convenience
 * 
 * @param lsfString LSF formatted string to parse
 * @returns Parsed LSF document
 */
export function hyperParse(lsfString: string): LSFDocument {
  const parser = new HyperFastLSFParser(lsfString);
  return parser.parse();
} 