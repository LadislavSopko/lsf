import { describe, it, expect } from 'vitest';
import { TokenScanner, TokenScanResult } from '../src/parser/token-scanner';

// Get CHAR_CODE from token-scanner or define locally for tests
const CHAR_CODE = {
  O: 111, // o
  F: 102, // f
  V: 118, // v
  T: 116, // t
};

describe('TokenScanner', () => {
  it('should correctly scan a simple LSF string', () => {
    const scanner = new TokenScanner();
    const input = '$o~root$f~name$v~value$t~s';
    const result = scanner.scan(input);

    expect(result.count).toBe(4);
    expect(result.types).toEqual(new Uint32Array([CHAR_CODE.O, CHAR_CODE.F, CHAR_CODE.V, CHAR_CODE.T]));
    expect(result.positions).toEqual(new Uint32Array([0, 7, 14, 22]));
    expect(result.buffer).toBeInstanceOf(Uint8Array);
  });

  it('should handle empty input', () => {
    const scanner = new TokenScanner();
    const input = '';
    const result = scanner.scan(input);

    expect(result.count).toBe(0);
    expect(result.types.length).toBe(0);
    expect(result.positions.length).toBe(0);
  });

  it('should handle input with no LSF tokens', () => {
    const scanner = new TokenScanner();
    const input = 'This is just plain text.';
    const result = scanner.scan(input);

    expect(result.count).toBe(0);
  });

  it('should scan multiple values (implicit array)', () => {
    const scanner = new TokenScanner();
    const input = '$o~data$f~scores$v~10$t~n$v~20$t~n$v~30$t~n';
    const result = scanner.scan(input);
    // Expected: $o~, $f~, $v~, $t~, $v~, $t~, $v~, $t~
    expect(result.count).toBe(8);
    expect(result.types).toEqual(new Uint32Array([
      CHAR_CODE.O, CHAR_CODE.F, 
      CHAR_CODE.V, CHAR_CODE.T, 
      CHAR_CODE.V, CHAR_CODE.T, 
      CHAR_CODE.V, CHAR_CODE.T
    ]));
    expect(result.positions).toEqual(new Uint32Array([0, 7, 16, 21, 25, 30, 34, 39]));
  });

  it('should ignore incomplete tokens at the end', () => {
    const scanner = new TokenScanner();
    const input = '$o~object$f~field$v~value$'; // Incomplete token at end
    const result = scanner.scan(input);
    expect(result.count).toBe(3);
    expect(result.types).toEqual(new Uint32Array([CHAR_CODE.O, CHAR_CODE.F, CHAR_CODE.V]));
    expect(result.positions).toEqual(new Uint32Array([0, 9, 17])); // Reverted positions
    
    const input2 = '$o~object$f~field$v~value$f'; // Incomplete token at end
    const result2 = scanner.scan(input2);
    expect(result2.count).toBe(3);
    expect(result2.positions).toEqual(new Uint32Array([0, 9, 17])); // Reverted positions
    
    const input3 = '$o~object$f~field$v~value$f~'; // Complete token at end
    const result3 = scanner.scan(input3);
    expect(result3.count).toBe(4);
    expect(result3.positions).toEqual(new Uint32Array([0, 9, 17, 25])); // Reverted positions
  });

  it('should ignore malformed tokens', () => {
    const scanner = new TokenScanner();
    const input = '$x~invalid$o~valid1$f~field1$a~notlsf3$f+almost$v~value1'; 
    const result = scanner.scan(input);
    // Reverting expectations back to original test values
    expect(result.count).toBe(3);
    expect(result.types).toEqual(new Uint32Array([CHAR_CODE.O, CHAR_CODE.F, CHAR_CODE.V]));
    expect(result.positions).toEqual(new Uint32Array([10, 19, 47])); 
  });

  it('should handle tokens adjacent to each other', () => {
    const scanner = new TokenScanner();
    const input = '$o~$f~$v~$t~';
    const result = scanner.scan(input);
    expect(result.count).toBe(4);
    expect(result.types).toEqual(new Uint32Array([CHAR_CODE.O, CHAR_CODE.F, CHAR_CODE.V, CHAR_CODE.T]));
    expect(result.positions).toEqual(new Uint32Array([0, 3, 6, 9]));
  });

  // Focus on this test
  it('should handle large input potentially triggering growth', () => {
    // Requires knowing the initial capacity or making it very large
    const initialCapacity = 16; // Use a small capacity for testing growth
    const scanner = new TokenScanner(initialCapacity); 
    let input = '';
    const repetitions = initialCapacity * 3; // Ensure growth
    const positions: number[] = [];
    const types: number[] = [];
    const tokenSequence = '$f~a$v~b'; // 2 tokens per sequence

    for(let i = 0; i < repetitions; i++) {
        const basePos = i * tokenSequence.length;
        input += tokenSequence;
        types.push(CHAR_CODE.F, CHAR_CODE.V);
        positions.push(basePos, basePos + 4);
    }

    const result = scanner.scan(input);
    expect(result.count).toBe(repetitions * 2);
    expect(result.types).toEqual(new Uint32Array(types));
    expect(result.positions).toEqual(new Uint32Array(positions));
  });

  // Test with Uint8Array input
  it('should handle Uint8Array input', () => {
    const scanner = new TokenScanner();
    const inputString = '$o~obj$f~f1$v~v1';
    const inputBuffer = new TextEncoder().encode(inputString);
    const result = scanner.scan(inputBuffer);
    expect(result.count).toBe(3);
    expect(result.types).toEqual(new Uint32Array([CHAR_CODE.O, CHAR_CODE.F, CHAR_CODE.V]));
    expect(result.positions).toEqual(new Uint32Array([0, 6, 11]));
  });
}); 