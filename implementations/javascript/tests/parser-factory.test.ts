import { describe, it, expect } from 'vitest';
import { getParser, parse, LSFParserType, LSFParser } from '../src/parser-factory';
import { UltraFastLSFParser } from '../src/fast-parser';
import { HyperFastLSFParser } from '../src/hyper-fast-parser';

describe('LSF Parser Factory', () => {
  const smallLSF = '$o§user$r§name$f§John$r§age$f§30$r§';
  // Medium-sized LSF for testing auto-selection between UltraFastLSFParser and standard parser
  const mediumLSF = `$o§data$r§${Array(200).fill('key$f§value$r§').join('')}`;
  // Very large LSF for testing auto-selection with HyperFastLSFParser
  const largeLSF = `$o§data$r§${Array(2000).fill('key$f§value$r§').join('')}`;
  
  it('should create a standard parser', () => {
    const parser = getParser(smallLSF, LSFParserType.STANDARD);
    expect(parser).toBeDefined();
    expect(typeof parser.parse).toBe('function');
    
    const result = parser.parse();
    expect(result).toEqual({
      user: {
        name: 'John',
        age: '30'
      }
    });
  });
  
  it('should create a fast parser', () => {
    const parser = getParser(smallLSF, LSFParserType.FAST);
    expect(parser).toBeDefined();
    expect(typeof parser.parse).toBe('function');
    expect(parser).toBeInstanceOf(UltraFastLSFParser);
    
    const result = parser.parse();
    expect(result).toEqual({
      user: {
        name: 'John',
        age: '30'
      }
    });
  });
  
  it('should create a hyper fast parser', () => {
    const parser = getParser(smallLSF, LSFParserType.HYPER);
    expect(parser).toBeDefined();
    expect(typeof parser.parse).toBe('function');
    expect(parser).toBeInstanceOf(HyperFastLSFParser);
    
    const result = parser.parse();
    expect(result).toEqual({
      user: {
        name: 'John',
        age: '30'
      }
    });
  });
  
  it('should auto-select parser based on input size', () => {
    // For small input
    const smallParser = getParser(smallLSF);
    expect(smallParser).toBeDefined();
    
    // For medium input (should use UltraFastLSFParser)
    const mediumParser = getParser(mediumLSF);
    expect(mediumParser).toBeDefined();
    expect(mediumParser).toBeInstanceOf(UltraFastLSFParser);
    
    // For large input (should use HyperFastLSFParser)
    const largeParser = getParser(largeLSF);
    expect(largeParser).toBeDefined();
    expect(largeParser).toBeInstanceOf(HyperFastLSFParser);
    
    // Verify all parsers work
    const smallResult = smallParser.parse();
    expect(smallResult.user.name).toBe('John');
    
    const mediumResult = mediumParser.parse();
    expect(mediumResult.data).toBeDefined();
    
    const largeResult = largeParser.parse();
    expect(largeResult.data).toBeDefined();
  });
  
  it('should parse LSF directly with parse function', () => {
    const result = parse(smallLSF);
    expect(result).toEqual({
      user: {
        name: 'John',
        age: '30'
      }
    });
  });
  
  it('should parse with specified parser type', () => {
    const resultStandard = parse(smallLSF, LSFParserType.STANDARD);
    expect(resultStandard.user.name).toBe('John');
    
    const resultFast = parse(smallLSF, LSFParserType.FAST);
    expect(resultFast.user.name).toBe('John');
    
    const resultHyper = parse(smallLSF, LSFParserType.HYPER);
    expect(resultHyper.user.name).toBe('John');
    
    const resultAuto = parse(smallLSF, LSFParserType.AUTO);
    expect(resultAuto.user.name).toBe('John');
  });
  
  it('should handle deeply nested objects', () => {
    const nestedLSF = '$o§parent$r§name$f§Parent$r§$o§child1$r§name$f§Child 1$r§$o§grandchild$r§name$f§Grandchild$r§';
    
    const result = parse(nestedLSF);
    
    expect(result.parent.name).toBe('Parent');
    expect(result.child1.name).toBe('Child 1');
    expect(result.grandchild.name).toBe('Grandchild');
  });
  
  it('should handle various data types', () => {
    const typedLSF = '$o§data$r§int$f§42$t§n$r§float$f§3.14$t§f$r§bool$f§true$t§b$r§date$f§2023-01-15T10:30:00Z$t§d$r§string$f§Hello World$r§';
    
    const result = parse(typedLSF);
    
    expect(result.data.int).toBe(42);
    expect(result.data.float).toBe(3.14);
    expect(result.data.bool).toBe(true);
    expect(result.data.date).toBeInstanceOf(Date);
    expect(result.data.string).toBe('Hello World');
  });
  
  it('should handle lists', () => {
    const lsfWithList = '$o§user$r§tags$f§admin$l§user$l§editor$r§';
    
    const result = parse(lsfWithList);
    
    expect(result.user.tags).toEqual(['admin', 'user', 'editor']);
  });
  
  it('should handle complex mixed content', () => {
    const complex = '$o§user$r§id$f§123$t§n$r§name$f§John$r§roles$f§admin$l§editor$r§active$f§true$t§b$r§$o§settings$r§theme$f§dark$r§notifications$f§true$t§b$r§$o§profile$r§bio$f§A software developer$r§joined$f§2023-01-01T00:00:00Z$t§d$r§';
    
    const result = parse(complex);
    
    expect(result.user.id).toBe(123);
    expect(result.user.name).toBe('John');
    expect(result.user.roles).toEqual(['admin', 'editor']);
    expect(result.user.active).toBe(true);
    expect(result.settings.theme).toBe('dark');
    expect(result.settings.notifications).toBe(true);
    expect(result.profile.bio).toBe('A software developer');
    expect(result.profile.joined).toBeInstanceOf(Date);
  });
  
  it('should handle whitespace between records', () => {
    const lsfWithWhitespace = '$o§user$r§name$f§John$r§age$f§30$r§';
    
    const result = parse(lsfWithWhitespace);
    
    expect(result).toEqual({
      user: {
        name: 'John',
        age: '30'
      }
    });
  });
  
  it('should handle version markers', () => {
    const lsfWithVersion = '$v§1.3$r§$o§user$r§name$f§John$r§';
    
    const result = parse(lsfWithVersion);
    
    expect(result).toEqual({
      user: {
        name: 'John'
      }
    });
  });
}); 