import { LSFNode, ParseResult, TokenInfo, DOMNavigator } from './types';

// Token definitions from the plan
const TOKEN = {
  OBJECT: '$o~',  // Object start (name optional)
  FIELD: '$f~',   // Field start
  VALUE: '$v~',   // Value marker (single or array element)
  TYPE: '$t~',    // Optional type hint
}

const CHAR_CODE = {
  DOLLAR: 36,     // $
  O: 111,         // o
  F: 102,         // f
  V: 118,         // v
  T: 116,         // t
  TILDE: 126      // ~
}

export interface TokenScanResult {
  types: Uint32Array;
  positions: Uint32Array;
  count: number;
  buffer: Uint8Array;
}

export class TokenScanner {
  private debug: boolean = false;
  private buffer!: Uint8Array;
  private tokenTypes!: Uint32Array;    // Pre-allocated typed array
  private tokenPositions!: Uint32Array; // Pre-allocated typed array
  private tokenCount: number = 0;
  private capacity: number = 0;
  private position: number = 0;

  // Initial capacity estimate
  private static INITIAL_CAPACITY = 1024; 

  constructor(initialCapacity: number = TokenScanner.INITIAL_CAPACITY, debug: boolean = false) {
    this.debug = debug;
    this.capacity = initialCapacity;
    this.tokenTypes = new Uint32Array(this.capacity);
    this.tokenPositions = new Uint32Array(this.capacity);
  }

  scan(input: string | Uint8Array): TokenScanResult {
    if (typeof input === 'string') {
      this.buffer = new TextEncoder().encode(input);
    } else {
      this.buffer = input;
    }
    
    this.tokenCount = 0;
    this.position = 0;

    const length = this.buffer.length;

    while (this.position < length) {
      if (this.buffer[this.position] === CHAR_CODE.DOLLAR && this.position + 2 < length) {
        const next1 = this.buffer[this.position + 1];
        const next2 = this.buffer[this.position + 2];

        if (next2 === CHAR_CODE.TILDE) {
          let tokenType = 0;
          switch (next1) {
            case CHAR_CODE.O: tokenType = CHAR_CODE.O; break;
            case CHAR_CODE.F: tokenType = CHAR_CODE.F; break;
            case CHAR_CODE.V: tokenType = CHAR_CODE.V; break;
            case CHAR_CODE.T: tokenType = CHAR_CODE.T; break;
          }
          
          if (tokenType !== 0) {
            if (this.tokenCount >= this.capacity) {
              this.growArrays();
            }
            this.tokenTypes[this.tokenCount] = tokenType;
            this.tokenPositions[this.tokenCount] = this.position;
            this.tokenCount++;
            if(this.debug){
                console.log(`Added token ${tokenType} at position ${this.position} tokenValue: ${new TextDecoder('utf-8').decode(this.buffer.subarray(this.position, this.position + 3))}`);
            }
            this.position += 3; // Skip the token marker
            continue; // Continue to next character after token
          }
        }
      }
      this.position++; // Move to the next character if no token found
    }
    
    // Return a copy or trimmed view of the arrays if needed for efficiency
    return {
      types: this.tokenTypes.slice(0, this.tokenCount),
      positions: this.tokenPositions.slice(0, this.tokenCount),
      count: this.tokenCount,
      buffer: this.buffer
    };
  }
  
  private growArrays(): void {
    const newCapacity = this.capacity * 2;
    // console.log(`Growing token arrays from ${this.capacity} to ${newCapacity}`); // For debugging
    
    const newTypes = new Uint32Array(newCapacity);
    newTypes.set(this.tokenTypes);
    this.tokenTypes = newTypes;
    
    const newPositions = new Uint32Array(newCapacity);
    newPositions.set(this.tokenPositions);
    this.tokenPositions = newPositions;
    
    this.capacity = newCapacity;
  }
} 