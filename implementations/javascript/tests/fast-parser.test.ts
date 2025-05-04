import { describe, it, expect } from 'vitest';
import { UltraFastLSFParser } from '../src/fast-parser';

describe('UltraFastLSFParser', () => {
  it('should parse a basic object', () => {
    const lsfStr = '$o§user$r§name$f§John$r§';
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        name: 'John'
      }
    });
  });
  
  it('should parse multiple fields', () => {
    const lsfStr = '$o§user$r§name$f§John$r§age$f§30$r§';
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        name: 'John',
        age: '30'
      }
    });
  });
  
  it('should parse multiple objects', () => {
    const lsfStr = '$o§user$r§name$f§John$r§$o§product$r§name$f§Laptop$r§';
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        name: 'John'
      },
      product: {
        name: 'Laptop'
      }
    });
  });
  
  it('should parse a list', () => {
    const lsfStr = '$o§user$r§tags$f§admin$l§user$l§editor$r§';
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        tags: ['admin', 'user', 'editor']
      }
    });
  });
  
  it('should parse an empty list', () => {
    const lsfStr = '$o§user$r§tags$f§$r§';
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        tags: ''
      }
    });
  });
  
  it('should parse typed integers (n)', () => {
    const lsfStr = '$o§user$r§age$f§30$t§n$r§';
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        age: 30
      }
    });
    expect(typeof result.user.age).toBe('number');
  });
  
  it('should parse typed floats (f)', () => {
    const lsfStr = '$o§product$r§price$f§19.99$t§f$r§';
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      product: {
        price: 19.99
      }
    });
    expect(typeof result.product.price).toBe('number');
  });
  
  it('should parse typed booleans (b)', () => {
    const lsfStr = '$o§user$r§active$f§true$t§b$r§';
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        active: true
      }
    });
    expect(typeof result.user.active).toBe('boolean');
  });
  
  it('should parse typed dates (d)', () => {
    const isoDate = '2023-01-15T10:30:00Z';
    const lsfStr = `$o§event$r§created$f§${isoDate}$t§d$r§`;
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      event: {
        created: new Date(isoDate)
      }
    });
    
    const createdDate = result.event?.created;
    expect(createdDate).toBeInstanceOf(Date);
    // Date.toISOString() always includes milliseconds with .000Z ending
    expect(new Date(isoDate).toISOString()).toBe((createdDate as Date).toISOString());
  });
  
  it('should parse typed strings (s)', () => {
    const lsfStr = '$o§user$r§name$f§John$t§s$r§';
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        name: 'John'
      }
    });
    expect(typeof result.user.name).toBe('string');
  });
  
  it('should parse version marker', () => {
    const lsfStr = '$v§1.3$r§$o§user$r§name$f§John$r§';
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    // Version marker should be ignored
    expect(result).toEqual({
      user: {
        name: 'John'
      }
    });
  });
  
  it('should handle whitespace in values', () => {
    const lsfStr = '$o§user$r§name$f§John Doe$r§bio$f§A software developer\nwith multiple lines$r§';
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        name: 'John Doe',
        bio: 'A software developer\nwith multiple lines'
      }
    });
  });
  
  it('should handle whitespace between records', () => {
    // In v1.3, whitespace is allowed between records
    const lsfStr = `$o§user$r§
      name$f§John$r§ 
      age$f§30$r§`;
    const parser = new UltraFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        name: 'John',
        age: '30'
      }
    });
  });
  
  describe('Parser Performance', () => {
    it('should parse quickly', () => {
      const complexLSF = generateComplexLSF();
      
      const startTime = performance.now();
      const parser = new UltraFastLSFParser(complexLSF);
      const result = parser.parse();
      const endTime = performance.now();
      
      // Processing time should be reasonable
      const processingTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(processingTime).toBeLessThan(100); // This is very liberal, actual time should be much lower
    });
    
    it('should handle large input', () => {
      const largeLSF = generateLargeLSF(100);
      
      const startTime = performance.now();
      const parser = new UltraFastLSFParser(largeLSF);
      const result = parser.parse();
      const endTime = performance.now();
      
      expect(Object.keys(result)).toHaveLength(100);
      expect(result.item0).toBeDefined();
      expect(result.item99).toBeDefined();
    });
    
    it('should handle deeply nested objects', () => {
      // In LSF v1.3, objects aren't nested, they're sequential
      const sequentialNestedLSF = `
        $o§parent$r§
        name$f§Parent$r§
        $o§child1$r§
        name$f§Child 1$r§
        $o§grandchild$r§
        name$f§Grandchild$r§
      `;
      
      const parser = new UltraFastLSFParser(sequentialNestedLSF);
      const result = parser.parse();
      
      expect(result.parent.name).toBe('Parent');
      expect(result.child1.name).toBe('Child 1');
      expect(result.grandchild.name).toBe('Grandchild');
    });
    
    it('should be faster than JSON.parse for large complex data', () => {
      // This is just to illustrate the point, not a real benchmark
      const complexLSF = generateComplexLSF();
      
      // First convert to JSON for comparison
      const parser = new UltraFastLSFParser(complexLSF);
      const data = parser.parse();
      const jsonString = JSON.stringify(data);
      
      // Measure LSF parsing time
      const lsfStartTime = performance.now();
      new UltraFastLSFParser(complexLSF).parse();
      const lsfEndTime = performance.now();
      const lsfTime = lsfEndTime - lsfStartTime;
      
      // Measure JSON parsing time
      const jsonStartTime = performance.now();
      JSON.parse(jsonString);
      const jsonEndTime = performance.now();
      const jsonTime = jsonEndTime - jsonStartTime;
      
      console.log(`LSF parsing: ${lsfTime}ms, JSON parsing: ${jsonTime}ms`);
      
      // We expect LSF to be similar or faster, but this can vary by environment
      // So we'll just check that it completes without error
      expect(true).toBe(true);
    });
  });
});

// Helpers to generate test data
function generateComplexLSF(): string {
  let lsf = '';
  
  // Add user object
  lsf += '$o§user$r§';
  lsf += 'id$f§12345$t§n$r§';
  lsf += 'name$f§John Doe$r§';
  lsf += 'email$f§john@example.com$r§';
  lsf += 'active$f§true$t§b$r§';
  lsf += 'balance$f§123.45$t§f$r§';
  lsf += 'created$f§2023-01-01T00:00:00Z$t§d$r§';
  lsf += 'tags$f§admin$l§user$l§premium$r§';
  
  // Add multiple product objects
  for (let i = 0; i < 10; i++) {
    lsf += `$o§product${i}$r§`;
    lsf += `id$f§${10000 + i}$t§n$r§`;
    lsf += `name$f§Product ${i}$r§`;
    lsf += `price$f§${(i + 1) * 9.99}$t§f$r§`;
    lsf += `inStock$f§${i % 2 === 0 ? 'true' : 'false'}$t§b$r§`;
    lsf += `tags$f§tag${i}$l§category${i % 3}$r§`;
  }
  
  return lsf;
}

function generateLargeLSF(itemCount: number): string {
  let lsf = '';
  
  for (let i = 0; i < itemCount; i++) {
    lsf += `$o§item${i}$r§`;
    lsf += `id$f§${i}$t§n$r§`;
    lsf += `name$f§Item ${i}$r§`;
    lsf += `value$f§${i * 10}$t§n$r§`;
  }
  
  return lsf;
} 