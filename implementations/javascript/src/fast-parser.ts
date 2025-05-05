/**
 * Ultra-fast LSF parser implementation in TypeScript
 * Optimized for maximum performance using finite state machine approach
 */

import { LSFDocument } from './types';

/**
 * Internal document structure used by the parser
 */
interface LSFInternalDocument {
  objects: Record<string, Record<string, any>>;
}

/**
 * Token types used in LSF v1.3
 * Using string values directly for better readability and flexibility
 */
const enum Token {
  ObjectStart = "$o~",
  FieldSep = "$f~",
  RecordEnd = "$r~",
  ListSep = "$l~",
  TypeSep = "$t~",
  VersionMarker = "$v~"
}

/**
 * Parser states for the finite state machine
 */
const enum ParserState {
  Initial,
  ExpectObjectName,
  InObject,
  ExpectFieldKey,
  ExpectFieldValue,
  InValue,
  ExpectType,
  InList
}

/**
 * Ultra-fast LSF parser implementation using a finite state machine approach
 * Significantly faster than regex-based parsing for large LSF documents
 */
export class UltraFastLSFParser {
  private buffer: string;
  private pos: number = 0;
  private state: ParserState = ParserState.Initial;
  private currentObject: string | null = null;
  private currentKey: string | null = null;
  private document: LSFDocument = {};
  
  /**
   * Create a new UltraFastLSFParser
   * 
   * @param input LSF formatted string to parse
   */
  constructor(input: string) {
    this.buffer = input;
  }
  
  /**
   * Parse the LSF string and return the resulting document
   * 
   * @returns Parsed LSF document
   */
  parse(): LSFDocument {
    while (this.pos < this.buffer.length) {
      this.step();
    }
    return this.document;
  }
  
  /**
   * Process a single step in the parsing state machine
   */
  private step(): void {
    // Skip whitespace between tokens
    this.skipWhitespace();
    
    if (this.pos >= this.buffer.length) return;
    
    const token = this.peekToken();
    
    switch (this.state) {
      case ParserState.Initial:
        if (token === Token.ObjectStart) {
          this.consumeToken(Token.ObjectStart);
          this.state = ParserState.ExpectObjectName;
        } else if (token === Token.VersionMarker) {
          // Skip version marker
          this.consumeToken(Token.VersionMarker);
          this.skipUntil(Token.RecordEnd);
          this.consumeToken(Token.RecordEnd);
        } else {
          // Skip other tokens in initial state
          this.pos++;
        }
        break;
        
      case ParserState.ExpectObjectName:
        const objectName = this.readUntilToken(Token.RecordEnd);
        this.currentObject = objectName;
        this.document[objectName] = {};
        this.consumeToken(Token.RecordEnd);
        this.state = ParserState.InObject;
        break;
        
      case ParserState.InObject:
        if (token === Token.ObjectStart) {
          this.consumeToken(Token.ObjectStart);
          this.state = ParserState.ExpectObjectName;
        } else {
          // Next token should be a field key
          this.state = ParserState.ExpectFieldKey;
        }
        break;
        
      case ParserState.ExpectFieldKey:
        if (this.pos >= this.buffer.length) return;
        
        // If we see another object starting, switch state
        if (this.peekToken() === Token.ObjectStart) {
          this.state = ParserState.InObject;
          return;
        }
        
        this.currentKey = this.readUntilToken(Token.FieldSep);
        this.consumeToken(Token.FieldSep);
        this.state = ParserState.ExpectFieldValue;
        break;
        
      case ParserState.ExpectFieldValue:
        const value = this.readValue();
        if (this.currentObject && this.currentKey) {
          this.document[this.currentObject][this.currentKey] = value;
        }
        // After reading a value we go back to processing objects
        this.state = ParserState.InObject;
        break;
        
      default:
        // Skip anything else
        this.pos++;
        break;
    }
  }
  
  /**
   * Skip whitespace characters
   */
  private skipWhitespace(): void {
    while (this.pos < this.buffer.length && /\s/.test(this.buffer[this.pos])) {
      this.pos++;
    }
  }
  
  /**
   * Read a value from the current position
   * Handles typed values and lists
   */
  private readValue(): any {
    // Check for list
    const listEndPos = this.findEndOfValue();
    const valueString = this.buffer.substring(this.pos, listEndPos);
    
    this.pos = listEndPos;
    
    // Check if this is a list
    if (valueString.includes(Token.ListSep)) {
      const items = valueString.split(Token.ListSep);
      this.consumeToken(Token.RecordEnd);
      return items;
    }
    
    // Check if this is a typed value
    if (valueString.includes(Token.TypeSep)) {
      const [rawValue, typeCode] = valueString.split(Token.TypeSep);
      this.consumeToken(Token.RecordEnd);
      return this.parseTypedValue(rawValue, typeCode);
    }
    
    // Basic string value
    this.consumeToken(Token.RecordEnd);
    return valueString;
  }
  
  /**
   * Find the end position of the current value
   */
  private findEndOfValue(): number {
    let end = this.pos;
    let foundType = false;
    
    while (end < this.buffer.length) {
      if (this.buffer.startsWith(Token.RecordEnd, end)) {
        break;
      }
      
      if (this.buffer.startsWith(Token.TypeSep, end)) {
        // Skip over the type marker and find the record end
        foundType = true;
        end += Token.TypeSep.length;
        continue;
      }
      
      end++;
    }
    
    return end;
  }
  
  /**
   * Parse a typed value based on the type code
   * 
   * @param value Raw string value
   * @param typeCode Single-letter type code (n, f, b, d, s)
   */
  private parseTypedValue(value: string, typeCode: string): any {
    switch (typeCode) {
      case 'n': return parseInt(value, 10);
      case 'f': return parseFloat(value);
      case 'b': return value.toLowerCase() === 'true';
      case 'd': return new Date(value);
      case 's': 
      default: return value;
    }
  }
  
  /**
   * Check if the token at current position matches a specific token
   */
  private peekToken(): Token | null {
    if (this.pos + 2 >= this.buffer.length) return null;
    
    const possibleToken = this.buffer.substring(this.pos, this.pos + 3);
    if (possibleToken === Token.ObjectStart) return Token.ObjectStart;
    if (possibleToken === Token.FieldSep) return Token.FieldSep;
    if (possibleToken === Token.RecordEnd) return Token.RecordEnd;
    if (possibleToken === Token.ListSep) return Token.ListSep;
    if (possibleToken === Token.TypeSep) return Token.TypeSep;
    if (possibleToken === Token.VersionMarker) return Token.VersionMarker;
    
    return null;
  }
  
  /**
   * Consume a specific token and advance position
   */
  private consumeToken(token: string): void {
    if (this.buffer.startsWith(token, this.pos)) {
      this.pos += token.length;
    } else {
      throw new Error(`Expected token ${token} at position ${this.pos}`);
    }
  }
  
  /**
   * Read content until a specific token is found
   */
  private readUntilToken(token: string): string {
    const start = this.pos;
    while (this.pos < this.buffer.length && !this.buffer.startsWith(token, this.pos)) {
      this.pos++;
    }
    return this.buffer.substring(start, this.pos);
  }
  
  /**
   * Skip until a specific token is found
   */
  private skipUntil(token: string): void {
    while (this.pos < this.buffer.length && !this.buffer.startsWith(token, this.pos)) {
      this.pos++;
    }
  }
} 