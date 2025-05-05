import { describe, it, expect } from 'vitest';
import { DOMBuilder } from '../src/parser/dom-builder';
import { TokenScanner } from '../src/parser/token-scanner';
import { LSFToJSONVisitor } from '../src/parser/visitor'; // Import the class to test

// Helper to parse LSF and get JSON output via visitor
const parseAndGetJSON = (input: string): string => {
    const scanner = new TokenScanner();
    const tokenResult = scanner.scan(input);
    const builder = new DOMBuilder(tokenResult);
    const parseResult = builder.buildDOM();
    const visitor = new LSFToJSONVisitor(parseResult);
    return visitor.buildJSON();
};

describe('LSFToJSONVisitor', () => {

  it('should convert a simple object', () => {
    const input = '$o~root$f~name$v~Test Name$f~count$v~123$t~n';
    const expectedJson = '{"name":"Test Name","count":123}'; // Note: root object name ignored in JSON
    const actualJson = parseAndGetJSON(input);
    expect(JSON.parse(actualJson)).toEqual(JSON.parse(expectedJson)); // Compare parsed objects for robustness
  });

  it('should handle implicit arrays', () => {
    const input = '$o~data$f~items$v~a$v~b$v~c';
    const expectedJson = '{"items":["a","b","c"]}';
    const actualJson = parseAndGetJSON(input);
    expect(JSON.parse(actualJson)).toEqual(JSON.parse(expectedJson));
  });

  it('should handle various type hints', () => {
    const input = '$o~types$f~int$v~-42$t~n$f~float$v~3.14$t~f$f~boolT$v~true$t~b$f~boolF$v~false$t~b$f~str$v~hello$t~s$f~strDef$v~world';
    const expected = {
        int: -42,
        float: 3.14,
        boolT: true,
        boolF: false,
        str: "hello",
        strDef: "world"
    };
    const actualJson = parseAndGetJSON(input);
    expect(JSON.parse(actualJson)).toEqual(expected);
  });

  it('should handle implicit fields (using default key)', () => {
    const input = '$o~object$v~implicit_value';
    const expectedJson = '{"__implicit_field__":"implicit_value"}'; // Visitor uses placeholder key
    const actualJson = parseAndGetJSON(input);
    expect(JSON.parse(actualJson)).toEqual(JSON.parse(expectedJson));
  });
  
  it('should handle implicit objects (outer wrapper ignored, fields added)', () => {
    // Note: Current visitor starts from first $o~. Implicit objects starting with $f~/$v~ 
    // will likely produce {"fieldA": "valueA"} or {"__implicit_field__": "valueC"}
    const inputFieldStart = '$f~fieldA$v~valueA';
    const expectedFieldStart = {"fieldA":"valueA"};
    expect(JSON.parse(parseAndGetJSON(inputFieldStart))).toEqual(expectedFieldStart);

    const inputValueStart = '$v~valueC';
    const expectedValueStart = {"__implicit_field__":"valueC"};
    expect(JSON.parse(parseAndGetJSON(inputValueStart))).toEqual(expectedValueStart);
  });

  it('should handle empty values and fields', () => {
    const input = '$o~obj$f~emptyValField$v~$f~emptyField$f~fieldWithValue$v~val';
    const expected = { emptyValField: "", emptyField: null, fieldWithValue: "val" }; // Empty string value, null for empty field
    const actualJson = parseAndGetJSON(input);
    expect(JSON.parse(actualJson)).toEqual(expected);
  });

  it('should handle empty objects', () => {
    const input = '$o~empty$';
    const expectedJson = '{}';
    const actualJson = parseAndGetJSON(input);
    expect(JSON.parse(actualJson)).toEqual(JSON.parse(expectedJson));
  });

  it('should handle multiple objects (processes only first by default)', () => {
      // Current buildJSON starts at parseResult.root (index of first obj)
      // It doesn't process subsequent top-level objects yet.
      // TODO: Enhance visitor or add top-level function to handle multiple objects if needed.
    const input = '$o~obj1$f~a$v~1$o~obj2$f~b$v~2';
    const expectedJson = '{"a":"1"}'; // Only processes obj1
    const actualJson = parseAndGetJSON(input);
    expect(JSON.parse(actualJson)).toEqual(JSON.parse(expectedJson));
  });
  
  it('should correctly escape strings', () => {
      const input = '$o~test$f~esc$v~"Hello\nWorld"\t/';
      const expectedJson = `{"esc":${JSON.stringify('"Hello\nWorld"\t/')}}`;
      const actualJson = parseAndGetJSON(input);
      expect(actualJson).toBe(expectedJson); 
  });

  // TODO: Add tests for date type hints once format is defined
  // TODO: Test invalid number/boolean formats if strict parsing is desired

}); 