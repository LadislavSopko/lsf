import { describe, bench, expect, it } from 'vitest';
import { TokenScanner } from '../src/parser/token-scanner';
import { DOMBuilder } from '../src/parser/dom-builder';
// Removed LSFToJSONVisitor import as it's not benchmarked directly here
// import { LSFToJSONVisitor } from '../src/parser/visitor'; 
import { ParseResult } from '../src/parser/types';

// --- Test Data ---
// A moderately complex string
const lsfInput = '$o~userProfile' +
  '$f~userId$v~12345$t~n' +
  '$f~username$v~testuser' +
  '$f~email$v~test@example.com' +
  '$f~isActive$v~true$t~b' +
  '$f~roles$v~admin$v~editor$v~viewer' +
  '$f~lastLogin$v~2024-01-15T10:30:00Z$t~d' + // Date hint (treated as string by current visitor)
  '$f~preferences$o~prefs' + // Note: Plan says no nested objects, but parser might handle this level.
    '$f~theme$v~dark' +
    '$f~notifications$v~true$t~b' +
  '$f~rating$v~4.7$t~f';

// Equivalent JSON data for comparison
const jsonInput = JSON.stringify({
  userId: 12345,
  username: 'testuser',
  email: 'test@example.com',
  isActive: true,
  roles: ['admin', 'editor', 'viewer'],
  lastLogin: '2024-01-15T10:30:00Z', // Treated as string by LSF visitor currently
  preferences: { // Assuming visitor handles nested object created by $o~prefs
    theme: 'dark',
    notifications: true
  },
  rating: 4.7
});

// --- Parsing Functions (kept parseLSFToJSON for sanity check) ---
const parseLSFToJSON = (input: string): string => { 
    const scanner = new TokenScanner();
    const tokenResult = scanner.scan(input);
    const builder = new DOMBuilder(tokenResult);
    const parseResult = builder.buildDOM();
    // Need visitor for full conversion, but benchmark stops earlier
    // const visitor = new LSFToJSONVisitor(parseResult);
    // return visitor.buildJSON();
    return ""; // Return dummy value for sanity check if needed 
};

// Function for LSF Scan + Build benchmark
const parseLSFToDOM = (input: string): ParseResult => {
    const scanner = new TokenScanner();
    const tokenResult = scanner.scan(input);
    const builder = new DOMBuilder(tokenResult);
    return builder.buildDOM(); // Stop after DOM build
};

// --- Benchmark Suite ---
describe('LSF Parser Performance vs JSON.parse (DOM Build Only)', () => {

  // Benchmark LSF Scan + Build DOM
  bench('LSF Scan + Build DOM', () => {
    parseLSFToDOM(lsfInput);
  });

  // Benchmark native JSON.parse
  bench('Native JSON.parse', () => {
    JSON.parse(jsonInput);
  });

  // Benchmark individual LSF components 
  bench('LSF TokenScanner Only', () => {
      const scanner = new TokenScanner();
      scanner.scan(lsfInput);
  });

  bench('LSF DOMBuilder Only (after scan)', () => {
      const scanner = new TokenScanner();
      const tokenResult = scanner.scan(lsfInput);
      const builder = new DOMBuilder(tokenResult);
      builder.buildDOM();
  });

  // Sanity checks (parseLSFToJSON needs update if used here)
  it('should produce valid DOM for LSF test data', () => { 
      const parseResult = parseLSFToDOM(lsfInput);
      expect(parseResult).toBeDefined();
      expect(parseResult.root).not.toBe(-1);
      expect(parseResult.nodes.length).toBeGreaterThan(0);
      // Check a known value using the navigator from the result
      const username = parseResult.navigator.getValue(parseResult.nodes[parseResult.root].children[1]); // Index 1 = username field -> value
      expect(username).toBe('testuser');
  });

  it('should parse JSON test data correctly', () => {
      const parsedJson = JSON.parse(jsonInput);
      expect(parsedJson.username).toBe('testuser');
      expect(parsedJson.roles).toEqual(['admin', 'editor', 'viewer']);
      expect(parsedJson.preferences.theme).toBe('dark');
  });

}); 