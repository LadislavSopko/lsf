import { describe, it, expect } from 'vitest';
import { lsfToJson } from '../src/conversion';

describe('LSF Conversion', () => {
  it('should convert basic LSF to JSON', () => {
    const lsfStr = '$o~user$r~name$f~John$r~age$f~30$r~';
    
    // Convert to JSON
    const jsonStr = lsfToJson(lsfStr);
    
    // Parse and verify the content
    const data = JSON.parse(jsonStr);
    expect(data.user.name).toBe('John');
    expect(data.user.age).toBe('30');
  });
  
  it('should convert LSF to pretty-printed JSON', () => {
    const lsfStr = '$o~user$r~name$f~John$r~age$f~30$r~';
    
    // Convert to JSON with pretty print (2 spaces)
    const jsonStr = lsfToJson(lsfStr, 2);
    
    // Should be formatted with indentation
    expect(jsonStr).toContain('{\n  "user"');
    expect(jsonStr).toContain('    "name": "John"');
    
    // Should still be valid JSON
    const data = JSON.parse(jsonStr);
    expect(data.user.name).toBe('John');
  });
  
  it('should convert LSF to JSON with custom spacing', () => {
    const lsfStr = '$o~user$r~name$f~John$r~age$f~30$r~';
    
    // Convert to JSON with 4 spaces
    const jsonStr = lsfToJson(lsfStr, 4);
    
    // Should be formatted with 4-space indentation
    expect(jsonStr).toContain('{\n    "user"');
    
    // Should still be valid JSON
    const data = JSON.parse(jsonStr);
    expect(data.user.name).toBe('John');
  });
  
  it('should handle a replacer function', () => {
    const lsfStr = '$o~user$r~name$f~John$r~password$f~secret$r~';
    
    // Use a replacer to filter out password fields
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
    const lsfStr = `$o~data$r~
      int_val$f~42$t~n$r~
      float_val$f~3.14$t~f$r~
      bool_val$f~true$t~b$r~
      date_val$f~2023-01-01T12:00:00Z$t~d$r~
    `;
    
    const jsonStr = lsfToJson(lsfStr);
    const data = JSON.parse(jsonStr);
    
    // Verify typed values are preserved
    expect(data.data.int_val).toBe(42);
    expect(data.data.float_val).toBe(3.14);
    expect(data.data.bool_val).toBe(true);
    // Dates become strings in JSON
    expect(data.data.date_val instanceof Date).toBe(false);
    expect(typeof data.data.date_val).toBe('string');
  });
  
  it('should handle list values', () => {
    const lsfStr = '$o~user$r~tags$f~admin$l~user$l~editor$r~';
    
    const jsonStr = lsfToJson(lsfStr);
    const data = JSON.parse(jsonStr);
    
    expect(data.user.tags).toEqual(['admin', 'user', 'editor']);
  });
  
  it('should handle multiple objects', () => {
    const lsfStr = '$o~user$r~name$f~John$r~$o~product$r~name$f~Laptop$r~';
    
    const jsonStr = lsfToJson(lsfStr);
    const data = JSON.parse(jsonStr);
    
    expect(data.user.name).toBe('John');
    expect(data.product.name).toBe('Laptop');
  });
  
  it('should handle string spacing parameter', () => {
    const lsfStr = '$o~user$r~name$f~John$r~age$f~30$r~';
    
    // Convert with tab indentation
    const jsonStr = lsfToJson(lsfStr, '\t');
    
    // Should use tabs for indentation
    expect(jsonStr).toContain('{\n\t"user"');
    
    // Should still be valid JSON
    const data = JSON.parse(jsonStr);
    expect(data.user.name).toBe('John');
  });
}); 