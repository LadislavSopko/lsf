/**
 * LSF Decoder for TypeScript
 * 
 * This module provides the decoder component for LSF (LLM-Safe Format).
 */

import { LSFTypeHint, LSFDocument, LSFError, LSFParseOptions } from './types';

/**
 * Decoder for LSF (LLM-Safe Format)
 * 
 * This class provides methods for decoding LSF formatted strings to JavaScript objects.
 */
export class LSFDecoder {
    private errors: LSFError[] = [];
    private options: Required<LSFParseOptions>;
    
    /**
     * Create a new LSF decoder
     * 
     * @param options Parsing options
     */
    constructor(options: LSFParseOptions = {}) {
        this.options = {
            continueOnError: true,
            autoConvertTypes: true,
            ...options
        };
    }
    
    /**
     * Decode an LSF string to a JavaScript object
     * 
     * @param lsfString The LSF formatted string
     * @returns Object representing the parsed data
     * 
     * @example
     * ```ts
     * const decoder = new LSFDecoder();
     * const data = decoder.decode("$o§user$r§$f§id$f§123$r§$f§name$f§John$r§");
     * // Returns: { user: { id: '123', name: 'John' } }
     * ```
     */
    public decode(lsfString: string): LSFDocument {
        this.errors = [];
        const result: LSFDocument = {};
        let currentObj: string | null = null;
        
        // Pre-process whitespace between records
        const parts: string[] = [];
        let i = 0;
        while (i < lsfString.length) {
            if (["$o§", "$f§", "$t§", "$e§", "$x§", "$v§"].includes(lsfString.slice(i, i + 3))) {
                parts.push(lsfString.slice(i, i + 3));
                i += 3;
            } else if (lsfString.slice(i, i + 3) === "$r§") {
                parts.push(lsfString.slice(i, i + 3));
                i += 3;
                // Skip whitespace after record terminator
                while (i < lsfString.length && /\s/.test(lsfString[i])) {
                    i++;
                }
            } else if (lsfString.slice(i, i + 3) === "$l§") {
                parts.push(lsfString.slice(i, i + 3));
                i += 3;
            } else {
                parts.push(lsfString[i]);
                i++;
            }
        }
        
        lsfString = parts.join('');
        
        // Split by record terminator and process each record
        const records = lsfString.split('$r§');
        
        for (const record of records) {
            if (!record.trim()) continue;
            
            try {
                if (record.startsWith('$o§')) {
                    // New object
                    currentObj = record.slice(3);
                    result[currentObj] = {};
                } else if (record.startsWith('$t§') && currentObj) {
                    // Typed field
                    const parts = record.slice(3).split('$f§', 3);
                    if (parts.length === 3) {
                        const [typeHint, key, value] = parts;
                        if (this.options.autoConvertTypes) {
                            result[currentObj][key] = this.convertTypedValue(typeHint as LSFTypeHint, value);
                        } else {
                            result[currentObj][key] = value;
                        }
                    }
                } else if (record.startsWith('$f§') && currentObj) {
                    // Regular field or list
                    const parts = record.slice(3).split('$f§', 2);
                    if (parts.length === 2) {
                        const [key, value] = parts;
                        if (value.includes('$l§')) {
                            // List field
                            result[currentObj][key] = value.split('$l§');
                        } else {
                            // Regular field
                            result[currentObj][key] = value;
                        }
                    }
                } else if (record.startsWith('$e§')) {
                    // Error marker
                    this.errors.push({
                        message: record.slice(3)
                    });
                }
                // We ignore transaction markers ($x§) during decoding
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                this.errors.push({
                    message: `Error parsing record: ${errorMessage}`,
                    record
                });
                
                if (!this.options.continueOnError) {
                    throw e;
                }
            }
        }
        
        return result;
    }
    
    /**
     * Get any errors encountered during decoding
     * 
     * @returns Array of error information
     */
    public getErrors(): LSFError[] {
        return [...this.errors];
    }
    
    /**
     * Convert a value based on its type hint
     * 
     * @param typeHint The type hint string
     * @param value The value to convert
     * @returns The converted value
     * @throws Error if typeHint is not recognized
     */
    private convertTypedValue(typeHint: LSFTypeHint, value: string): any {
        switch (typeHint) {
            case 'int':
                return parseInt(value, 10);
            case 'float':
                return parseFloat(value);
            case 'bool':
                return value.toLowerCase() === 'true';
            case 'null':
                return null;
            case 'bin':
                return typeof Buffer !== 'undefined'
                    ? Buffer.from(value, 'base64')
                    : Uint8Array.from(atob(value), c => c.charCodeAt(0));
            case 'str':
                return value;
            default:
                throw new Error(`Unknown type hint: ${typeHint}`);
        }
    }
} 