/**
 * LSF Format - JavaScript Usage Example
 *
 * This file demonstrates the various ways to use the LSF format library in JavaScript.
 */

try {
  // Import the LSF library
  console.log('Importing LSF library...');
  const { LSFSimple, LSFEncoder, LSFDecoder, lsfToJson, lsfToJsonPretty } = require('../dist');
  console.log('LSF library imported successfully');

  // Example 1: Simple API - The easiest way to use LSF
  console.log('\n=== Example 1: Simple API ===');

  // Create a simple LSF instance
  console.log('Creating LSF instance...');
  const lsf = new LSFSimple();
  console.log('LSF instance created successfully');

  // Create data objects (LSF uses an object structure where each top-level key becomes a named object)
  const userData = {
    user: {
      id: 12345,
      name: 'Jane Doe',
      email: 'jane@example.com',
      isActive: true,
      tags: ['customer', 'premium', 'early-adopter']
    },
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en-US'
    }
  };

  // Encode to LSF format
  const lsfString = lsf.encode(userData);
  console.log('\nEncoded LSF String:');
  console.log(lsfString);

  // Decode from LSF format
  const decodedData = lsf.decode(lsfString);
  console.log('\nDecoded Data:');
  console.log(JSON.stringify(decodedData, null, 2));

  // Convert LSF to JSON (useful for debugging or visualization)
  console.log('\nLSF converted to JSON:');
  console.log(lsfToJsonPretty(lsfString));

  // Example 2: Using the Encoder and Decoder directly
  console.log('\n\n=== Example 2: Direct Encoder/Decoder API ===');

  // Create an encoder with options
  const encoder = new LSFEncoder({
    explicitTypes: true,      // Use explicit type hints for all values
    includeVersion: true      // Include LSF version in the output
  });

  // Encode data using the fluent API
  encoder.startObject('product');
  encoder.addField('name', 'Amazing Widget');
  encoder.addTypedField('price', 19.99, 'float');
  encoder.addTypedField('inStock', true, 'bool');
  encoder.addList('colors', ['red', 'blue', 'green']);

  // Add a transaction boundary (useful when sending multiple related objects)
  encoder.endTransaction();

  // Add another object
  encoder.startObject('metadata');
  encoder.addField('version', '1.0.0');
  encoder.addField('timestamp', new Date().toISOString());

  // Get the final LSF string
  const manualLsfString = encoder.toString();
  console.log('\nManually Encoded LSF:');
  console.log(manualLsfString);

  // Create a decoder
  const decoder = new LSFDecoder();

  // Decode the LSF string
  const manualDecodedData = decoder.decode(manualLsfString);
  console.log('\nManually Decoded Data:');
  console.log(JSON.stringify(manualDecodedData, null, 2));

  // Example 3: Error Handling
  console.log('\n\n=== Example 3: Error Handling ===');

  // Create an invalid LSF string with a syntax error
  const invalidLsf = '$o§user$r§$f§name$f§John Doe$r§$f§invalid_syntax';

  // Try to decode it
  try {
    const decoded = lsf.decode(invalidLsf);
    console.log('Decoded despite error:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Get any errors that occurred during decoding
    const errors = lsf.getErrors();
    console.log('\nErrors encountered:');
    console.log(errors);
  } catch (error) {
    console.error('Decoding failed:', error);
  }

  // Example 4: Integration with an LLM API (simulated)
  console.log('\n\n=== Example 4: LLM Integration Example ===');

  async function simulateLLMCall() {
    // This simulates an LLM returning LSF-formatted data
    const fakeLLMResponse = `I'll provide the user data in LSF format:

$o§user$r§$f§id$f§789$r§$f§name$f§Alex Smith$r§$f§email$f§alex@example.com$r§

The user has the following preferences:

$o§preferences$r§$f§theme$f§light$r§$f§language$f§en-GB$r§

Let me know if you need any other information.`;

    return fakeLLMResponse;
  }

  async function extractLSFFromLLMResponse() {
    // Get the simulated LLM response
    const llmResponse = await simulateLLMCall();
    console.log('LLM Response:');
    console.log(llmResponse);
    
    // Extract LSF from the text (in real usage, you might need a more robust extraction)
    const lsfRegex = /\$o§.*?(?:\$r§.*?)*$/gms;
    const lsfMatches = llmResponse.match(lsfRegex);
    
    if (lsfMatches && lsfMatches.length > 0) {
      const extractedLsf = lsfMatches.join('');
      console.log('\nExtracted LSF:');
      console.log(extractedLsf);
      
      // Decode the extracted LSF
      const extractedData = lsf.decode(extractedLsf);
      console.log('\nExtracted Data:');
      console.log(JSON.stringify(extractedData, null, 2));
      
      return extractedData;
    } else {
      console.log('No LSF data found in the response');
      return null;
    }
  }

  // Call the function but don't await (for this example)
  extractLSFFromLLMResponse().catch(console.error);

  console.log('\nFor more examples and detailed API documentation, refer to the project README and API docs.');
} catch (error) {
  console.error('Error initializing the script:', error);
}
