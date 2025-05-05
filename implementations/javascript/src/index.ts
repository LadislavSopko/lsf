/**
 * LSF (LLM-Safe Format) TypeScript Implementation
 * 
 * A structured, flat serialization format designed specifically for maximum 
 * reliability when used with Large Language Models (LLMs).
 */

export { LSFEncoder } from './encoder';
export { LSFDecoder } from './decoder';
export { LSFSimple } from './simple';
export { lsfToJson, lsfToJsonPretty } from './conversion';
export { LSFTypeCode } from './types';
export { UltraFastLSFParser } from './fast-parser';
export { HyperFastLSFParser, hyperParse } from './hyper-fast-parser';
export { getParser, parse, LSFParserType, type LSFParser } from './parser-factory';

// Exports for the new DOM Parser and Visitor
export { LSFDOMParser, LSFDOMNavigator, parseLSF } from './lsf-dom-parser-preallocated';
export { LSFToJSON } from './lsf-to-json-visitor';

export const VERSION = '1.3.0'; 