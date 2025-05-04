/**
 * LSF Parser Factory
 * 
 * This module provides factory methods for creating appropriate parsers.
 */

import { LSFDocument } from './types';
import { LSFDecoder } from './decoder';
import { UltraFastLSFParser } from './fast-parser';

/**
 * Available parser types
 */
export enum LSFParserType {
  /**
   * Standard LSF decoder (most compatible)
   */
  STANDARD = 'standard',
  
  /**
   * Ultra-fast LSF parser (best performance)
   */
  FAST = 'fast',
  
  /**
   * Automatically select the appropriate parser
   */
  AUTO = 'auto'
}

/**
 * Interface that all LSF parsers must implement
 */
export interface LSFParser {
  /**
   * Parse LSF string to a document
   */
  parse(): LSFDocument;
}

/**
 * Adapter for LSFDecoder to match the LSFParser interface
 */
class LSFDecoderAdapter implements LSFParser {
  private decoder: LSFDecoder;
  private input: string;
  
  constructor(input: string, options?: any) {
    this.decoder = new LSFDecoder(options);
    this.input = input;
  }
  
  parse(): LSFDocument {
    return this.decoder.decode(this.input);
  }
}

/**
 * Get an appropriate parser for the given LSF string
 * 
 * @param lsfString LSF formatted string to parse
 * @param parserType Type of parser to use (default: AUTO)
 * @param options Additional options to pass to the parser
 * @returns A parser instance
 */
export function getParser(
  lsfString: string, 
  parserType: LSFParserType = LSFParserType.AUTO,
  options?: any
): LSFParser {
  
  // For small strings, standard parser might be more efficient
  // due to initialization overhead of UltraFastLSFParser
  const smallStringThreshold = 500;
  
  switch (parserType) {
    case LSFParserType.STANDARD:
      return new LSFDecoderAdapter(lsfString, options);
      
    case LSFParserType.FAST:
      return new UltraFastLSFParser(lsfString);
      
    case LSFParserType.AUTO:
    default:
      // Auto-select based on input size
      if (lsfString.length < smallStringThreshold) {
        return new LSFDecoderAdapter(lsfString, options);
      } else {
        return new UltraFastLSFParser(lsfString);
      }
  }
}

/**
 * Simple function to directly parse an LSF string
 * 
 * @param lsfString LSF formatted string to parse
 * @param parserType Type of parser to use (default: AUTO)
 * @returns Parsed LSF document
 */
export function parse(
  lsfString: string,
  parserType: LSFParserType = LSFParserType.AUTO
): LSFDocument {
  const parser = getParser(lsfString, parserType);
  return parser.parse();
} 