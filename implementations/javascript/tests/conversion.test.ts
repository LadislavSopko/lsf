import { describe, it, expect } from 'vitest';
import { lsfToJson, lsfToJsonPretty } from '../src/conversion';

describe('LSF Conversion', () => {
  it('should convert basic LSF to JSON', () => {
    const lsfStr = '$o§user$r§$f§name$f§John$r§$f§age$f§30$r§';
    const jsonStr = lsfToJson(lsfStr);
    
    // Parse and verify the content
    const data = JSON.parse(jsonStr);
    expect(data.user.name).toBe('John');
    expect(data.user.age).toBe('30');
    
    // Check that it's valid, compact JSON (no whitespace)
    expect(jsonStr).not.toContain('\n');
    expect(jsonStr).toContain('{"user":');
  });

  it('should convert LSF to pretty-printed JSON', () => {
    const lsfStr = '$o§user$r§$f§name$f§John$r§';
    const jsonStr = lsfToJsonPretty(lsfStr);
    
    // Pretty-printed JSON should have newlines and indentation
    expect(jsonStr).toContain('\n');
    expect(jsonStr).toContain('  ');
    
    // Should still be valid JSON
    const data = JSON.parse(jsonStr);
    expect(data.user.name).toBe('John');
  });

  it('should convert LSF to JSON with custom spacing', () => {
    const lsfStr = '$o§user$r§$f§name$f§John$r§';
    const jsonStr = lsfToJson(lsfStr, 4);
    
    // Should have appropriate indentation
    expect(jsonStr).toContain('    ');
    
    // Should still be valid JSON
    const data = JSON.parse(jsonStr);
    expect(data.user.name).toBe('John');
  });

  it('should handle a replacer function', () => {
    const lsfStr = '$o§user$r§$f§name$f§John$r§$f§password$f§secret$r§';
    
    // Replacer function that removes the password field
    const replacer = (key: string, value: any) => {
      if (key === 'password') return undefined;
      return value;
    };
    
    const jsonStr = lsfToJson(lsfStr, undefined, replacer);
    const data = JSON.parse(jsonStr);
    
    expect(data.user.name).toBe('John');
    expect(data.user.password).toBeUndefined();
  });

  it('should handle typed values correctly', () => {
    const lsfStr = (
      '$o§data$r§' +
      '$t§int$f§int_val$f§42$r§' +
      '$t§float$f§float_val$f§3.14$r§' +
      '$t§bool$f§bool_val$f§true$r§' +
      '$t§null$f§null_val$f§$r§'
    );
    const jsonStr = lsfToJson(lsfStr);
    const data = JSON.parse(jsonStr);
    
    // Verify typed values are preserved
    expect(data.data.int_val).toBe(42);
    expect(data.data.float_val).toBe(3.14);
    expect(data.data.bool_val).toBe(true);
    expect(data.data.null_val).toBeNull();
  });

  it('should handle list values', () => {
    const lsfStr = '$o§user$r§$f§tags$f§admin$l§user$l§editor$r§';
    const jsonStr = lsfToJson(lsfStr);
    const data = JSON.parse(jsonStr);
    
    expect(data.user.tags).toEqual(['admin', 'user', 'editor']);
  });

  it('should handle multiple objects', () => {
    const lsfStr = '$o§user$r§$f§name$f§John$r§$o§product$r§$f§name$f§Laptop$r§';
    const jsonStr = lsfToJson(lsfStr);
    const data = JSON.parse(jsonStr);
    
    expect(data.user.name).toBe('John');
    expect(data.product.name).toBe('Laptop');
  });

  it('should handle empty LSF string', () => {
    const jsonStr = lsfToJson('');
    expect(jsonStr).toBe('{}');
  });

  it('should handle string spacing parameter', () => {
    const lsfStr = '$o§user$r§$f§name$f§John$r§';
    const jsonStr = lsfToJson(lsfStr, '\t');
    
    // Should use tab indentation
    expect(jsonStr).toContain('\t');
    
    // Should still be valid JSON
    const data = JSON.parse(jsonStr);
    expect(data.user.name).toBe('John');
  });
}); 