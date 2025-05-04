// Ultra-fast LSF parser implementation in TypeScript
// Optimized for maximum performance using finite state machine

interface LSFDocument {
  objects: Record<string, LSFObject>;
}

interface LSFObject {
  fields: Record<string, LSFValue>;
}

type LSFValue = string | number | boolean | Date | LSFValue[];

const enum TokenType {
  ObjectStart = "$o§".charCodeAt(0) << 16 | "$o§".charCodeAt(1) << 8 | "$o§".charCodeAt(2),
  FieldSep = "$f§".charCodeAt(0) << 16 | "$f§".charCodeAt(1) << 8 | "$f§".charCodeAt(2),
  RecordEnd = "$r§".charCodeAt(0) << 16 | "$r§".charCodeAt(1) << 8 | "$r§".charCodeAt(2),
  ListSep = "$l§".charCodeAt(0) << 16 | "$l§".charCodeAt(1) << 8 | "$l§".charCodeAt(2),
  TypeSep = "$t§".charCodeAt(0) << 16 | "$t§".charCodeAt(1) << 8 | "$t§".charCodeAt(2),
}

const enum ParserState {
  Initial,
  ExpectObjectName,
  InObject,
  ExpectFieldKey,
  ExpectFieldValue,
  InValue,
  ExpectType,
  InList,
}

export class UltraFastLSFParser {
  private buffer: Uint8Array;
  private pos: number = 0;
  private state: ParserState = ParserState.Initial;
  private currentObject: string | null = null;
  private currentKey: string | null = null;
  private document: LSFDocument = { objects: {} };
  
  constructor(input: string) {
    this.buffer = new TextEncoder().encode(input);
  }
  
  parse(): LSFDocument {
    while (this.pos < this.buffer.length) {
      this.step();
    }
    return this.document;
  }
  
  private step(): void {
    const token = this.peekToken();
    
    switch (this.state) {
      case ParserState.Initial:
        if (token === TokenType.ObjectStart) {
          this.consumeToken();
          this.state = ParserState.ExpectObjectName;
        }
        break;
        
      case ParserState.ExpectObjectName:
        const objectName = this.readUntilToken(TokenType.RecordEnd);
        this.currentObject = objectName;
        this.document.objects[objectName] = { fields: {} };
        this.consumeToken(); // Skip $r§
        this.state = ParserState.InObject;
        break;
        
      case ParserState.InObject:
        if (token === TokenType.ObjectStart) {
          this.consumeToken();
          this.state = ParserState.ExpectObjectName;
        } else {
          this.state = ParserState.ExpectFieldKey;
        }
        break;
        
      case ParserState.ExpectFieldKey:
        if (this.pos >= this.buffer.length) return;
        
        this.currentKey = this.readUntilToken(TokenType.FieldSep);
        this.consumeToken(); // Skip $f§
        this.state = ParserState.ExpectFieldValue;
        break;
        
      case ParserState.ExpectFieldValue:
        const value = this.readValue();
        if (this.currentObject && this.currentKey) {
          this.document.objects[this.currentObject].fields[this.currentKey] = value;
        }
        break;
    }
  }
  
  private readValue(): LSFValue {
    let end = this.pos;
    let hasType = false;
    let hasList = false;
    
    // Find end of value (optimize with single scan)
    while (end < this.buffer.length) {
      const next3 = this.getToken(end);
      if (next3 === TokenType.RecordEnd) break;
      if (next3 === TokenType.TypeSep) {
        hasType = true;
        break;
      }
      if (next3 === TokenType.ListSep) {
        hasList = true;
      }
      end++;
    }
    
    if (hasList) {
      // Parse list
      const list: string[] = [];
      let start = this.pos;
      
      while (this.pos < end) {
        let itemEnd = this.pos;
        while (itemEnd < end && this.getToken(itemEnd) !== TokenType.ListSep) {
          itemEnd++;
        }
        
        list.push(this.decodeString(start, itemEnd));
        this.pos = itemEnd;
        
        if (this.getToken(this.pos) === TokenType.ListSep) {
          this.pos += 3; // Skip $l§
          start = this.pos;
        }
      }
      
      this.state = ParserState.InObject;
      return list;
    }
    
    const rawValue = this.decodeString(this.pos, end);
    this.pos = end;
    
    if (hasType) {
      this.consumeToken(); // Skip $t§
      const typeCode = String.fromCharCode(this.buffer[this.pos]);
      this.pos++;
      this.consumeToken(); // Skip $r§
      this.state = ParserState.InObject;
      
      return this.parseTypedValue(rawValue, typeCode);
    }
    
    this.consumeToken(); // Skip $r§
    this.state = ParserState.InObject;
    return rawValue;
  }
  
  private parseTypedValue(value: string, typeCode: string): LSFValue {
    switch (typeCode) {
      case 'n': return parseInt(value);
      case 'f': return parseFloat(value);
      case 'b': return value === 'true';
      case 'd': return new Date(value);
      default: return value;
    }
  }
  
  private peekToken(): TokenType {
    return this.getToken(this.pos);
  }
  
  private getToken(offset: number): TokenType {
    if (offset + 2 >= this.buffer.length) return 0;
    return (this.buffer[offset] << 16) | 
           (this.buffer[offset + 1] << 8) | 
            this.buffer[offset + 2];
  }
  
  private consumeToken(): void {
    this.pos += 3;
  }
  
  private readUntilToken(stopToken: TokenType): string {
    const start = this.pos;
    while (this.pos < this.buffer.length && this.getToken(this.pos) !== stopToken) {
      this.pos++;
    }
    return this.decodeString(start, this.pos);
  }
  
  private decodeString(start: number, end: number): string {
    return new TextDecoder().decode(this.buffer.slice(start, end));
  }
}

// Usage example with performance measurement
const lsfString = `$o§user$r§id$f§123$t§n$r§name$f§John$r§tags$f§admin$l§user$l§vip$r§`;
const parser = new UltraFastLSFParser(lsfString);

const startTime = performance.now();
const result = parser.parse();
const endTime = performance.now();

console.log(`Parsing time: ${endTime - startTime}ms`);
console.log(JSON.stringify(result, null, 2));
