import { describe, it, expect } from 'vitest';
import LSF, { 
  parseToDom, 
  parseToJsonString, 
  encodeToString,
  encodeToArray,
  parseToDomFromBytes,
  parseToJsonStringFromBytes
} from '../src/index';

describe('Public API exports', () => {
  it('should export all main functions', () => {
    expect(parseToDom).toBeDefined();
    expect(parseToJsonString).toBeDefined();
    expect(encodeToString).toBeDefined();
    expect(encodeToArray).toBeDefined();
    expect(parseToDomFromBytes).toBeDefined();
    expect(parseToJsonStringFromBytes).toBeDefined();
  });

  it('should have default export with all functions', () => {
    expect(LSF.parseToDom).toBeDefined();
    expect(LSF.parseToJsonString).toBeDefined();
    expect(LSF.encodeToString).toBeDefined();
    expect(LSF.encodeToArray).toBeDefined();
    expect(LSF.parseToDomFromBytes).toBeDefined();
    expect(LSF.parseToJsonStringFromBytes).toBeDefined();
  });

  it('should parse simple LSF to JSON', () => {
    const lsf = '$o~user$f~name$v~Alice$f~age$v~30$t~n';
    const json = parseToJsonString(lsf);
    expect(json).toBe('{"name":"Alice","age":30}');
  });

  it('should encode object to LSF', () => {
    const obj = { name: 'Bob', active: true };
    const lsf = encodeToString(obj);
    expect(lsf).toContain('$f~name$v~Bob');
    expect(lsf).toContain('$f~active$v~true');
  });

  it('should handle round-trip conversion', () => {
    const originalObj = { product: 'Laptop', price: 999.99, inStock: true };
    const lsf = encodeToString(originalObj);
    const json = parseToJsonString(lsf);
    const parsed = JSON.parse(json!);
    
    expect(parsed.product).toBe('Laptop');
    expect(parsed.price).toBe(999.99);
    expect(parsed.inStock).toBe(true);
  });

  describe('Error Handling', () => {
    it('should throw on invalid type code', () => {
      const testCases = [
        '$o~test$f~value$v~123$t~x',
        '$o~test$f~value$v~abc$t~q',
        '$o~test$f~value$v~true$t~1',
        '$o~test$f~value$v~data$t~@'
      ];

      for (const input of testCases) {
        expect(() => parseToJsonString(input)).toThrow(/Invalid type hint/);
      }
    });

    it('should accept all valid type codes', () => {
      const testCases = [
        ['$o~test$f~intVal$v~123$t~n', '"intVal":123'],
        ['$o~test$f~floatVal$v~123.45$t~f', '"floatVal":123.45'],
        ['$o~test$f~boolVal$v~true$t~b', '"boolVal":true'],
        ['$o~test$f~dateVal$v~2025-01-23$t~d', '"dateVal":"2025-01-23"'],
        ['$o~test$f~strVal$v~hello$t~s', '"strVal":"hello"'],
        ['$o~test$f~nullVal$v~$t~z', '"nullVal":null']
      ];

      for (const [input, expectedContent] of testCases) {
        const result = parseToJsonString(input);
        expect(result).toContain(expectedContent);
      }
    });

    it('should throw on input size exceeded', () => {
      // Create a string larger than 10MB
      const largeInput = '$o~test' + '$f~field$v~value'.repeat(700000);
      
      expect(() => parseToJsonString(largeInput)).toThrow(/Input size exceeds maximum allowed size/);
    });
  });
});