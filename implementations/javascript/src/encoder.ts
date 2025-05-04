/**
 * LSF Encoder for TypeScript
 * 
 * This module provides the encoder component for LSF (LLM-Safe Format).
 */

import { LSFTypeHint, LSFValue, LSFEncodeOptions } from './types';
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
        
        this.buffer.push(`$f§${key}$f§${String(value)}$r§`);
        return this;
    }
    
    /**
     * Add a typed field to the current object
     * 
     * @param key The field key
     * @param value The field value
     * @param typeHint One of: "int", "float", "bool", "null", "bin", "str"
     * @returns this for chaining
     * @throws Error if no object has been started or typeHint is invalid
     */
    public addTypedField(key: string, value: LSFValue, typeHint: LSFTypeHint): LSFEncoder {
        if (this.currentObject === null) {
            throw new Error("No object started. Call startObject() first.");
        }
        
        if (!["int", "float", "bool", "null", "bin", "str"].includes(typeHint)) {
            throw new Error(`Invalid type hint: ${typeHint}`);
        }
        
        let processedValue: string;
        
        // Process value based on type hint
        switch (typeHint) {
            case 'bin':
                if (value instanceof Buffer || value instanceof Uint8Array) {
                    processedValue = value.toString('base64');
                } else {
                    throw new Error(`Value for '${key}' is not a binary type but type hint is 'bin'`);
                }
                break;
            case 'null':
                processedValue = '';
                break;
            default:
                processedValue = String(value);
        }
        
        this.buffer.push(`$t§${typeHint}$f§${key}$f§${processedValue}$r§`);
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
            this.buffer.push(`$f§${key}$f§$r§`);
        } else {
            const items = values.map(v => String(v)).join('$l§');
            this.buffer.push(`$f§${key}$f§${items}$r§`);
        }
        
        return this;
    }
    
    /**
     * Add an error message to the current object
     * 
     * @param message Error message
     * @returns this for chaining
     */
    public addError(message: string): LSFEncoder {
        this.buffer.push(`$e§${message}$r§`);
        return this;
    }
    
    /**
     * End the current transaction
     * 
     * @returns this for chaining
     */
    public endTransaction(): LSFEncoder {
        this.buffer.push(`$x§$r§`);
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
     * Helper method to automatically determine type hint from value
     */
    private addTypedFieldWithAutoType(key: string, value: LSFValue): LSFEncoder {
        if (value === null || value === undefined) {
            return this.addTypedField(key, null, 'null');
        } else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                return this.addTypedField(key, value, 'int');
            } else {
                return this.addTypedField(key, value, 'float');
            }
        } else if (typeof value === 'boolean') {
            return this.addTypedField(key, value, 'bool');
        } else if (value instanceof Buffer || value instanceof Uint8Array) {
            return this.addTypedField(key, value, 'bin');
        } else if (Array.isArray(value)) {
            return this.addList(key, value);
        } else {
            return this.addTypedField(key, value, 'str');
        }
    }
} 