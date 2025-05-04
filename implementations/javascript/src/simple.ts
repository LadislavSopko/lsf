/**
 * LSF Simple API for TypeScript
 * 
 * This module provides a simple API for encoding and decoding LSF format.
 */

import { LSFDocument, LSFObject, LSFValue, LSFEncodeOptions, LSFParseOptions } from './types';
import { LSFEncoder } from './encoder';
import { LSFDecoder } from './decoder';

/**
 * Provides a simple API for encoding and decoding LSF format
 */
export class LSFSimple {
    private encoder: LSFEncoder;
    private decoder: LSFDecoder;
    
    /**
     * Create a new LSF simple API instance
     * 
     * @param encodeOptions Options for encoding LSF
     * @param parseOptions Options for parsing LSF
     */
    constructor(encodeOptions: LSFEncodeOptions = {}, parseOptions: LSFParseOptions = {}) {
        this.encoder = new LSFEncoder(encodeOptions);
        this.decoder = new LSFDecoder(parseOptions);
    }
    
    /**
     * Encode a JavaScript object to LSF format
     * 
     * @param data Object to encode to LSF
     * @returns LSF formatted string
     * 
     * @example
     * ```ts
     * const lsf = new LSFSimple();
     * const lsfString = lsf.encode({ user: { id: 123, name: "John" } });
     * ```
     */
    public encode(data: LSFDocument): string {
        // Reset the encoder state
        this.encoder = new LSFEncoder();
        
        // Encode each object
        for (const [objectName, objectData] of Object.entries(data)) {
            this.encoder.startObject(objectName);
            this.encodeObject(objectData);
        }
        
        return this.encoder.toString();
    }
    
    /**
     * Decode an LSF string to a JavaScript object
     * 
     * @param lsfString LSF formatted string
     * @returns Decoded object
     * 
     * @example
     * ```ts
     * const lsf = new LSFSimple();
     * const data = lsf.decode("$o§user$r§$f§id$f§123$r§$f§name$f§John$r§");
     * ```
     */
    public decode(lsfString: string): LSFDocument {
        return this.decoder.decode(lsfString);
    }
    
    /**
     * Get any errors encountered during decoding
     * 
     * @returns Array of error information
     */
    public getErrors() {
        return this.decoder.getErrors();
    }
    
    /**
     * Encode an object's properties to LSF
     * 
     * @param object Object to encode
     */
    private encodeObject(object: LSFObject): void {
        for (const [key, value] of Object.entries(object)) {
            this.encodeField(key, value);
        }
    }
    
    /**
     * Encode a field to LSF based on its type
     * 
     * @param key Field key
     * @param value Field value
     */
    private encodeField(key: string, value: LSFValue): void {
        if (value === null || value === undefined) {
            this.encoder.addTypedField(key, null, 'null');
        } else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                this.encoder.addTypedField(key, value, 'int');
            } else {
                this.encoder.addTypedField(key, value, 'float');
            }
        } else if (typeof value === 'boolean') {
            this.encoder.addTypedField(key, value, 'bool');
        } else if (value instanceof Uint8Array || (typeof Buffer !== 'undefined' && value instanceof Buffer)) {
            this.encoder.addTypedField(key, value, 'bin');
        } else if (Array.isArray(value)) {
            this.encoder.addList(key, value);
        } else if (typeof value === 'string' && (this.encoder as any).options?.explicitTypes) {
            // If explicitTypes is enabled, use type hint for strings too
            this.encoder.addTypedField(key, value, 'str');
        } else {
            this.encoder.addField(key, value);
        }
    }
} 