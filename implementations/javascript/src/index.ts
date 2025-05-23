// LSF (LLM-Safe Format) TypeScript Implementation
// Main entry point with public API

import { TokenScanner } from './parser/token-scanner';
import { DOMBuilder } from './parser/dom-builder';
import { LSFToJSONVisitor } from './parser/visitor';
import { encodeLSFToString, encodeLSFToArray } from './parser/encoder';
import type { LSFNode, ParseResult, DOMNavigator as DOMNavigatorInterface } from './parser/types';

// Re-export types
export type { LSFNode, ParseResult, TokenInfo, DOMNavigator } from './parser/types';

/**
 * Parse LSF string to DOM structure
 * @param input LSF formatted string
 * @returns ParseResult with DOM navigator
 */
export function parseToDom(input: string): ParseResult {
  const scanner = new TokenScanner();
  const scanResult = scanner.scan(input);
  const builder = new DOMBuilder(scanResult);
  return builder.buildDOM();
}

/**
 * Parse LSF bytes to DOM structure
 * @param input LSF formatted bytes
 * @returns ParseResult with DOM navigator
 */
export function parseToDomFromBytes(input: Uint8Array): ParseResult {
  const scanner = new TokenScanner();
  const scanResult = scanner.scan(input);
  const builder = new DOMBuilder(scanResult);
  return builder.buildDOM();
}

/**
 * Parse LSF string directly to JSON string
 * @param input LSF formatted string
 * @returns JSON string or null on error
 */
export function parseToJsonString(input: string): string | null {
  // Add size limit check (10MB default)
  const maxSizeInMB = 10;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  if (input.length > maxSizeInBytes) {
    throw new Error(`Input size exceeds maximum allowed size of ${maxSizeInMB}MB`);
  }
  
  const result = parseToDom(input);
  if (!result.navigator) {
    return null;
  }
  
  const visitor = new LSFToJSONVisitor(result);
  return visitor.buildJSON();
}

/**
 * Parse LSF bytes directly to JSON string
 * @param input LSF formatted bytes
 * @returns JSON string or null on error
 */
export function parseToJsonStringFromBytes(input: Uint8Array): string | null {
  const result = parseToDomFromBytes(input);
  if (!result.navigator) {
    return null;
  }
  
  const visitor = new LSFToJSONVisitor(result);
  return visitor.buildJSON();
}

// Re-export encoder functions with simpler names
export const encodeToString = encodeLSFToString;
export const encodeToArray = encodeLSFToArray;
export { encodeLSFToString, encodeLSFToArray };

// Default export with all functions (similar to C# static class)
export default {
  parseToDom,
  parseToDomFromBytes,
  parseToJsonString,
  parseToJsonStringFromBytes,
  encodeToString: encodeLSFToString,
  encodeToArray: encodeLSFToArray
};