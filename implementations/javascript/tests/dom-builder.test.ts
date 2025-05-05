import { describe, it, expect, vi } from 'vitest';
import { DOMBuilder } from '../src/parser/dom-builder';
import { TokenScanner, TokenScanResult } from '../src/parser/token-scanner';
import { LSFNode, ParseResult } from '../src/parser/types';

// Constants for node types & char codes for easier assertion
const NODE_TYPE = {
  OBJECT: 0,
  FIELD: 1,
  VALUE: 2,
};
const CHAR_CODE_ASCII = {
    s: 115,
    n: 110,
    f: 102,
    b: 98,
    d: 100,
};

// Helper function to get name/value string (will be part of DOMNavigator later)
function getNodeName(node: LSFNode, buffer: Uint8Array): string {
    if (node.nameLength === 0) return '';
    return new TextDecoder().decode(buffer.subarray(node.nameStart, node.nameStart + node.nameLength));
}
function getNodeValue(node: LSFNode, buffer: Uint8Array): string {
    if (node.valueLength === 0) return '';
    return new TextDecoder().decode(buffer.subarray(node.valueStart, node.valueStart + node.valueLength));
}
function getChildren(node: LSFNode, parseResult: ParseResult): LSFNode[] {
    if (!node || !node.children) return [];
    return node.children.map(childIndex => parseResult.nodes[childIndex]);
}

describe('DOMBuilder', () => {

  // Helper function to create TokenScanResult for tests
  const createTokenScanResult = (input: string): TokenScanResult => {
      const scanner = new TokenScanner();
      return scanner.scan(input);
  };

  it('should build a simple DOM for a basic object', () => {
    const input = '$o~root$f~name$v~value';
    const tokenResult = createTokenScanResult(input);
    const builder = new DOMBuilder(tokenResult);
    const parseResult = builder.buildDOM();

    expect(parseResult).toBeDefined();
    expect(parseResult.root).toBe(0);
    expect(parseResult.nodes.length).toBe(3); // obj, field, value

    const rootNode = parseResult.nodes[parseResult.root];
    expect(rootNode.type).toBe(NODE_TYPE.OBJECT);
    expect(getNodeName(rootNode, parseResult.buffer)).toBe('root');
    expect(rootNode.children.length).toBe(1);

    const fields = getChildren(rootNode, parseResult);
    expect(fields.length).toBe(1);
    const fieldNode = fields[0];
    expect(fieldNode.type).toBe(NODE_TYPE.FIELD);
    expect(getNodeName(fieldNode, parseResult.buffer)).toBe('name');
    expect(fieldNode.children.length).toBe(1);

    const values = getChildren(fieldNode, parseResult);
    expect(values.length).toBe(1);
    const valueNode = values[0];
    expect(valueNode.type).toBe(NODE_TYPE.VALUE);
    expect(getNodeValue(valueNode, parseResult.buffer)).toBe('value');
    expect(valueNode.children.length).toBe(0);
    expect(valueNode.typeHint).toBe(0);
  });

  it('should handle implicit arrays (multiple values for one field)', () => {
    const input = '$o~data$f~items$v~apple$v~banana$v~cherry';
    const tokenResult = createTokenScanResult(input);
    const builder = new DOMBuilder(tokenResult);
    const parseResult = builder.buildDOM();

    expect(parseResult.root).toBe(0);
    expect(parseResult.nodes.length).toBe(5); // obj, field, value, value, value

    const rootNode = parseResult.nodes[parseResult.root];
    expect(rootNode.children.length).toBe(1);
    const fieldNode = getChildren(rootNode, parseResult)[0];

    expect(fieldNode.type).toBe(NODE_TYPE.FIELD);
    expect(getNodeName(fieldNode, parseResult.buffer)).toBe('items');
    expect(fieldNode.children.length).toBe(3);

    const values = getChildren(fieldNode, parseResult);
    expect(values.length).toBe(3);
    expect(values[0].type).toBe(NODE_TYPE.VALUE);
    expect(getNodeValue(values[0], parseResult.buffer)).toBe('apple');
    expect(values[1].type).toBe(NODE_TYPE.VALUE);
    expect(getNodeValue(values[1], parseResult.buffer)).toBe('banana');
    expect(values[2].type).toBe(NODE_TYPE.VALUE);
    expect(getNodeValue(values[2], parseResult.buffer)).toBe('cherry');
  });

  it('should handle type hints correctly', () => {
    const input = '$o~config$f~count$v~10$t~n$f~enabled$v~true$t~b$f~rate$v~0.5$t~f';
    const tokenResult = createTokenScanResult(input);
    const builder = new DOMBuilder(tokenResult);
    const parseResult = builder.buildDOM();

    expect(parseResult.nodes.length).toBe(7);
    const root = parseResult.nodes[parseResult.root];
    const fields = getChildren(root, parseResult);
    expect(fields.length).toBe(3);

    const countValue = getChildren(fields[0], parseResult)[0];
    expect(getNodeValue(countValue, parseResult.buffer)).toBe('10');
    expect(countValue.typeHint).toBe(CHAR_CODE_ASCII.n);

    const enabledValue = getChildren(fields[1], parseResult)[0];
    expect(getNodeValue(enabledValue, parseResult.buffer)).toBe('true');
    expect(enabledValue.typeHint).toBe(CHAR_CODE_ASCII.b);

    const rateValue = getChildren(fields[2], parseResult)[0];
    expect(getNodeValue(rateValue, parseResult.buffer)).toBe('0.5');
    expect(rateValue.typeHint).toBe(CHAR_CODE_ASCII.f);
  });

  it('should create implicit object if input starts with $f~', () => {
    const input = '$f~fieldA$v~valueA';
    const tokenResult = createTokenScanResult(input);
    const builder = new DOMBuilder(tokenResult);
    const parseResult = builder.buildDOM();

    expect(parseResult.root).toBe(0);
    expect(parseResult.nodes.length).toBe(3);
    const rootNode = parseResult.nodes[parseResult.root];
    expect(rootNode.type).toBe(NODE_TYPE.OBJECT);
    expect(getNodeName(rootNode, parseResult.buffer)).toBe('');
    expect(rootNode.children.length).toBe(1);

    const fieldNode = getChildren(rootNode, parseResult)[0];
    expect(getNodeName(fieldNode, parseResult.buffer)).toBe('fieldA');
    expect(fieldNode.children.length).toBe(1);
    expect(getNodeValue(getChildren(fieldNode, parseResult)[0], parseResult.buffer)).toBe('valueA');
  });

  it('should create implicit field if $v~ follows $o~', () => {
    const input = '$o~myObj$v~valueB';
    const tokenResult = createTokenScanResult(input);
    const builder = new DOMBuilder(tokenResult);
    const parseResult = builder.buildDOM();

    expect(parseResult.root).toBe(0);
    expect(parseResult.nodes.length).toBe(3);
    const rootNode = parseResult.nodes[parseResult.root];
    expect(getNodeName(rootNode, parseResult.buffer)).toBe('myObj');
    expect(rootNode.children.length).toBe(1);

    const fieldNode = getChildren(rootNode, parseResult)[0];
    expect(fieldNode.type).toBe(NODE_TYPE.FIELD);
    expect(getNodeName(fieldNode, parseResult.buffer)).toBe('');
    expect(fieldNode.children.length).toBe(1);

    const valueNode = getChildren(fieldNode, parseResult)[0];
    expect(getNodeValue(valueNode, parseResult.buffer)).toBe('valueB');
  });

  it('should create implicit object and field if input starts with $v~', () => {
    const input = '$v~valueC';
    const tokenResult = createTokenScanResult(input);
    const builder = new DOMBuilder(tokenResult);
    const parseResult = builder.buildDOM();

    expect(parseResult.root).toBe(0);
    expect(parseResult.nodes.length).toBe(3);
    const rootNode = parseResult.nodes[parseResult.root];
    expect(getNodeName(rootNode, parseResult.buffer)).toBe('');
    expect(rootNode.children.length).toBe(1);

    const fieldNode = getChildren(rootNode, parseResult)[0];
    expect(getNodeName(fieldNode, parseResult.buffer)).toBe('');
    expect(fieldNode.children.length).toBe(1);

    const valueNode = getChildren(fieldNode, parseResult)[0];
    expect(getNodeValue(valueNode, parseResult.buffer)).toBe('valueC');
  });

  it('should handle multiple top-level objects', () => {
    const input = '$o~obj1$f~a$v~1$o~obj2$f~b$v~2';
    const tokenResult = createTokenScanResult(input);
    const builder = new DOMBuilder(tokenResult);
    const parseResult = builder.buildDOM();

    expect(parseResult.root).toBe(0);
    expect(parseResult.nodes.length).toBe(6);

    const obj1Node = parseResult.nodes[0];
    expect(getNodeName(obj1Node, parseResult.buffer)).toBe('obj1');
    const fields1 = getChildren(obj1Node, parseResult);
    expect(fields1.length).toBe(1);
    expect(getNodeName(fields1[0], parseResult.buffer)).toBe('a');
    expect(getNodeValue(getChildren(fields1[0], parseResult)[0], parseResult.buffer)).toBe('1');

    const obj2Node = parseResult.nodes[3];
    expect(obj2Node.type).toBe(NODE_TYPE.OBJECT);
    expect(getNodeName(obj2Node, parseResult.buffer)).toBe('obj2');
    const fields2 = getChildren(obj2Node, parseResult);
    expect(fields2.length).toBe(1);
    expect(getNodeName(fields2[0], parseResult.buffer)).toBe('b');
    expect(getNodeValue(getChildren(fields2[0], parseResult)[0], parseResult.buffer)).toBe('2');
  });

  it('should ignore standalone $t~ tokens with warning', () => {
    const input = '$o~obj$t~n$f~field$v~val$t~s';
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const tokenResult = createTokenScanResult(input);
    const builder = new DOMBuilder(tokenResult);
    const parseResult = builder.buildDOM();

    expect(parseResult.nodes.length).toBe(3);
    const root = parseResult.nodes[parseResult.root];
    const field = getChildren(root, parseResult)[0];
    const value = getChildren(field, parseResult)[0];

    expect(value.typeHint).toBe(CHAR_CODE_ASCII.s);
    
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Standalone $t~ token encountered'));

    consoleWarnSpy.mockRestore();
  });

});

// Helper function to get name/value string (will be part of DOMNavigator later)
// For now, can be a local test helper if needed for assertions
// function getName(node: LSFNode, buffer: Uint8Array): string {
//     if (node.nameLength === 0) return '';
//     return new TextDecoder().decode(buffer.subarray(node.nameStart, node.nameStart + node.nameLength));
// }
// function getValue(node: LSFNode, buffer: Uint8Array): string {
//     if (node.valueLength === 0) return '';
//     return new TextDecoder().decode(buffer.subarray(node.valueStart, node.valueStart + node.valueLength));
// } 