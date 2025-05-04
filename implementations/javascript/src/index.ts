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
export { LSFTypeHint } from './types';

export const VERSION = '1.2.0'; 