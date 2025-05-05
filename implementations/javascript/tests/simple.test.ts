import { describe, it, expect } from 'vitest';
import { LSFSimple } from '../src/simple';
import { LSFDecoder } from '../src/decoder';

describe('LSFSimple', () => {
  it('should encode a basic object', () => {
    const lsf = new LSFSimple();
    const data = {
      user: {
        name: 'John',
        age: 30
      }
    };
    const result = lsf.encode(data);
    
    expect(result).toContain('$o~user$r~');
    expect(result).toContain('name$f~John$r~');
    expect(result).toContain('age$f~30$t~n$r~');
  });
  
  it('should encode with no auto type detection', () => {
    const lsf = new LSFSimple({ detectTypes: false });
    const data = {
      user: {
        name: 'John',
        age: 30
      }
    };
    const result = lsf.encode(data);
    
    expect(result).toContain('$o~user$r~');
    expect(result).toContain('name$f~John$r~');
    expect(result).toContain('age$f~30$r~'); // No type hint
  });
  
  it('should encode multiple objects', () => {
    const lsf = new LSFSimple();
    const data = {
      user: {
        name: 'John'
      },
      product: {
        name: 'Laptop',
        price: 999.99
      }
    };
    const result = lsf.encode(data);
    
    expect(result).toContain('$o~user$r~');
    expect(result).toContain('$o~product$r~');
    expect(result).toContain('name$f~John$r~');
    expect(result).toContain('name$f~Laptop$r~');
    expect(result).toContain('price$f~999.99$t~f$r~');
  });
  
  it('should encode a list', () => {
    const lsf = new LSFSimple();
    const data = {
      user: {
        name: 'John',
        tags: ['admin', 'user']
      }
    };
    const result = lsf.encode(data);
    
    expect(result).toContain('tags$f~admin$l~user$r~');
  });
  
  it('should encode different value types', () => {
    const lsf = new LSFSimple();
    const data = {
      data: {
        int_val: 42,
        float_val: 3.14,
        bool_val: true,
        null_val: null
      }
    };
    const result = lsf.encode(data);
    
    expect(result).toContain('int_val$f~42$t~n$r~');
    expect(result).toContain('float_val$f~3.14$t~f$r~');
    expect(result).toContain('bool_val$f~true$t~b$r~');
    // Null values are omitted in v1.3
    expect(result).not.toContain('null_val');
  });
  
  it('should encode binary data', () => {
    const lsf = new LSFSimple();
    const data = {
      file: {
        content: Buffer.from('hello world')
      }
    };
    const result = lsf.encode(data);
    
    const b64 = Buffer.from('hello world').toString('base64');
    expect(result).toContain(`content$f~${b64}$r~`);
  });
  
  it('should decode a basic LSF string', () => {
    const lsf = new LSFSimple({ autoConvertTypes: true });
    const lsfStr = '$o~user$r~name$f~John$r~age$f~30$t~n$r~';
    const result = lsf.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        name: 'John',
        age: 30
      }
    });
  });
  
  it('should decode multiple objects', () => {
    const lsf = new LSFSimple({ autoConvertTypes: true });
    const lsfStr = '$o~user$r~name$f~John$r~$o~product$r~name$f~Laptop$r~price$f~999.99$t~f$r~';
    const result = lsf.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        name: 'John'
      },
      product: {
        name: 'Laptop',
        price: 999.99
      }
    });
  });
  
  it('should decode a list', () => {
    const lsf = new LSFSimple();
    const lsfStr = '$o~user$r~name$f~John$r~tags$f~admin$l~user$r~';
    const result = lsf.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        name: 'John',
        tags: ['admin', 'user']
      }
    });
  });
  
  it('should perform a round trip conversion', () => {
    const lsf = new LSFSimple();
    const original = {
      user: {
        id: 123,
        name: 'John Doe',
        active: true,
        balance: 99.95,
        metadata: null,
        tags: ['admin', 'user']
      }
    };
    
    const lsfStr = lsf.encode(original);
    const result = lsf.decode(lsfStr);
    
    // Values are stored as strings in LSF v1.3 by default
    expect(String(result.user?.id)).toBe(String(original.user.id));
    expect(result.user?.name).toBe(original.user.name);
    expect(String(result.user?.active)).toBe(String(original.user.active));
    expect(String(result.user?.balance)).toBe(String(original.user.balance));
    // null values are missing in v1.3
    expect(result.user?.metadata).toBeUndefined();
    expect(result.user?.tags).toEqual(original.user.tags);
  });
  
  it('should expose error information', () => {
    const lsf = new LSFSimple();
    const decoder = new LSFDecoder();
    
    // Manually record an error before checking
    (decoder as any).errors = [{ message: 'Test error message' }];
    
    // Override the getErrors method to use our decoder
    (lsf as any).decoder = decoder;
    
    const errors = lsf.getErrors();
    expect(errors.length).toBeGreaterThan(0);
  });
  
  it('should allow configuring encode options', () => {
    const lsf = new LSFSimple({ explicitTypes: true });
    const data = {
      user: {
        name: 'John'
      }
    };
    const result = lsf.encode(data);
    
    // With explicitTypes:true, even strings get type markers
    expect(result).toContain('name$f~John$t~s$r~');
  });
  
  it('should allow configuring parse options', () => {
    const lsf = new LSFSimple({ autoConvertTypes: false });
    const lsfStr = '$o~user$r~age$f~30$t~n$r~';
    const result = lsf.decode(lsfStr);
    
    // With autoConvertTypes:false, types are preserved as strings
    expect(result).toEqual({
      user: {
        age: '30'
      }
    });
  });
}); 