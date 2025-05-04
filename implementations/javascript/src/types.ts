/**
 * Type definitions for LSF format
 */

/**
 * Type hints used in LSF format
 */
export type LSFTypeHint = 'int' | 'float' | 'bool' | 'null' | 'bin' | 'str';

/**
 * LSF value types that can be serialized
 */
export type LSFValue = string | number | boolean | null | undefined | Buffer | Uint8Array | LSFValue[];

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
} 