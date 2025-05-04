/**
 * HyperFastLSFParser - Extreme performance LSF parser
 * 
 * Single-pass character-by-character parser with minimal allocations
 * and function calls for maximum performance.
 */

import { LSFDocument } from './types';

// Character code constants for faster comparisons
const CHAR_CODE = {
  DOLLAR: 36,    // $
  SECTION: 167,  // §
  O: 111,        // o 
  F: 102,        // f
  R: 114,        // r
  L: 108,        // l
  T: 116,        // t
  V: 118,        // v
  N: 110,        // n
  B: 98,         // b
  D: 100,        // d
  SPACE: 32,     // Space
  TAB: 9,        // Tab
  CR: 13,        // Carriage return
  LF: 10         // Line feed
};

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
      if (this.input.charCodeAt(pos) === CHAR_CODE.DOLLAR && 
          pos + 2 < this.inputLength && 
          this.input.charCodeAt(pos + 2) === CHAR_CODE.SECTION) {
        // Get token type
        const tokenChar = this.input.charCodeAt(pos + 1);
        
        switch (tokenChar) {
          case CHAR_CODE.O: {
            // Object start: $o§
            pos += 3; // Skip token
            const objectNameStart = pos;
            
            // Find end of object name (until $r§)
            while (
              pos < this.inputLength && 
              !(this.input.charCodeAt(pos) === CHAR_CODE.DOLLAR && 
                pos + 2 < this.inputLength && 
                this.input.charCodeAt(pos + 1) === CHAR_CODE.R && 
                this.input.charCodeAt(pos + 2) === CHAR_CODE.SECTION)
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
          
          case CHAR_CODE.F: {
            // Field separator: $f§
            pos += 3; // Skip token
            
            // Start collecting field value
            const valueStart = pos;
            let value: string | string[] = '';
            let hasListSeparator = false;
            
            // Extract value until next token ($r§, $t§, or $l§)
            while (
              pos < this.inputLength && 
              !(this.input.charCodeAt(pos) === CHAR_CODE.DOLLAR && 
                pos + 2 < this.inputLength && 
                (this.input.charCodeAt(pos + 1) === CHAR_CODE.R || 
                 this.input.charCodeAt(pos + 1) === CHAR_CODE.T || 
                 this.input.charCodeAt(pos + 1) === CHAR_CODE.L) && 
                this.input.charCodeAt(pos + 2) === CHAR_CODE.SECTION)
            ) {
              pos++;
            }
            
            // Store the value
            value = this.input.substring(valueStart, pos);
            
            // Check what token we encountered
            if (pos < this.inputLength && 
                this.input.charCodeAt(pos) === CHAR_CODE.DOLLAR && 
                pos + 2 < this.inputLength) {
              const nextTokenChar = this.input.charCodeAt(pos + 1);
              
              if (nextTokenChar === CHAR_CODE.L) {
                // List separator: $l§
                let listValues = [value];
                pos += 3; // Skip token
                
                // Process the list elements
                while (
                  pos < this.inputLength && 
                  !(this.input.charCodeAt(pos) === CHAR_CODE.DOLLAR && 
                    pos + 2 < this.inputLength && 
                    this.input.charCodeAt(pos + 1) === CHAR_CODE.R && 
                    this.input.charCodeAt(pos + 2) === CHAR_CODE.SECTION)
                ) {
                  const listItemStart = pos;
                  
                  // Find the end of this list item
                  while (
                    pos < this.inputLength && 
                    !(this.input.charCodeAt(pos) === CHAR_CODE.DOLLAR && 
                      pos + 2 < this.inputLength && 
                      (this.input.charCodeAt(pos + 1) === CHAR_CODE.L || 
                       this.input.charCodeAt(pos + 1) === CHAR_CODE.R) && 
                      this.input.charCodeAt(pos + 2) === CHAR_CODE.SECTION)
                  ) {
                    pos++;
                  }
                  
                  // Add list item
                  listValues.push(this.input.substring(listItemStart, pos));
                  
                  // Check if we hit the end or another list separator
                  if (pos < this.inputLength && 
                      this.input.charCodeAt(pos) === CHAR_CODE.DOLLAR && 
                      pos + 2 < this.inputLength && 
                      this.input.charCodeAt(pos + 1) === CHAR_CODE.L && 
                      this.input.charCodeAt(pos + 2) === CHAR_CODE.SECTION) {
                    pos += 3; // Skip the $l§ and continue
                  }
                }
                
                value = listValues;
              } else if (nextTokenChar === CHAR_CODE.T) {
                // Type marker: $t§
                pos += 3; // Skip token
                const typeStart = pos;
                
                // Find the end of the type code
                while (
                  pos < this.inputLength && 
                  !(this.input.charCodeAt(pos) === CHAR_CODE.DOLLAR && 
                    pos + 2 < this.inputLength && 
                    this.input.charCodeAt(pos + 1) === CHAR_CODE.R && 
                    this.input.charCodeAt(pos + 2) === CHAR_CODE.SECTION)
                ) {
                  pos++;
                }
                
                // Apply type conversion
                const typeCode = this.input.substring(typeStart, pos);
                value = this.convertTypedValue(value, typeCode);
              }
              
              // Skip the $r§ token
              if (pos < this.inputLength && 
                  this.input.charCodeAt(pos) === CHAR_CODE.DOLLAR && 
                  pos + 2 < this.inputLength && 
                  this.input.charCodeAt(pos + 1) === CHAR_CODE.R && 
                  this.input.charCodeAt(pos + 2) === CHAR_CODE.SECTION) {
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
          
          case CHAR_CODE.R: {
            // Record end: $r§
            pos += 3; // Skip token
            break;
          }
          
          case CHAR_CODE.V: {
            // Version marker: $v§ - skip until next $r§
            pos += 3; // Skip token
            
            while (
              pos < this.inputLength && 
              !(this.input.charCodeAt(pos) === CHAR_CODE.DOLLAR && 
                pos + 2 < this.inputLength && 
                this.input.charCodeAt(pos + 1) === CHAR_CODE.R && 
                this.input.charCodeAt(pos + 2) === CHAR_CODE.SECTION)
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
      } else if (currentObject !== null && currentKey === null && !this.isWhitespace(this.input.charCodeAt(pos))) {
        // Field key (not in a token and not whitespace)
        const keyStart = pos;
        
        // Read until field separator
        while (
          pos < this.inputLength && 
          !(this.input.charCodeAt(pos) === CHAR_CODE.DOLLAR && 
            pos + 2 < this.inputLength && 
            this.input.charCodeAt(pos + 1) === CHAR_CODE.F && 
            this.input.charCodeAt(pos + 2) === CHAR_CODE.SECTION)
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
  private isWhitespace(charCode: number): boolean {
    return charCode === CHAR_CODE.SPACE || 
           charCode === CHAR_CODE.LF || 
           charCode === CHAR_CODE.TAB || 
           charCode === CHAR_CODE.CR;
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