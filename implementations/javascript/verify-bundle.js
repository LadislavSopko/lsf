// Script to verify the bundled package
try {
  // Import the LSF library from the bundled file
  console.log('Importing LSF library from bundled file...');
  const { LSFSimple, LSFEncoder, LSFDecoder, lsfToJson, VERSION } = require('./dist');
  console.log(`LSF Version: ${VERSION}`);

  // Create test data
  const testData = {
    test: {
      name: "LSF Test",
      version: 1.2,
      features: ["Reliable", "Structured", "LLM-friendly"]
    },
    nested: {
      value: true,
      count: 42
    }
  };

  // Test the simple API
  console.log('\nTesting bundled LSFSimple class...');
  const simple = new LSFSimple();
  const lsf = simple.encode(testData);
  console.log('Encoded successfully.');
  
  // Decode
  const decoded = simple.decode(lsf);
  console.log('Decoded successfully:');
  console.log(JSON.stringify(decoded, null, 2));

  // Test the encoder directly
  console.log('\nTesting bundled LSFEncoder class...');
  const encoder = new LSFEncoder({ explicitTypes: true });
  encoder.startObject('BundleTest');
  encoder.addField('status', 'working');
  encoder.addTypedField('timestamp', Date.now(), 'int');
  const manualLsf = encoder.toString();
  console.log('Manual encoding successful.');
  
  // Test decoder
  console.log('\nTesting bundled LSFDecoder class...');
  const decoder = new LSFDecoder();
  const decodedManual = decoder.decode(manualLsf);
  console.log('Manual decoding successful:');
  console.log(JSON.stringify(decodedManual, null, 2));

  // Test conversion utilities
  console.log('\nTesting bundled conversion utilities...');
  const jsonOutput = lsfToJson(lsf);
  console.log('LSF to JSON conversion successful.');

  console.log('\nBundled package verification complete - all components working correctly!');
} catch (error) {
  console.error('Error testing bundled package:', error);
} 