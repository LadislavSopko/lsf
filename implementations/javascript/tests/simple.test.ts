import { describe, it, expect } from 'vitest';
import { LSFSimple } from '../src/simple';

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
    
    expect(result).toContain('$o§user$r§');
    expect(result).toContain('$f§name$f§John$r§');
    expect(result).toContain('$t§int$f§age$f§30$r§');
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
    
    expect(result).toContain('$o§user$r§');
    expect(result).toContain('$o§product$r§');
    expect(result).toContain('$f§name$f§John$r§');
    expect(result).toContain('$f§name$f§Laptop$r§');
    expect(result).toContain('$t§float$f§price$f§999.99$r§');
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
    
    expect(result).toContain('$f§tags$f§admin$l§user$r§');
  });
  
  it('should encode different value types', () => {
    const lsf = new LSFSimple();
    const data = {
      data: {
        int_val: 42,
        float_val: 3.14,
        bool_val: true,
        null_val: null,
        str_val: 'hello'
      }
    };
    const result = lsf.encode(data);
    
    expect(result).toContain('$t§int$f§int_val$f§42$r§');
    expect(result).toContain('$t§float$f§float_val$f§3.14$r§');
    expect(result).toContain('$t§bool$f§bool_val$f§true$r§');
    expect(result).toContain('$t§null$f§null_val$f§$r§');
    expect(result).toContain('$f§str_val$f§hello$r§');
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
    expect(result).toContain(`$t§bin$f§content$f§${b64}$r§`);
  });
  
  it('should encode an empty object', () => {
    const lsf = new LSFSimple();
    const data = {};
    const result = lsf.encode(data);
    
    expect(result).toBe('');
  });
  
  it('should decode a basic LSF string', () => {
    const lsf = new LSFSimple();
    const lsfStr = '$o§user$r§$f§name$f§John$r§$t§int$f§age$f§30$r§';
    const result = lsf.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        name: 'John',
        age: 30
      }
    });
  });
  
  it('should decode multiple objects', () => {
    const lsf = new LSFSimple();
    const lsfStr = '$o§user$r§$f§name$f§John$r§$o§product$r§$f§name$f§Laptop$r§$t§float$f§price$f§999.99$r§';
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
    const lsfStr = '$o§user$r§$f§name$f§John$r§$f§tags$f§admin$l§user$r§';
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
        balance: 45.67,
        metadata: null,
        tags: ['admin', 'premium'],
        profile: Buffer.from('profile-image-data')
      }
    };
    
    // Encode to LSF
    const lsfStr = lsf.encode(original);
    
    // Decode back to object
    const result = lsf.decode(lsfStr);
    
    // Check values
    expect(result.user.id).toBe(original.user.id);
    expect(result.user.name).toBe(original.user.name);
    expect(result.user.active).toBe(original.user.active);
    expect(result.user.balance).toBe(original.user.balance);
    expect(result.user.metadata).toBe(original.user.metadata);
    expect(result.user.tags).toEqual(original.user.tags);
    
    // Check binary data
    expect(Buffer.isBuffer(result.user.profile)).toBe(true);
    expect((result.user.profile as Buffer).toString()).toBe('profile-image-data');
  });
  
  it('should expose error information', () => {
    const lsf = new LSFSimple();
    const lsfStr = '$o§user$r§$f§name$f§John$r§$e§Something went wrong$r§';
    
    lsf.decode(lsfStr);
    const errors = lsf.getErrors();
    
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('Something went wrong');
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
    expect(result).toContain('$t§str$f§name$f§John$r§');
  });
  
  it('should allow configuring parse options', () => {
    const lsf = new LSFSimple({}, { autoConvertTypes: false });
    const lsfStr = '$o§user$r§$t§int$f§age$f§30$r§';
    const result = lsf.decode(lsfStr);
    
    // With autoConvertTypes:false, types are preserved as strings
    expect(result).toEqual({
      user: {
        age: '30'
      }
    });
  });
}); 