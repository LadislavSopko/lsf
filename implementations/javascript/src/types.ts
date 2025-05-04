/**
 * Type definitions for LSF format
 */

/**
 * Type codes used in LSF v1.3 format
 */
export type LSFTypeCode = 'n' | 'f' | 'b' | 'd' | 's';

/**
 * LSF value types that can be serialized
 */
export type LSFValue = string | number | boolean | null | undefined | Date | Buffer | Uint8Array | LSFValue[];

/**
 * Object structure for LSF data
 */
export interface LSFObject {
    [key: string]: LSFValue;
}

/**
 * Complete document structure for LSF
 */
export interface LSFDocument {
    [objectName: string]: LSFObject;
}

/**
 * Error information during parsing
 */
export interface LSFError {
    message: string;
    record?: string;
}

/**
 * Parsing options for LSF decoder
 */
export interface LSFParseOptions {
    /**
     * Whether to continue parsing on errors
     */
    continueOnError?: boolean;
    
    /**
     * Whether to automatically convert values based on detected types
     */
    autoConvertTypes?: boolean;
}

/**
 * Encoding options for LSF encoder
 */
export interface LSFEncodeOptions {
    /**
     * Whether to add explicit type hints for all values
     */
    explicitTypes?: boolean;
    
    /**
     * Whether to add a version marker to the output
     */
    includeVersion?: boolean;
    
    /**
     * Whether to automatically detect types when encoding
     */
    detectTypes?: boolean;
} 