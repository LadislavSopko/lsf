'use strict';

const textEncoder = new TextEncoder();

function isObject(value: any): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateValue(value: any) {
    if (typeof value === 'object' && value !== null) {
        throw new Error("LSF 3.0 structure violation: Nested objects or arrays are not allowed within fields.");
    }
}

function encodeValue(value: any): { encoded: string | Uint8Array, typeHint?: string } {
    validateValue(value);

    if (typeof value === 'string') {
        // No type hint needed for strings
        return { encoded: value };
    } else if (typeof value === 'number') {
        return { encoded: String(value), typeHint: '$t~n' };
    } else if (typeof value === 'boolean') {
        return { encoded: value ? 'true' : 'false', typeHint: '$t~b' };
    } else if (value === null) {
        return { encoded: 'null', typeHint: '$t~z' };
    } else if (value === undefined) {
        // Represent undefined as null with a type hint
        return { encoded: 'null', typeHint: '$t~z' };
    } else {
        // Fallback for other primitive types (should ideally not happen with common JS objects)
        return { encoded: String(value) };
    }
}

function* encodeObjectToString(obj: Record<string, any>): Generator<string> {
    yield '$o~';
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            yield '$f~';
            yield key;
            const { encoded, typeHint } = encodeValue(value);
            yield '$v~';
            if (typeof encoded === 'string') {
                yield encoded; // Already a string
            } else {
                // This path shouldn't be hit in string mode, but for type safety:
                yield new TextDecoder().decode(encoded as Uint8Array);
            }
            if (typeHint) {
                yield typeHint;
            }
        }
    }
}

function* encodeObjectToArray(obj: Record<string, any>): Generator<Uint8Array> {
    yield textEncoder.encode('$o~');
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            yield textEncoder.encode('$f~');
            yield textEncoder.encode(key);
            const { encoded, typeHint } = encodeValue(value);
            yield textEncoder.encode('$v~');
            if (typeof encoded === 'string') {
                yield textEncoder.encode(encoded);
            } else {
                yield encoded as Uint8Array; // Assuming Uint8Array if not string
            }
            if (typeHint) {
                yield textEncoder.encode(typeHint);
            }
        }
    }
}

/**
 * Encodes a JavaScript object or an array of objects into an LSF 3.0 string.
 * Enforces a flat structure; nested objects/arrays within fields will throw an error.
 * @param input The JavaScript object or array of objects to encode.
 * @returns The LSF 3.0 string representation.
 */
export function encodeLSFToString(input: any): string {
    let result = '';
    if (Array.isArray(input)) {
        for (const item of input) {
            if (!isObject(item)) {
                throw new Error("LSF 3.0 structure violation: Input array must contain only objects.");
            }
            for (const chunk of encodeObjectToString(item)) {
                result += chunk;
            }
        }
    } else if (isObject(input)) {
        for (const chunk of encodeObjectToString(input)) {
            result += chunk;
        }
    } else {
        throw new Error("LSF 3.0 structure violation: Input must be an object or an array of objects.");
    }
    return result;
}

/**
 * Encodes a JavaScript object or an array of objects into an LSF 3.0 Uint8Array.
 * Enforces a flat structure; nested objects/arrays within fields will throw an error.
 * @param input The JavaScript object or array of objects to encode.
 * @returns The LSF 3.0 Uint8Array representation.
 */
export function encodeLSFToArray(input: any): Uint8Array {
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    const processObject = (obj: Record<string, any>) => {
        for (const chunk of encodeObjectToArray(obj)) {
            chunks.push(chunk);
            totalLength += chunk.length;
        }
    };

    if (Array.isArray(input)) {
        for (const item of input) {
            if (!isObject(item)) {
                throw new Error("LSF 3.0 structure violation: Input array must contain only objects.");
            }
            processObject(item);
        }
    } else if (isObject(input)) {
        processObject(input);
    } else {
        throw new Error("LSF 3.0 structure violation: Input must be an object or an array of objects.");
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
} 