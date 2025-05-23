/**
 * Options for configuring LSF parser behavior
 */
export interface ParserOptions {
  /**
   * Maximum allowed input size in bytes
   * @default 10485760 (10MB)
   */
  maxInputSize?: number;
  
  /**
   * Whether to validate type hints during parsing
   * @default true
   */
  validateTypeHints?: boolean;
}

/**
 * Default parser options
 */
export const defaultParserOptions: Required<ParserOptions> = {
  maxInputSize: 10 * 1024 * 1024, // 10MB
  validateTypeHints: true
};

/**
 * Merge user options with defaults
 */
export function mergeOptions(options?: ParserOptions): Required<ParserOptions> {
  return {
    ...defaultParserOptions,
    ...options
  };
}