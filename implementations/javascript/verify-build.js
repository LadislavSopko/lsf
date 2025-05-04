// Script to verify the build can be imported correctly
try {
  const { LSFSimple, LSFEncoder, LSFDecoder, lsfToJson, VERSION } = require('./dist');

  console.log(`LSF Version: ${VERSION}`);

  // Create a test data object (correctly formatted for LSFSimple with named objects)
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

  try {
    // Use the simple API
    console.log("\nTesting simple API...");
    const simple = new LSFSimple();
    const lsf = simple.encode(testData);
    console.log("\nLSF Output:");
    console.log(lsf);

    // Decode LSF back to object
    console.log("\nDecoding LSF...");
    const decoded = simple.decode(lsf);
    console.log("\nDecoded object:");
    console.log(JSON.stringify(decoded, null, 2));

    // Test encoder directly with the class-based API
    console.log("\nTesting encoder class API...");
    const encoder = new LSFEncoder();
    
    // First object
    encoder.startObject("TestObj");
    encoder.addField("name", "LSF Test");
    encoder.addField("version", 1.2);
    encoder.addList("features", ["Reliable", "Structured", "LLM-friendly"]);
    
    // Second object
    encoder.startObject("NestedData");
    encoder.addField("value", true);
    encoder.addField("count", 42);
    
    const manualLsf = encoder.toString();
    console.log("\nManually encoded LSF:");
    console.log(manualLsf);
    
    // Decode manual LSF to verify
    console.log("\nDecoded manual LSF:");
    const decodedManual = new LSFDecoder().decode(manualLsf);
    console.log(JSON.stringify(decodedManual, null, 2));

    // Convert LSF to JSON
    console.log("\nTesting LSF to JSON conversion...");
    const jsonOutput = lsfToJson(lsf);
    console.log("\nLSF converted to JSON:");
    console.log(jsonOutput);

    console.log("\nVerification complete - all components working correctly!");
  } catch (innerError) {
    console.error("Error during encoding/decoding:", innerError);
  }
} catch (error) {
  console.error("Error importing LSF library:", error);
} 