import { describe, it, expect } from 'vitest';
import { LSFDecoder } from '../src/decoder';

describe('LSFDecoder', () => {
  it('should decode a basic object', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§$f§name$f§John$r§';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        name: 'John'
      }
    });
  });

  it('should decode multiple fields', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§$f§name$f§John$r§$f§age$f§30$r§';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        name: 'John',
        age: '30'
      }
    });
  });

  it('should decode multiple objects', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§$f§name$f§John$r§$o§product$r§$f§name$f§Laptop$r§';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        name: 'John'
      },
      product: {
        name: 'Laptop'
      }
    });
  });

  it('should decode a list', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§$f§tags$f§admin$l§user$l§editor$r§';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        tags: ['admin', 'user', 'editor']
      }
    });
  });

  it('should decode an empty list', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§$f§tags$f§$r§';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        tags: ''
      }
    });
  });

  it('should decode typed int', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§$t§int$f§age$f§30$r§';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        age: 30
      }
    });
    expect(typeof result.user.age).toBe('number');
  });

  it('should decode typed float', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§product$r§$t§float$f§price$f§19.99$r§';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      product: {
        price: 19.99
      }
    });
    expect(typeof result.product.price).toBe('number');
  });

  it('should decode typed bool', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§$t§bool$f§active$f§true$r§';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        active: true
      }
    });
    expect(typeof result.user.active).toBe('boolean');
  });

  it('should decode typed null', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§$t§null$f§metadata$f§$r§';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        metadata: null
      }
    });
    expect(result.user.metadata).toBeNull();
  });

  it('should decode typed bin', () => {
    const decoder = new LSFDecoder();
    const binaryData = Buffer.from('hello world');
    const b64Data = binaryData.toString('base64');
    const lsfStr = `$o§file$r§$t§bin$f§content$f§${b64Data}$r§`;
    const result = decoder.decode(lsfStr);
    
    expect(Buffer.isBuffer(result.file.content)).toBe(true);
    expect((result.file.content as Buffer).toString()).toBe('hello world');
  });

  it('should handle error markers', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§$f§name$f§John$r§$e§Something went wrong$r§';
    const result = decoder.decode(lsfStr);
    
    // Should still get the valid data
    expect(result).toEqual({
      user: {
        name: 'John'
      }
    });
    
    // And record the error
    expect(decoder.getErrors()).toEqual([
      { message: 'Something went wrong' }
    ]);
  });

  it('should ignore transaction markers', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§$f§name$f§John$r§$x§$r§$o§product$r§$f§name$f§Laptop$r§';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        name: 'John'
      },
      product: {
        name: 'Laptop'
      }
    });
  });

  it('should handle malformed input gracefully', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§$f§name$f§John$r§$t§invalid$f§field$f§value$r§$f§age$f§30$r§';
    const result = decoder.decode(lsfStr);
    
    // Should still get the valid parts
    expect(result.user.name).toBe('John');
    expect(result.user.age).toBe('30');
    
    // And record errors
    expect(decoder.getErrors().length).toBeGreaterThan(0);
  });

  it('should decode a complex structure', () => {
    const decoder = new LSFDecoder();
    const lsfStr = (
      '$o§user$r§' +
      '$f§id$f§123$r§' +
      '$f§name$f§John Doe$r§' +
      '$f§tags$f§admin$l§user$l§editor$r§' +
      '$t§bool$f§active$f§true$r§' +
      '$o§profile$r§' +
      '$f§bio$f§A software developer$r§' +
      '$f§skills$f§Python$l§JavaScript$l§TypeScript$r§'
    );
    
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        id: '123',
        name: 'John Doe',
        tags: ['admin', 'user', 'editor'],
        active: true
      },
      profile: {
        bio: 'A software developer',
        skills: ['Python', 'JavaScript', 'TypeScript']
      }
    });
  });

  it('should decode an empty string to empty object', () => {
    const decoder = new LSFDecoder();
    const result = decoder.decode('');
    expect(result).toEqual({});
  });

  it('should handle whitespace between records', () => {
    const decoder = new LSFDecoder();
    const lsfStr = '$o§user$r§  \n  $f§name$f§John$r§  ';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        name: 'John'
      }
    });
  });

  it('should decode with autoConvertTypes=false', () => {
    const decoder = new LSFDecoder({ autoConvertTypes: false });
    const lsfStr = '$o§user$r§$t§int$f§age$f§30$r§$t§bool$f§active$f§true$r§';
    const result = decoder.decode(lsfStr);
    
    expect(result).toEqual({
      user: {
        age: '30',
        active: 'true'
      }
    });
  });

  it('should throw on error with continueOnError=false', () => {
    const decoder = new LSFDecoder({ continueOnError: false });
    const lsfStr = '$o§user$r§$f§name$f§John$r§$t§nonexistent$f§field$f§value$r§';
    
    expect(() => decoder.decode(lsfStr)).toThrow();
  });
}); 