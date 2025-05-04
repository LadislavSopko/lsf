import { describe, it, expect, beforeEach } from 'vitest';
import { HyperFastLSFParser, hyperParse } from '../src/hyper-fast-parser';
import { UltraFastLSFParser } from '../src/fast-parser';

describe('HyperFastLSFParser', () => {
  // Basic functionality tests
  it('should parse a basic object', () => {
    const lsfStr = '$o§user$r§name$f§John$r§';
    const parser = new HyperFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        name: 'John'
      }
    });
  });
  
  it('should parse multiple fields', () => {
    const lsfStr = '$o§user$r§name$f§John$r§age$f§30$r§';
    const parser = new HyperFastLSFParser(lsfStr);
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
    const parser = new HyperFastLSFParser(lsfStr);
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
    const parser = new HyperFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      user: {
        tags: ['admin', 'user', 'editor']
      }
    });
  });
  
  it('should parse typed values', () => {
    const lsfStr = '$o§data$r§int$f§42$t§n$r§float$f§3.14$t§f$r§bool$f§true$t§b$r§';
    const parser = new HyperFastLSFParser(lsfStr);
    const result = parser.parse();
    
    expect(result).toEqual({
      data: {
        int: 42,
        float: 3.14,
        bool: true
      }
    });
  });
  
  // Performance tests
  describe('Performance Comparison', () => {
    let smallLSF: string;
    let mediumLSF: string;
    let largeLSF: string;
    let smallJSON: string;
    let mediumJSON: string;
    let largeJSON: string;
    
    // Generate test data once before tests
    beforeEach(() => {
      // Small data (single object, few fields)
      const smallData = {
        user: {
          id: 123,
          name: 'John Doe',
          email: 'john@example.com',
          active: true
        }
      };
      
      // Medium data (100 objects with several fields each)
      const mediumData: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        mediumData[`item${i}`] = {
          id: i,
          name: `Item ${i}`,
          value: i * 10,
          active: i % 2 === 0
        };
      }
      
      // Large data (1000 objects with many fields and some nesting)
      const largeData: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largeData[`item${i}`] = {
          id: i,
          guid: `guid-${i}-${Date.now()}`,
          name: `Item with a somewhat longer name ${i}`,
          value: i * 10,
          date: new Date(2023, 0, i % 30 + 1).toISOString(),
          tags: [`tag${i % 10}`, `category${i % 5}`, `type${i % 3}`],
          isSpecial: i % 7 === 0,
          score: (i % 100) / 10
        };
      }
      
      // Convert to JSON
      smallJSON = JSON.stringify(smallData);
      mediumJSON = JSON.stringify(mediumData);
      largeJSON = JSON.stringify(largeData);
      
      // Convert to LSF (simplified for testing)
      smallLSF = generateLSF(smallData);
      mediumLSF = generateLSF(mediumData);
      largeLSF = generateLSF(largeData);
    });
    
    it('should parse small data faster than standard LSF parser', () => {
      // Warm up
      new UltraFastLSFParser(smallLSF).parse();
      new HyperFastLSFParser(smallLSF).parse();
      
      // Time UltraFastLSFParser
      const ultra_start = performance.now();
      for (let i = 0; i < 1000; i++) {
        new UltraFastLSFParser(smallLSF).parse();
      }
      const ultra_end = performance.now();
      const ultra_time = ultra_end - ultra_start;
      
      // Time HyperFastLSFParser
      const hyper_start = performance.now();
      for (let i = 0; i < 1000; i++) {
        new HyperFastLSFParser(smallLSF).parse();
      }
      const hyper_end = performance.now();
      const hyper_time = hyper_end - hyper_start;
      
      console.log(`Small data: UltraFast ${ultra_time.toFixed(2)}ms, HyperFast ${hyper_time.toFixed(2)}ms`);
      expect(hyper_time).toBeLessThanOrEqual(ultra_time * 1.2); // Allow some variance
    });
    
    it('should parse medium data faster than standard LSF parser', () => {
      // Warm up
      new UltraFastLSFParser(mediumLSF).parse();
      new HyperFastLSFParser(mediumLSF).parse();
      
      // Time UltraFastLSFParser
      const ultra_start = performance.now();
      for (let i = 0; i < 100; i++) {
        new UltraFastLSFParser(mediumLSF).parse();
      }
      const ultra_end = performance.now();
      const ultra_time = ultra_end - ultra_start;
      
      // Time HyperFastLSFParser
      const hyper_start = performance.now();
      for (let i = 0; i < 100; i++) {
        new HyperFastLSFParser(mediumLSF).parse();
      }
      const hyper_end = performance.now();
      const hyper_time = hyper_end - hyper_start;
      
      console.log(`Medium data: UltraFast ${ultra_time.toFixed(2)}ms, HyperFast ${hyper_time.toFixed(2)}ms`);
      expect(hyper_time).toBeLessThanOrEqual(ultra_time * 1.1); // Allow less variance
    });
    
    it('should parse large data faster than standard LSF parser', () => {
      // Warm up
      new UltraFastLSFParser(largeLSF).parse();
      new HyperFastLSFParser(largeLSF).parse();
      
      // Time UltraFastLSFParser
      const ultra_start = performance.now();
      for (let i = 0; i < 10; i++) {
        new UltraFastLSFParser(largeLSF).parse();
      }
      const ultra_end = performance.now();
      const ultra_time = ultra_end - ultra_start;
      
      // Time HyperFastLSFParser
      const hyper_start = performance.now();
      for (let i = 0; i < 10; i++) {
        new HyperFastLSFParser(largeLSF).parse();
      }
      const hyper_end = performance.now();
      const hyper_time = hyper_end - hyper_start;
      
      console.log(`Large data: UltraFast ${ultra_time.toFixed(2)}ms, HyperFast ${hyper_time.toFixed(2)}ms`);
      expect(hyper_time).toBeLessThan(ultra_time); // Should be measurably faster
    });
    
    it('should compare against JSON.parse performance', () => {
      // Warm up
      JSON.parse(largeJSON);
      new HyperFastLSFParser(largeLSF).parse();
      
      // Time JSON.parse
      const json_start = performance.now();
      for (let i = 0; i < 10; i++) {
        JSON.parse(largeJSON);
      }
      const json_end = performance.now();
      const json_time = json_end - json_start;
      
      // Time HyperFastLSFParser
      const hyper_start = performance.now();
      for (let i = 0; i < 10; i++) {
        new HyperFastLSFParser(largeLSF).parse();
      }
      const hyper_end = performance.now();
      const hyper_time = hyper_end - hyper_start;
      
      console.log(`JSON vs LSF (large data): JSON ${json_time.toFixed(2)}ms, HyperFast ${hyper_time.toFixed(2)}ms`);
      // Not asserting specific performance here, just logging for comparison
    });
    
    it('should provide a convenient parse function', () => {
      const result = hyperParse(smallLSF);
      expect(result.user).toBeDefined();
    });
  });
});

// Helper function to generate LSF data for testing
// This is a simplified version just for the tests
function generateLSF(data: Record<string, any>): string {
  let lsf = '';
  
  for (const [objName, objValue] of Object.entries(data)) {
    lsf += `$o§${objName}$r§`;
    
    for (const [key, value] of Object.entries(objValue)) {
      if (Array.isArray(value)) {
        lsf += `${key}$f§${value.join('$l§')}$r§`;
      } else if (typeof value === 'number' && Number.isInteger(value)) {
        lsf += `${key}$f§${value}$t§n$r§`;
      } else if (typeof value === 'number') {
        lsf += `${key}$f§${value}$t§f$r§`;
      } else if (typeof value === 'boolean') {
        lsf += `${key}$f§${value}$t§b$r§`;
      } else if (value instanceof Date) {
        lsf += `${key}$f§${value.toISOString()}$t§d$r§`;
      } else {
        lsf += `${key}$f§${value}$r§`;
      }
    }
  }
  
  return lsf;
} 