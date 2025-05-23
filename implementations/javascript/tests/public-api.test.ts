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
});