/**
 * LSF Decoder for TypeScript
 * 
 * This module provides the decoder component for LSF (LLM-Safe Format).
 */

import { LSFTypeCode, LSFDocument, LSFError, LSFParseOptions } from './types';

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
     * const data = decoder.decode("$o~user$r~id$f~123$r~name$f~John$r~");
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
            if (["$o~", "$f~", "$t~", "$v~"].includes(lsfString.slice(i, i + 3))) {
                parts.push(lsfString.slice(i, i + 3));
                i += 3;
            } else if (lsfString.slice(i, i + 3) === "$r~") {
                parts.push(lsfString.slice(i, i + 3));
                i += 3;
                // Skip whitespace after record terminator
                while (i < lsfString.length && /\s/.test(lsfString[i])) {
                    i++;
                }
            } else if (lsfString.slice(i, i + 3) === "$l~") {
                parts.push(lsfString.slice(i, i + 3));
                i += 3;
            } else {
                // Check for invalid tokens that might indicate malformed input
                if (lsfString[i] === '$' && lsfString.slice(i, i + 3).match(/\$[a-z]\~/)) {
                    const invalidToken = lsfString.slice(i, i + 3);
                    const error = new Error(`Invalid token: ${invalidToken} at position ${i}`);
                    this.recordError(error, lsfString.slice(i, i + 10));
                    if (!this.options.continueOnError) {
                        throw error;
                    }
                }
                parts.push(lsfString[i]);
                i++;
            }
        }
        
        lsfString = parts.join('');
        
        // Split by record terminator and process each record
        const records = lsfString.split('$r~');
        
        for (const record of records) {
            if (!record.trim()) continue;
            
            try {
                if (record.startsWith('$o~')) {
                    // New object
                    currentObj = record.slice(3);
                    result[currentObj] = {};
                } else if (record.includes('$f~') && currentObj) {
                    // Field (key$f~value) or (key$f~value$t~type)
                    const [key, valueWithType] = record.split('$f~', 2);
                    
                    if (valueWithType !== undefined) {
                        // Handle typed values (key$f~value$t~type format)
                        if (valueWithType.includes('$t~')) {
                            const [value, typeCode] = valueWithType.split('$t~');
                            
                            if (this.options.autoConvertTypes) {
                                result[currentObj][key] = this.convertTypedValue(typeCode as LSFTypeCode, value);
                            } else {
                                result[currentObj][key] = value;
                            }
                        }
                        // Handle lists
                        else if (valueWithType.includes('$l~')) {
                            result[currentObj][key] = valueWithType.split('$l~');
                        }
                        // Regular value
                        else {
                            result[currentObj][key] = valueWithType;
                        }
                    }
                } else if (record.includes('$invalid') || record.match(/\$[a-z]\~/)) {
                    // Clearly malformed record, record an error
                    const error = new Error(`Malformed record: ${record}`);
                    this.recordError(error, record);
                    if (!this.options.continueOnError) {
                        throw error;
                    }
                }
                // We ignore version markers during decoding
            } catch (e) {
                this.recordError(e, record);
                
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
     * Convert a value based on its type code
     * 
     * @param typeCode The type code character
     * @param value The value to convert
     * @returns The converted value
     * @throws Error if typeCode is not recognized
     */
    private convertTypedValue(typeCode: LSFTypeCode, value: string): any {
        switch (typeCode) {
            case 'n':
                return parseInt(value, 10);
            case 'f':
                return parseFloat(value);
            case 'b':
                return value.toLowerCase() === 'true';
            case 'd':
                return new Date(value);
            case 's':
                return value;
            default:
                const error = new Error(`Unknown type code: ${typeCode}`);
                this.recordError(error, `$t~${typeCode}`);
                if (!this.options.continueOnError) {
                    throw error;
                }
                return value;
        }
    }
    
    /**
     * Record an error for later retrieval
     */
    private recordError(error: unknown, record?: string): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.errors.push({
            message: errorMessage,
            record
        });
    }
} 