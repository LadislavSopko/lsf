/**
 * LSF Encoder for TypeScript
 * 
 * This module provides the encoder component for LSF (LLM-Safe Format).
 */

import { LSFTypeCode, LSFValue, LSFEncodeOptions } from './types';
import { VERSION } from './index';

/**
 * Encoder for LSF (LLM-Safe Format)
 * 
 * This class provides a fluent API for encoding data to LSF format.
 */
export class LSFEncoder {
    private buffer: string[] = [];
    private currentObject: string | null = null;
    private options: LSFEncodeOptions;
    
    constructor(options: LSFEncodeOptions = {}) {
        this.options = {
            explicitTypes: false,
            includeVersion: false,
            ...options
        };
        
        if (this.options.includeVersion) {
            this.buffer.push(`$v§${VERSION}$r§`);
        }
    }
    
    /**
     * Start a new object with the given name
     * 
     * @param name The name of the object
     * @returns this for chaining
     */
    public startObject(name: string): LSFEncoder {
        this.buffer.push(`$o§${name}$r§`);
        this.currentObject = name;
        return this;
    }
    
    /**
     * Add a field to the current object
     * 
     * @param key The field key
     * @param value The field value (converted to string)
     * @returns this for chaining
     * @throws Error if no object has been started
     */
    public addField(key: string, value: LSFValue): LSFEncoder {
        if (this.currentObject === null) {
            throw new Error("No object started. Call startObject() first.");
        }
        
        // If explicit types are enabled, use addTypedField instead
        if (this.options.explicitTypes) {
            return this.addTypedFieldWithAutoType(key, value);
        }
        
        this.buffer.push(`${key}$f§${String(value)}$r§`);
        return this;
    }
    
    /**
     * Add a typed field to the current object
     * 
     * @param key The field key
     * @param value The field value
     * @param typeCode One of: "n", "f", "b", "d", "s" or legacy type names
     * @returns this for chaining
     * @throws Error if no object has been started or typeCode is invalid
     */
    public addTypedField(key: string, value: LSFValue, typeCode: string): LSFEncoder {
        if (this.currentObject === null) {
            throw new Error("No object started. Call startObject() first.");
        }
        
        // Convert legacy type names to v1.3 single-letter codes
        let typeCodeV1_3: LSFTypeCode;
        switch (typeCode) {
            case 'int': typeCodeV1_3 = 'n'; break;
            case 'float': typeCodeV1_3 = 'f'; break;
            case 'bool': typeCodeV1_3 = 'b'; break;
            case 'null': return this; // Skip null fields
            case 'bin': 
                if (value instanceof Buffer || value instanceof Uint8Array) {
                    this.buffer.push(`${key}$f§${value.toString('base64')}$r§`);
                    return this;
                }
                throw new Error('Value must be Buffer or Uint8Array for binary fields');
            case 'n': 
            case 'f': 
            case 'b': 
            case 'd': 
            case 's': 
                typeCodeV1_3 = typeCode as LSFTypeCode;
                break;
            default:
                throw new Error(`Invalid type code: ${typeCode}`);
        }
        
        let processedValue: string;
        
        // Process value based on type code
        if (value === null || value === undefined) {
            // Skip this field entirely as null values are represented by field absence
            return this;
        } else if (typeCodeV1_3 === 'd' && value instanceof Date) {
            processedValue = value.toISOString();
        } else {
            processedValue = String(value);
        }
        
        this.buffer.push(`${key}$f§${processedValue}$t§${typeCodeV1_3}$r§`);
        return this;
    }
    
    /**
     * Add a list field to the current object
     * 
     * @param key The field key
     * @param values List of values
     * @returns this for chaining
     * @throws Error if no object has been started
     */
    public addList(key: string, values: LSFValue[]): LSFEncoder {
        if (this.currentObject === null) {
            throw new Error("No object started. Call startObject() first.");
        }
        
        if (!values || values.length === 0) {
            // Empty list
            this.buffer.push(`${key}$f§$r§`);
        } else {
            const items = values.map(v => String(v)).join('$l§');
            this.buffer.push(`${key}$f§${items}$r§`);
        }
        
        return this;
    }
    
    /**
     * Convert the buffer to an LSF string
     * 
     * @returns The LSF formatted string
     */
    public toString(): string {
        return this.buffer.join('');
    }
    
    /**
     * Helper method to automatically determine type code from value
     */
    private addTypedFieldWithAutoType(key: string, value: LSFValue): LSFEncoder {
        if (value === null || value === undefined) {
            // Skip this field entirely as null values are represented by field absence
            return this;
        } else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                return this.addTypedField(key, value, 'n');
            } else {
                return this.addTypedField(key, value, 'f');
            }
        } else if (typeof value === 'boolean') {
            return this.addTypedField(key, value, 'b');
        } else if (value instanceof Date) {
            return this.addTypedField(key, value, 'd');
        } else if (value instanceof Buffer || value instanceof Uint8Array) {
            // Binary data is stored as base64 strings with no special type code
            this.buffer.push(`${key}$f§${value.toString('base64')}$r§`);
            return this;
        } else if (Array.isArray(value)) {
            return this.addList(key, value);
        } else {
            return this.addTypedField(key, value, 's');
        }
    }
} 