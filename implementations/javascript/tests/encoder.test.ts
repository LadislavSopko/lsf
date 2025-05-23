'use strict';

import { describe, it, expect } from 'vitest';
import { encodeLSFToArray, encodeLSFToString } from '../src/parser/encoder';

const textDecoder = new TextDecoder();

describe('LSF 3.0 Encoder', () => {

    const testCases = [
        {
            name: 'Simple Object',
            input: { name: 'John Doe', age: 30, active: true, city: null },
            expectedString: '$o~$f~name$v~John Doe$f~age$v~30$t~n$f~active$v~true$t~b$f~city$v~null$t~z',
        },
        {
            name: 'Object with various types',
            input: { score: 123.45, isAdmin: false, notes: 'Testing', details: null },
            expectedString: '$o~$f~score$v~123.45$t~f$f~isAdmin$v~false$t~b$f~notes$v~Testing$f~details$v~null$t~z',
        },
        {
            name: 'Implicit Array (Array of Objects)',
            input: [
                { id: 1, value: 'A' },
                { id: 2, value: 'B' },
            ],
            expectedString: '$o~$f~id$v~1$t~n$f~value$v~A$o~$f~id$v~2$t~n$f~value$v~B',
        },
        {
            name: 'Empty Object',
            input: {},
            expectedString: '$o~',
        },
        {
            name: 'Object with empty string value',
            input: { key: '' },
            expectedString: '$o~$f~key$v~',
        },
         {
            name: 'Object with undefined value',
            input: { key: undefined },
            expectedString: '$o~$f~key$v~null$t~z', // Encoded as null with type hint
        },
        {
            name: 'UTF-8 Characters',
            input: { text: '你好世界' },
            expectedString: '$o~$f~text$v~你好世界',
        },
    ];

    testCases.forEach(({ name, input, expectedString }) => {
        it(`encodeLSFToString: ${name}`, () => {
            expect(encodeLSFToString(input)).toBe(expectedString);
        });

        it(`encodeLSFToArray: ${name}`, () => {
            const expectedArray = new TextEncoder().encode(expectedString);
            expect(encodeLSFToArray(input)).toEqual(expectedArray);
            // Also verify string decoding matches
            expect(textDecoder.decode(encodeLSFToArray(input))).toBe(expectedString);
        });
    });

    // Bug test: float values should get $t~f not $t~n
    it('should use correct type hint for float values', () => {
        const input = { price: 999.99, count: 100 };
        const result = encodeLSFToString(input);
        
        // price (999.99) should have $t~f for float
        expect(result).toContain('$f~price$v~999.99$t~f');
        
        // count (100) should have $t~n for integer
        expect(result).toContain('$f~count$v~100$t~n');
    });

    describe('Error Handling', () => {
        it('should throw error for nested objects', () => {
            const input = { user: { name: 'Nested' } };
            const expectedError = "LSF 3.0 structure violation: Nested objects or arrays are not allowed within fields.";
            expect(() => encodeLSFToString(input)).toThrow(expectedError);
            expect(() => encodeLSFToArray(input)).toThrow(expectedError);
        });

        it('should throw error for arrays within fields', () => {
            const input = { items: [1, 2, 3] };
             const expectedError = "LSF 3.0 structure violation: Nested objects or arrays are not allowed within fields.";
            expect(() => encodeLSFToString(input)).toThrow(expectedError);
            expect(() => encodeLSFToArray(input)).toThrow(expectedError);
        });

        it('should throw error for non-object in input array', () => {
            const input = [{ id: 1 }, "not an object"];
            const expectedError = "LSF 3.0 structure violation: Input array must contain only objects.";
            expect(() => encodeLSFToString(input)).toThrow(expectedError);
            expect(() => encodeLSFToArray(input)).toThrow(expectedError);
        });

        it('should throw error for invalid top-level input (string)', () => {
            const input = "just a string";
            const expectedError = "LSF 3.0 structure violation: Input must be an object or an array of objects.";
            expect(() => encodeLSFToString(input)).toThrow(expectedError);
            expect(() => encodeLSFToArray(input)).toThrow(expectedError);
        });

         it('should throw error for invalid top-level input (null)', () => {
            const input = null;
            const expectedError = "LSF 3.0 structure violation: Input must be an object or an array of objects.";
            expect(() => encodeLSFToString(input)).toThrow(expectedError);
            expect(() => encodeLSFToArray(input)).toThrow(expectedError);
        });

        it('should throw error for invalid top-level input (number)', () => {
            const input = 123;
            const expectedError = "LSF 3.0 structure violation: Input must be an object or an array of objects.";
            expect(() => encodeLSFToString(input)).toThrow(expectedError);
            expect(() => encodeLSFToArray(input)).toThrow(expectedError);
        });
    });
}); 