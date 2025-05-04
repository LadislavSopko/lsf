import { describe, it, expect } from 'vitest';
import { LSFDecoder } from '../src/decoder';

describe('LSFDecoder', () => {
  it('should decode a basic object', () => {
    const lsfStr = '$o§user$r§name$f§John$r§';
    const decoder = new LSFDecoder();
    const result = decoder.decode(lsfStr);

    expect(result).toEqual({
      user: {
        name: 'John'
      }
    });
  });

  it('should decode multiple fields', () => {
    const lsfStr = '$o§user$r§name$f§John$r§age$f§30$r§';
    const decoder = new LSFDecoder();
    const result = decoder.decode(lsfStr);

    expect(result).toEqual({
      user: {
        name: 'John',
        age: '30'
      }
    });
  });

  it('should decode multiple objects', () => {
    const lsfStr = '$o§user$r§name$f§John$r§$o§product$r§name$f§Laptop$r§';
    const decoder = new LSFDecoder();
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
    const lsfStr = '$o§user$r§tags$f§admin$l§user$l§editor$r§';
    const decoder = new LSFDecoder();
    const result = decoder.decode(lsfStr);

    expect(result).toEqual({
      user: {
        tags: ['admin', 'user', 'editor']
      }
    });
  });

  it('should decode an empty list', () => {
    const lsfStr = '$o§user$r§tags$f§$r§';
    const decoder = new LSFDecoder();
    const result = decoder.decode(lsfStr);

    expect(result).toEqual({
      user: {
        tags: ''
      }
    });
  });

  it('should decode typed int', () => {
    const lsfStr = '$o§user$r§age$f§30$t§n$r§';
    const decoder = new LSFDecoder();
    const result = decoder.decode(lsfStr);

    expect(result).toEqual({
      user: {
        age: 30
      }
    });
  });

  it('should decode typed float', () => {
    const lsfStr = '$o§product$r§price$f§19.99$t§f$r§';
    const decoder = new LSFDecoder();
    const result = decoder.decode(lsfStr);

    expect(result).toEqual({
      product: {
        price: 19.99
      }
    });
  });

  it('should decode typed bool', () => {
    const lsfStr = '$o§user$r§active$f§true$t§b$r§';
    const decoder = new LSFDecoder();
    const result = decoder.decode(lsfStr);

    expect(result).toEqual({
      user: {
        active: true
      }
    });
  });

  it('should decode typed date', () => {
    const lsfStr = '$o§event$r§date$f§2023-01-15T10:30:00Z$t§d$r§';
    const decoder = new LSFDecoder();
    const result = decoder.decode(lsfStr);

    expect(result).toEqual({
      event: {
        date: new Date('2023-01-15T10:30:00Z')
      }
    });
  });

  it('should decode typed bin', () => {
    const data = 'hello world';
    const base64Data = Buffer.from(data).toString('base64');
    const lsfStr = `$o§file$r§content$f§${base64Data}$t§s$r§`;
    const decoder = new LSFDecoder();
    const result = decoder.decode(lsfStr);

    // Binary data is just treated as a string in v1.3
    expect(result.file.content).toBe(base64Data);
  });

  it('should handle error markers', () => {
    const lsfStr = '$o§user$r§name$f§John$r§';
    const decoder = new LSFDecoder();
    const result = decoder.decode(lsfStr);

    // Should still get the valid data
    expect(result).toEqual({
      user: {
        name: 'John'
      }
    });
  });

  it('should ignore transaction markers', () => {
    const lsfStr = '$o§user$r§name$f§John$r§$o§product$r§name$f§Laptop$r§';
    const decoder = new LSFDecoder();
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
    const lsfStr = '$o§user$r§name$f§John$r§age$f§30$r§$invalidformat$xyz';
    const decoder = new LSFDecoder({ continueOnError: true });
    const result = decoder.decode(lsfStr);

    // Should still get the valid parts
    expect(result.user.name).toBe('John');
    expect(result.user.age).toBe('30');

    // And have an error
    const errors = decoder.getErrors();
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should decode a complex structure', () => {
    const lsfStr = (
      '$o§user$r§' +
      'id$f§123$r§' +
      'name$f§John Doe$r§' +
      'tags$f§admin$l§user$l§editor$r§' +
      'active$f§true$t§b$r§' +
      '$o§profile$r§' +
      'bio$f§A software developer$r§' +
      'skills$f§Python$l§JavaScript$l§TypeScript$r§'
    );
    const decoder = new LSFDecoder();
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

  it('should handle whitespace between records', () => {
    const lsfStr = '$o§user$r§\n  name$f§John$r§\n  age$f§30$r§';
    const decoder = new LSFDecoder();
    const result = decoder.decode(lsfStr);

    expect(result).toEqual({
      user: {
        name: 'John',
        age: '30'
      }
    });
  });

  it('should decode with autoConvertTypes=false', () => {
    const lsfStr = '$o§user$r§age$f§30$t§n$r§active$f§true$t§b$r§';
    const decoder = new LSFDecoder({ autoConvertTypes: false });
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
    const lsfStr = '$o§user$r§name$f§John$r§$invalid§format$r§';

    expect(() => decoder.decode(lsfStr)).toThrow();
  });
}); 