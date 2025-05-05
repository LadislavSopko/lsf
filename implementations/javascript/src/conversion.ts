/**
 * LSF to JSON conversion utilities
 * 
 * This module provides functions to convert between LSF and JSON formats.
 */

import { LSFDecoder } from './decoder';

/**
 * Convert an LSF string to a JSON string
 * 
 * @param lsfString The LSF formatted string
 * @param space Indentation spacing for pretty-printing (number of spaces or null for compact)
 * @param replacer A function that transforms the results or an array of strings and numbers that serves as an allowlist for selecting properties
 * @returns JSON formatted string
 * 
 * @example
 * ```ts
 * lsfToJson("$o~user$r~$f~name$f~John$r~$f~age$f~30$r~")
 * // Returns: '{"user":{"name":"John","age":"30"}}'
 * 
 * lsfToJson("$o~user$r~$f~name$f~John$r~", 2)
 * // Returns pretty-printed JSON with 2-space indentation
 * ```
 */
export function lsfToJson(
    lsfString: string, 
    space?: number | string,
    replacer?: (this: any, key: string, value: any) => any | Array<number | string>
): string {
    // First decode LSF to JavaScript objects
    const decoder = new LSFDecoder();
    const data = decoder.decode(lsfString);
    
    // Convert to JSON
    return JSON.stringify(data, replacer, space);
}

/**
 * Convert an LSF string to a pretty-printed JSON string
 * 
 * This is a convenience wrapper around lsfToJson with 2-space indentation
 * 
 * @param lsfString The LSF formatted string
 * @returns Pretty-printed JSON string
 * 
 * @example
 * ```ts
 * lsfToJsonPretty("$o~user$r~$f~name$f~John$r~")
 * // Returns: pretty-printed JSON with 2-space indentation
 * ```
 */
export function lsfToJsonPretty(lsfString: string): string {
    return lsfToJson(lsfString, 2);
} 