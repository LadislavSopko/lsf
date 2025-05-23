/**
 * @module lsf-format
 * @description LSF (LLM-Safe Format) is a minimal serialization format designed for reliable
 * structured data generation by LLMs. It uses only 3 structural tokens and optional type hints.
 * 
 * Key features:
 * - Minimal token set: $o~ (object), $f~ (field), $v~ (value), $t~ (type hint)
 * - No brackets, quotes, or complex nesting
 * - Streaming-safe, single-pass parsing
 * - Configurable size limits and validation
 * 
 * @example
 * import { parseToJsonString, encodeToString } from 'lsf-format';
 * 
 * // Parse LSF to JSON
 * const json = parseToJsonString('$o~$f~name$v~Alice$f~age$v~30$t~n');
 * console.log(json); // '{"name":"Alice","age":30}'
 * 
 * // Encode JavaScript object to LSF
 * const lsf = encodeToString({ name: 'Bob', active: true });
 * console.log(lsf); // '$o~$f~name$v~Bob$f~active$v~true$t~b'
 */

import { TokenScanner } from './parser/token-scanner';
import { DOMBuilder } from './parser/dom-builder';
import { LSFToJSONVisitor } from './parser/visitor';
import { encodeLSFToString, encodeLSFToArray } from './parser/encoder';
import type { ParseResult } from './parser/types';
import { ParserOptions, mergeOptions } from './parser/parser-options';

// Re-export types
export type { LSFNode, ParseResult, TokenInfo, DOMNavigator } from './parser/types';
export type { ParserOptions } from './parser/parser-options';

/**
 * Parse LSF string to DOM structure
 * @param {string} input - LSF formatted string containing structured data
 * @param {ParserOptions} [options] - Optional parser configuration
 * @returns {ParseResult} Result containing DOM nodes and navigator for traversal
 * @throws {Error} If input exceeds size limit (when configured)
 * @example
 * const result = parseToDom('$o~user$f~name$v~Alice$f~age$v~30$t~n');
 * if (result.navigator) {
 *   const name = result.navigator.getValue(1); // "Alice"
 * }
 */
export function parseToDom(input: string, options?: ParserOptions): ParseResult {
  const scanner = new TokenScanner();
  const scanResult = scanner.scan(input);
  const builder = new DOMBuilder(scanResult, options);
  return builder.buildDOM();
}

/**
 * Parse LSF bytes to DOM structure
 * @param {Uint8Array} input - LSF formatted byte array (UTF-8 encoded)
 * @param {ParserOptions} [options] - Optional parser configuration
 * @returns {ParseResult} Result containing DOM nodes and navigator for traversal
 * @throws {Error} If input contains invalid type hints (when validation enabled)
 * @example
 * const bytes = new TextEncoder().encode('$o~data$f~value$v~test');
 * const result = parseToDomFromBytes(bytes);
 */
export function parseToDomFromBytes(input: Uint8Array, options?: ParserOptions): ParseResult {
  const scanner = new TokenScanner();
  const scanResult = scanner.scan(input);
  const builder = new DOMBuilder(scanResult, options);
  return builder.buildDOM();
}

/**
 * Parse LSF string directly to JSON string
 * @param {string} input - LSF formatted string to parse
 * @param {ParserOptions} [options] - Optional parser configuration
 * @returns {string|null} JSON string representation or null if parsing fails
 * @throws {Error} If input exceeds configured size limit
 * @example
 * const lsf = '$o~user$f~name$v~Alice$f~age$v~30$t~n';
 * const json = parseToJsonString(lsf); // '{"name":"Alice","age":30}'
 */
export function parseToJsonString(input: string, options?: ParserOptions): string | null {
  const opts = mergeOptions(options);
  
  // Check size limit
  if (input.length > opts.maxInputSize) {
    throw new Error(`Input size exceeds maximum allowed size of ${opts.maxInputSize / (1024 * 1024)}MB`);
  }
  
  const result = parseToDom(input, options);
  if (!result.navigator) {
    return null;
  }
  
  const visitor = new LSFToJSONVisitor(result);
  return visitor.buildJSON();
}

/**
 * Parse LSF bytes directly to JSON string
 * @param {Uint8Array} input - LSF formatted byte array (UTF-8 encoded)
 * @param {ParserOptions} [options] - Optional parser configuration
 * @returns {string|null} JSON string representation or null if parsing fails
 * @throws {Error} If input contains invalid type hints (when validation enabled)
 * @example
 * const bytes = new TextEncoder().encode('$o~$f~active$v~true$t~b');
 * const json = parseToJsonStringFromBytes(bytes); // '{"active":true}'
 */
export function parseToJsonStringFromBytes(input: Uint8Array, options?: ParserOptions): string | null {
  const result = parseToDomFromBytes(input, options);
  if (!result.navigator) {
    return null;
  }
  
  const visitor = new LSFToJSONVisitor(result);
  return visitor.buildJSON();
}

/**
 * Encode a JavaScript object to LSF string format
 * @param {any} data - JavaScript object or array of objects to encode
 * @returns {string} LSF formatted string
 * @throws {Error} If input is not an object or array of objects
 * @throws {Error} If input contains nested objects or arrays within fields
 * @example
 * const data = { name: 'Alice', age: 30 };
 * const lsf = encodeToString(data); // '$o~$f~name$v~Alice$f~age$v~30$t~n'
 * 
 * @example
 * // With arrays of objects
 * const data = [{ id: 1 }, { id: 2 }];
 * const lsf = encodeToString(data); // '$o~$f~id$v~1$t~n$o~$f~id$v~2$t~n'
 */
export const encodeToString = encodeLSFToString;

/**
 * Encode a JavaScript object to LSF byte array format
 * @param {any} data - JavaScript object or array of objects to encode
 * @returns {Uint8Array} LSF formatted as UTF-8 byte array
 * @throws {Error} If input is not an object or array of objects
 * @throws {Error} If input contains nested objects or arrays within fields
 * @example
 * const data = { name: 'Alice', age: 30 };
 * const bytes = encodeToArray(data); // Uint8Array containing LSF bytes
 * 
 * @example
 * // For binary operations
 * const bytes = encodeToArray({ active: true });
 * // Can be written to file or sent over network
 */
export const encodeToArray = encodeLSFToArray;

// Also export with original names for compatibility
export { encodeLSFToString, encodeLSFToArray };

/**
 * Get a prompt for instructing LLMs to generate LSF format
 * @param {Object} [options] - Prompt generation options
 * @param {boolean} [options.includeExample=true] - Include an example in the prompt
 * @param {'minimal'|'detailed'} [options.style='minimal'] - Prompt style
 * @returns {string} LLM prompt for LSF generation
 * @example
 * const prompt = getLLMPrompt();
 * const fullPrompt = `${prompt}\n\nConvert this data: ${JSON.stringify(data)}`;
 */
export function getLLMPrompt(options?: { 
  includeExample?: boolean; 
  style?: 'minimal' | 'detailed';
}): string {
  const includeExample = options?.includeExample ?? true;
  const style = options?.style ?? 'minimal';
  
  if (style === 'detailed') {
    return `Generate output in LSF (LLM-Safe Format):

TOKENS:
- $o~ = start object
- $f~ = field name follows
- $v~ = value follows  
- $t~ = type hint follows (single character)

TYPES:
- n = integer (e.g., 42)
- f = float (e.g., 3.14)
- b = boolean (true/false)
- d = datetime (ISO format)
- s = string (optional, default)
- z = null

RULES:
1. NO quotes, brackets, or commas anywhere
2. NO newlines between tokens (continuous stream)
3. Arrays: repeat $v~ for same field
4. Multi-line strings: write actual newlines, not \\n
5. Write all special characters as-is
6. NO escaping - write everything literally

${includeExample ? 'EXAMPLE:\n$o~$f~name$v~John Doe$f~age$v~30$t~n$f~active$v~true$t~b$f~tags$v~admin$v~user' : ''}`;
  }
  
  // Minimal style (default)
  return `Output in LSF format:
$o~=object, $f~=field, $v~=value, $t~=type(n=int,f=float,b=bool,d=date,z=null)
NO quotes/brackets. Arrays: repeat $v~. Continuous line.${includeExample ? '\nExample: $o~$f~name$v~John$f~age$v~30$t~n$f~tags$v~a$v~b' : ''}`;
}

/**
 * Default export containing all LSF functions
 * @namespace LSF
 */
export default {
  /** Parse LSF string to DOM structure */
  parseToDom,
  /** Parse LSF bytes to DOM structure */
  parseToDomFromBytes,
  /** Parse LSF string directly to JSON string */
  parseToJsonString,
  /** Parse LSF bytes directly to JSON string */
  parseToJsonStringFromBytes,
  /** Encode JavaScript object to LSF string */
  encodeToString: encodeLSFToString,
  /** Encode JavaScript object to LSF byte array */
  encodeToArray: encodeLSFToArray,
  /** Get LLM prompt for LSF generation */
  getLLMPrompt
};