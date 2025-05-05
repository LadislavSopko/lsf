/**
 * LSF Simple API for TypeScript
 * 
 * This module provides a simple API for encoding and decoding LSF format.
 */

import { LSFDocument, LSFObject, LSFValue, LSFEncodeOptions, LSFParseOptions } from './types';
import { LSFEncoder } from './encoder';
import { LSFDecoder } from './decoder';

/**
 * Options for the LSFSimple API
 */
export interface LSFSimpleOptions extends LSFEncodeOptions, LSFParseOptions {
    /**
     * Whether to automatically detect and encode type hints (default: true)
     */
    detectTypes?: boolean;
}

/**
 * Provides a simple API for encoding and decoding LSF format
 */
export class LSFSimple {
    private encoder: LSFEncoder;
    private decoder: LSFDecoder;
    private options: LSFSimpleOptions;
    
    /**
     * Create a new LSF simple API instance
     * 
     * @param options Options for encoding and decoding LSF
     */
    constructor(options: LSFSimpleOptions = {}) {
        // Split options into encoder and decoder options
        const { autoConvertTypes, continueOnError, ...encodeOptions } = options;
        
        const parseOptions: LSFParseOptions = {
            autoConvertTypes,
            continueOnError
        };
        
        this.encoder = new LSFEncoder(encodeOptions);
        this.decoder = new LSFDecoder(parseOptions);
        this.options = options;
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
        // Extract only encoder options
        const { autoConvertTypes, continueOnError, ...encodeOptions } = this.options;
        
        // Reset the encoder state with the same options
        this.encoder = new LSFEncoder(encodeOptions);
        
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
     * const data = lsf.decode("$o~user$r~id$f~123$t~n$r~name$f~John$r~");
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
        // Skip null/undefined values entirely in v1.3
        if (value === null || value === undefined) {
            return;
        }
        
        // If detectTypes is false, use regular fields for everything
        if (this.options.detectTypes === false) {
            this.encoder.addField(key, value);
            return;
        }
        
        // Otherwise encode based on type
        if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                this.encoder.addTypedField(key, value, 'n');
            } else {
                this.encoder.addTypedField(key, value, 'f');
            }
        } else if (typeof value === 'boolean') {
            this.encoder.addTypedField(key, value, 'b');
        } else if (value instanceof Date) {
            this.encoder.addTypedField(key, value, 'd');
        } else if (value instanceof Uint8Array || (typeof Buffer !== 'undefined' && value instanceof Buffer)) {
            // Binary data is encoded as base64 without special type
            this.encoder.addField(key, typeof Buffer !== 'undefined' ? 
                (value as Buffer).toString('base64') : 
                btoa(String.fromCharCode(...new Uint8Array(value as Uint8Array))));
        } else if (Array.isArray(value)) {
            this.encoder.addList(key, value);
        } else if (typeof value === 'string' && this.options.explicitTypes) {
            // If explicitTypes is enabled, use type hint for strings too
            this.encoder.addTypedField(key, value, 's');
        } else {
            this.encoder.addField(key, value);
        }
    }
} 