import { describe, it, expect } from 'vitest';
import { LSFToJSON } from '../src/lsf-to-json-visitor';

describe('LSFToJSON Visitor (Direct-to-String)', () => {
  it('should convert a simple object to a JSON string', () => {
    const lsfString = '$o~SimpleObject$r~$f~message$f~Hello World$r~$f~count$f~$t~n42$r~$r~';
    const expectedJsonString = '{"message":"Hello World","count":42}';
    
    const resultJsonString = LSFToJSON.convert(lsfString);
    
    // Parse the result and expected strings to compare objects for robustness
    // This avoids issues with key order or minor whitespace differences.
    let parsedResult, parsedExpected;
    try {
        parsedResult = JSON.parse(resultJsonString);
    } catch (e) {
        // Fail test if result is not valid JSON
        expect.fail(`Resulting string is not valid JSON: ${resultJsonString}`);
    }
    try {
        parsedExpected = JSON.parse(expectedJsonString);
    } catch (e) {
        // This should not happen with the hardcoded expected string
        expect.fail(`Expected string is not valid JSON: ${expectedJsonString}`);
    }

    expect(parsedResult).toEqual(parsedExpected);
  });

  it('should convert an object with a list to a JSON string', () => {
    const lsfString = '$o~ListObject$r~$f~items$f~$l~one$l~two$l~three$r~$r~';
    const expectedJsonString = '{"items":["one","two","three"]}';

    const resultJsonString = LSFToJSON.convert(lsfString);

    let parsedResult, parsedExpected;
    try {
        parsedResult = JSON.parse(resultJsonString);
    } catch (e) {
        expect.fail(`Resulting string is not valid JSON: ${resultJsonString}`);
    }
    try {
        parsedExpected = JSON.parse(expectedJsonString);
    } catch (e) {
        expect.fail(`Expected string is not valid JSON: ${expectedJsonString}`);
    }

    expect(parsedResult).toEqual(parsedExpected);
  });

  // TODO: Add more tests for:
  // - All data types (boolean, float, date, null?)
  // - Empty lists
  // - Nested objects
  // - Objects with no fields
  // - Empty input (should produce '{}'?)
  // - Special characters in keys and values (escaping)
  // - Unicode characters
}); 