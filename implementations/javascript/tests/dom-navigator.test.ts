import { describe, it, expect, vi } from 'vitest';
import { DOMBuilder } from '../src/parser/dom-builder';
import { TokenScanner } from '../src/parser/token-scanner';
import { LSFNode, ParseResult, DOMNavigator as IDOMNavigator } from '../src/parser/types';
import { DOMNavigator as DOMNavigatorClass } from '../src/parser/dom-navigator';

const NODE_TYPE = { OBJECT: 0, FIELD: 1, VALUE: 2 };
const CHAR_CODE_ASCII = { s: 115, n: 110, f: 102, b: 98, d: 100 };

// Helper to parse input and get result + navigator for tests
const parseAndGetNavigator = (input: string): { parseResult: ParseResult, navigator: DOMNavigatorClass } => {
    const scanner = new TokenScanner();
    const tokenResult = scanner.scan(input);
    const builder = new DOMBuilder(tokenResult);
    const parseResult = builder.buildDOM();
    // Ensure the navigator in parseResult is the class instance
    return { parseResult, navigator: parseResult.navigator as DOMNavigatorClass }; 
};

describe('DOMNavigator', () => {

  it('should correctly get name for object and field nodes', () => {
    const input = '$o~rootObj$f~fieldA$v~valA';
    const { parseResult, navigator } = parseAndGetNavigator(input);
    
    const rootIndex = parseResult.root; // 0
    const fieldIndex = parseResult.nodes[rootIndex].children[0]; // 1
    const valueIndex = parseResult.nodes[fieldIndex].children[0]; // 2

    expect(navigator.getName(rootIndex)).toBe('rootObj');
    expect(navigator.getName(fieldIndex)).toBe('fieldA');
    expect(navigator.getName(valueIndex)).toBe(''); // Value nodes have no name
  });

  it('should correctly get value for value nodes', () => {
    const input = '$o~rootObj$f~fieldA$v~valA$f~fieldB$v~valB😊';
    const { parseResult, navigator } = parseAndGetNavigator(input);

    const rootIndex = parseResult.root;
    const fieldAIndex = parseResult.nodes[rootIndex].children[0];
    const valueAIndex = parseResult.nodes[fieldAIndex].children[0];
    const fieldBIndex = parseResult.nodes[rootIndex].children[1];
    const valueBIndex = parseResult.nodes[fieldBIndex].children[0];

    expect(navigator.getValue(rootIndex)).toBe(''); // Objects have no value
    expect(navigator.getValue(fieldAIndex)).toBe(''); // Fields have no value
    expect(navigator.getValue(valueAIndex)).toBe('valA');
    expect(navigator.getValue(valueBIndex)).toBe('valB😊'); // Check UTF-8
  });

  it('should correctly get children indices', () => {
    const input = '$o~root$f~f1$v~v1a$v~v1b$f~f2$v~v2a';
    const { parseResult, navigator } = parseAndGetNavigator(input);

    const rootIndex = parseResult.root; // 0
    const f1Index = 1; // Manual index calculation based on expected nodes
    const v1aIndex = 2;
    const v1bIndex = 3;
    const f2Index = 4;
    const v2aIndex = 5;

    expect(navigator.getChildren(rootIndex)).toEqual([f1Index, f2Index]); // Children are fields
    expect(navigator.getChildren(f1Index)).toEqual([v1aIndex, v1bIndex]); // Children are values
    expect(navigator.getChildren(f2Index)).toEqual([v2aIndex]);
    expect(navigator.getChildren(v1aIndex)).toEqual([]); // Values have no children
    expect(navigator.getChildren(v1bIndex)).toEqual([]);
    expect(navigator.getChildren(v2aIndex)).toEqual([]);
  });

  it('should correctly get raw value spans', () => {
    const input = '$o~r$f~f$v~value1';
    const { parseResult, navigator } = parseAndGetNavigator(input);
    const valueIndex = 2;

    const raw = navigator.getRawValue(valueIndex);
    expect(raw.start).toBe(11); // Position after $v~
    expect(raw.length).toBe(6); // Length of 'value1'
    
    // Decode manually to verify
    expect(new TextDecoder().decode(parseResult.buffer.subarray(raw.start, raw.start + raw.length))).toBe('value1');

    // Check for node with no value
    const fieldIndex = 1;
    expect(navigator.getRawValue(fieldIndex)).toEqual({ start: 0, length: 0 }); // Field nodes have no value span
  });

  it('should correctly get node types', () => {
    const input = '$o~r$f~f$v~v';
    const { parseResult, navigator } = parseAndGetNavigator(input);
    expect(navigator.getType(0)).toBe(NODE_TYPE.OBJECT);
    expect(navigator.getType(1)).toBe(NODE_TYPE.FIELD);
    expect(navigator.getType(2)).toBe(NODE_TYPE.VALUE);
  });

  it('should correctly get type hints', () => {
    const input = '$o~r$f~f1$v~v1$t~n$f~f2$v~v2';
    const { parseResult, navigator } = parseAndGetNavigator(input);
    const v1Index = 2;
    const v2Index = 4;

    expect(navigator.getTypeHint(v1Index)).toBe(CHAR_CODE_ASCII.n);
    expect(navigator.getTypeHint(v2Index)).toBe(0); // No hint
    expect(navigator.getTypeHint(0)).toBe(0); // Object has no hint
    expect(navigator.getTypeHint(1)).toBe(0); // Field has no hint
  });

  it('should handle invalid node indices gracefully', () => {
    const input = '$o~r$f~f$v~v';
    const { navigator } = parseAndGetNavigator(input);

    // Spy on console.error for index checks
    const consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(navigator.getName(-1)).toBe('');
    expect(navigator.getValue(100)).toBe('');
    expect(navigator.getChildren(-5)).toEqual([]);
    expect(navigator.getRawValue(99)).toEqual({ start: -1, length: 0 });
    expect(navigator.getType(-2)).toBe(-1);
    expect(navigator.getTypeHint(50)).toBe(0);

    expect(consoleErrSpy).toHaveBeenCalled(); // Check that errors were logged
    consoleErrSpy.mockRestore();
  });

}); 