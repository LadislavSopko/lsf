'use strict';

import { describe, bench, expect, it } from 'vitest';
import { TokenScanner } from '../src/parser/token-scanner';
import { DOMBuilder } from '../src/parser/dom-builder';
import { ParseResult } from '../src/parser/types';
import { encodeLSFToArray } from '../src/parser/encoder'; // Added encoder import
import { dataSets as originalDataSets } from './data.js'; // Import original datasets

// --- LSF 3.0 Specific Flat Benchmark Datasets ---
const lsfDataSets = {
    small: {
        id: 12345,
        name: "John Doe",
        active: true
    },
    medium: [
        { id: 1, name: "Object 1", value: "Medium string value", status: true, code: null },
        { id: 2, name: "Object 2", value: "Another string value here", status: false, code: 100 },
        { id: 3, name: "Object 3", value: "Yet another medium string data", status: true, code: 200 }
    ],
    large: (() => {
        // Define the type for the user objects in the large dataset
        type LargeUser = {
            id: number;
            name: string;
            email: string;
            status: boolean;
            score: number;
            registered: string | null;
            notes: string;
        };
        const users: LargeUser[] = []; // Explicitly type the array
        for (let i = 1; i <= 100; i++) {
            users.push({
                id: i,
                name: `User Name ${i} With Some Extra Text`,
                email: `user${i}@example-domain-name.com`,
                status: i % 5 === 0 ? false : true,
                score: Math.random() * 1000,
                registered: i % 10 === 0 ? null : new Date(Date.now() - Math.random() * 1e11).toISOString().slice(0, 10), // Mix nulls and dates (as strings)
                notes: `This is note number ${i} containing some text content for benchmarking purposes.`
            });
        }
        return users;
    })()
};

// --- Pre-encoded/Stringified Data ---
const benchmarkData: { [key: string]: { lsf: Uint8Array, json: string } } = {};

for (const size of ['small', 'medium', 'large']) {
    const lsfInputObject = lsfDataSets[size as keyof typeof lsfDataSets];
    const jsonInputObject = originalDataSets[size as keyof typeof originalDataSets];

    benchmarkData[size] = {
        lsf: encodeLSFToArray(lsfInputObject), // Encode our flat LSF data
        json: JSON.stringify(jsonInputObject) // Stringify the original JSON data
    };
}

// --- Parsing Function (Updated for Uint8Array) ---
const parseLSFToDOM = (input: Uint8Array): ParseResult => { // Accepts Uint8Array
    const scanner = new TokenScanner();
    const tokenResult = scanner.scan(input); // Scan Uint8Array
    const builder = new DOMBuilder(tokenResult);
    return builder.buildDOM(); // Stop after DOM build
};

// --- Benchmark Suite ---
describe('LSF Parser Performance vs JSON.parse (Scan + Build DOM Only)', () => {

    for (const size of ['small', 'medium', 'large']) {
        describe(`Dataset Size: ${size}`, () => {
            const lsfBenchInput = benchmarkData[size].lsf;
            const jsonBenchInput = benchmarkData[size].json;

            // Benchmark LSF Scan + Build DOM
            bench('LSF Scan + Build DOM', () => {
                parseLSFToDOM(lsfBenchInput);
            });

            // Benchmark native JSON.parse
            bench('Native JSON.parse', () => {
                JSON.parse(jsonBenchInput);
            });

            // Optional: Benchmark individual LSF components if needed
            bench('LSF TokenScanner Only', () => {
                const scanner = new TokenScanner();
                scanner.scan(lsfBenchInput);
            });

            bench('LSF DOMBuilder Only (after scan)', () => {
                const scanner = new TokenScanner();
                const tokenResult = scanner.scan(lsfBenchInput);
                const builder = new DOMBuilder(tokenResult);
                builder.buildDOM();
            });
        });
    }
});

// --- Sanity Checks (Using 'small' dataset for simplicity) ---
describe('Benchmark Data Sanity Checks', () => {
    const smallLSFData = benchmarkData['small'].lsf;
    const smallJSONData = benchmarkData['small'].json;
    const smallLSFExpectedObject = lsfDataSets['small'];
    const smallJSONExpectedObject = originalDataSets['small'];

    it('should produce valid DOM for LSF test data (small)', () => {
        const parseResult = parseLSFToDOM(smallLSFData);
        expect(parseResult).toBeDefined();
        expect(parseResult.root).not.toBe(-1);
        expect(parseResult.nodes.length).toBeGreaterThan(0);

        // Check a known value using the navigator
        const rootNode = parseResult.nodes[parseResult.root];
        const userFieldNodeIndex = rootNode.children[0]; // $f~user
        const userObjectNodeIndex = rootNode.children[1]; // $o~ implicitly created
        const userObjectNode = parseResult.nodes[userObjectNodeIndex];

        // Find the 'name' field within the user object
        let nameValueNodeIndex = -1;
        for (let i = 0; i < userObjectNode.children.length; i += 2) {
            const fieldNameIndex = userObjectNode.children[i];
            const fieldValueIndex = userObjectNode.children[i + 1];
            const fieldName = parseResult.navigator.getName(fieldNameIndex);
            if (fieldName === 'name') {
                nameValueNodeIndex = fieldValueIndex;
                break;
            }
        }
        expect(nameValueNodeIndex).not.toBe(-1);
        const nameValue = parseResult.navigator.getValue(nameValueNodeIndex);
        expect(nameValue).toBe(smallLSFExpectedObject.name);
    });

    it('should parse JSON test data correctly (small)', () => {
        const parsedJson = JSON.parse(smallJSONData);
        expect(parsedJson.name).toBe(smallJSONExpectedObject.name);
        expect(parsedJson.id).toBe(smallJSONExpectedObject.id);
    });
}); 