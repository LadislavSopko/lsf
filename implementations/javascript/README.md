# LSF for JavaScript/TypeScript

A JavaScript/TypeScript implementation of the LSF (LLM-Safe Format) specification v1.3.

## Installation

```bash
npm install lsf-format
# or
yarn add lsf-format
```

## Usage

### Basic Usage

```typescript
import { LSFEncoder, LSFDecoder } from 'lsf-format';

// Encoding data to LSF
const encoder = new LSFEncoder();
const lsfString = encoder
    .startObject('user')
    .addField('id', 123)
    .addField('name', 'John Doe')
    .addList('tags', ['admin', 'user'])
    .addTypedField('verified', true, 'b')
    .toString();

// Decoding LSF to JavaScript objects
const decoder = new LSFDecoder();
const data = decoder.decode(lsfString);
// Returns: { user: { id: '123', name: 'John Doe', tags: ['admin', 'user'], verified: true } }
```

### Simple API

For convenience, you can use the simplified API for quick conversions:

```typescript
import { LSFSimple } from 'lsf-format';

// Convert JavaScript object to LSF
const data = {
  product: {
    id: 456,
    name: 'Laptop',
    price: 999.99,
    in_stock: true,
    tags: ['electronics', 'computers']
  }
};

const lsf = new LSFSimple();
const lsfString = lsf.encode(data);

// Convert LSF string back to JavaScript object
const parsedData = lsf.decode(lsfString);
```

## Advanced Features

### Type Hints

LSF supports explicit type hints for values with single-letter type codes:

```typescript
const encoder = new LSFEncoder();
const lsfString = encoder
    .startObject('data')
    .addTypedField('count', 42, 'n')     // Number (integer)
    .addTypedField('price', 19.99, 'f')  // Float
    .addTypedField('active', true, 'b')  // Boolean
    .addTypedField('date', new Date(), 'd') // Date
    .addTypedField('name', 'Test', 's')  // String (explicit)
    .toString();
```

### Binary Data

Binary data is automatically base64 encoded:

```typescript
// Using Buffer in Node.js
const binaryData = Buffer.from([0x01, 0x02, 0x03, 0x04]);

const encoder = new LSFEncoder();
const lsfString = encoder
    .startObject('file')
    .addField('content', binaryData) // Binary data is stored as base64 strings
    .toString();
```

### High-Performance Parser

For maximum parsing performance, LSF includes an optimized parser:

```typescript
import { UltraFastLSFParser, getParser } from 'lsf-format';

// Use directly
const fastParser = new UltraFastLSFParser(lsfString);
const data = fastParser.parse();

// Or use the parser factory
import { getParser, LSFParserType } from 'lsf-format';
const parser = getParser(lsfString, LSFParserType.FAST);
const result = parser.parse();
```

## Error Handling

LSF is designed to be robust against parsing errors:

```typescript
import { LSFDecoder } from 'lsf-format';

const decoder = new LSFDecoder();
try {
  const data = decoder.decode(malformedLSFString);
  // Even with errors, you'll get partial data
  console.log(data);
  
  // Check for error fields
  console.log(decoder.getErrors());
} catch (e) {
  console.error('Critical parsing error:', e);
}
```

## LSF to JSON Conversion

Easily convert between LSF and JSON:

```typescript
import { lsfToJson } from 'lsf-format';

// Convert LSF to JSON
const jsonString = lsfToJson(lsfString);

// With pretty printing
const prettyJson = lsfToJson(lsfString, 2); // 2-space indentation

// With custom replacer function
const jsonWithReplacer = lsfToJson(lsfString, (key, value) => {
  if (key === 'password') return undefined; // Remove password fields
  return value;
}, 2);
```

## Development

```bash
# Clone the repository
git clone https://github.com/LadislavSopko/lsf.git
cd lsf/implementations/javascript

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Generate documentation
npm run docs
```

## License

MIT License - see [LICENSE](../../LICENSE) file for details. 