/**
 * LSF Format Benchmarks
 * 
 * Measures performance of LSF encoding/decoding and compares with JSON
 */

const { LSFEncoder, LSFDecoder, LSFSimple, UltraFastLSFParser, getParser, LSFParserType } = require('./dist/index');

// Utility for timing operations
function benchmark(name, iterations, fn) {
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const average = totalTime / iterations;
  
  console.log(`${name}: ${totalTime.toFixed(2)}ms total, ${average.toFixed(4)}ms per operation`);
  
  return { 
    name, 
    total: totalTime,
    average,
    iterations
  };
}

// Test data generation
function generateSmallData() {
  return {
    user: {
      id: 123,
      name: "John Doe",
      email: "john@example.com",
      active: true,
      roles: ["admin", "user"]
    }
  };
}

function generateMediumData() {
  const data = { products: {} };
  
  for (let i = 0; i < 100; i++) {
    data.products[`product${i}`] = {
      id: i,
      name: `Product ${i}`,
      price: parseFloat((i * 1.99).toFixed(2)),
      inStock: i % 2 === 0,
      tags: [`tag${i % 5}`, `category${i % 3}`]
    };
  }
  
  return data;
}

function generateLargeData() {
  const data = { 
    users: {},
    products: {},
    orders: {}
  };
  
  // Add 1,000 products
  for (let i = 0; i < 1000; i++) {
    data.products[`product${i}`] = {
      id: i,
      sku: `SKU-${i.toString().padStart(6, '0')}`,
      name: `Product ${i}`,
      description: `This is a detailed description for product ${i} that contains enough text to make it realistic`,
      price: parseFloat((i * 1.99).toFixed(2)),
      inStock: i % 2 === 0,
      quantity: Math.floor(Math.random() * 100),
      tags: [`tag${i % 10}`, `category${i % 5}`, `type${i % 3}`],
      attributes: {
        color: ["red", "blue", "green"][i % 3],
        size: ["small", "medium", "large"][i % 3],
        weight: parseFloat((i * 0.1).toFixed(1))
      }
    };
  }
  
  // Add 100 users
  for (let i = 0; i < 100; i++) {
    data.users[`user${i}`] = {
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      active: i % 10 !== 0,
      joined: new Date(2020, i % 12, (i % 28) + 1).toISOString(),
      preferences: {
        theme: ["light", "dark"][i % 2],
        notifications: i % 3 !== 0,
        language: ["en", "es", "fr", "de"][i % 4]
      }
    };
  }
  
  // Add some orders
  for (let i = 0; i < 200; i++) {
    const userId = i % 100;
    const orderItems = [];
    const itemCount = (i % 5) + 1;
    
    for (let j = 0; j < itemCount; j++) {
      const productId = (i * j) % 1000;
      orderItems.push({
        productId,
        quantity: (j % 3) + 1,
        price: parseFloat((productId * 1.99).toFixed(2))
      });
    }
    
    data.orders[`order${i}`] = {
      id: i,
      userId,
      date: new Date(2023, (i % 12), (i % 28) + 1).toISOString(),
      items: orderItems,
      status: ["pending", "processing", "shipped", "delivered"][i % 4],
      total: parseFloat((itemCount * 19.99).toFixed(2))
    };
  }
  
  return data;
}

// Run the benchmarks
async function runBenchmarks() {
  console.log("====== LSF Format Performance Benchmarks ======");
  console.log(`LSF Version: ${require('./dist/index').VERSION}`);
  console.log("==============================================\n");
  
  // Get test data
  const smallData = generateSmallData();
  const mediumData = generateMediumData();
  const largeData = generateLargeData();

  // Convert to JSON for comparison
  const smallJSON = JSON.stringify(smallData);
  const mediumJSON = JSON.stringify(mediumData);
  const largeJSON = JSON.stringify(largeData);
  
  console.log(`\nData Sizes for Comparison:`);
  console.log(`Small data: ${smallJSON.length.toLocaleString()} chars`);
  console.log(`Medium data: ${mediumJSON.length.toLocaleString()} chars`);
  console.log(`Large data: ${largeJSON.length.toLocaleString()} chars`);
  
  // Create instances
  const lsfSimple = new LSFSimple();
  
  // Encode the data to LSF
  console.log("\n----- ENCODING BENCHMARKS -----");
  
  // Small data
  let smallLSF;
  const smallEncodeResult = benchmark("Encode small data (LSFSimple)", 10000, () => {
    smallLSF = lsfSimple.encode(smallData);
  });
  
  const smallJsonEncodeResult = benchmark("Encode small data (JSON.stringify)", 10000, () => {
    JSON.stringify(smallData);
  });
  
  console.log(`Format Size Comparison - Small Data:`);
  console.log(`JSON: ${smallJSON.length} chars, LSF: ${smallLSF.length} chars, Difference: ${((smallLSF.length / smallJSON.length) * 100 - 100).toFixed(1)}%`);
  
  // Medium data
  let mediumLSF;
  const mediumEncodeResult = benchmark("Encode medium data (LSFSimple)", 500, () => {
    mediumLSF = lsfSimple.encode(mediumData);
  });
  
  const mediumJsonEncodeResult = benchmark("Encode medium data (JSON.stringify)", 500, () => {
    JSON.stringify(mediumData);
  });
  
  console.log(`Format Size Comparison - Medium Data:`);
  console.log(`JSON: ${mediumJSON.length} chars, LSF: ${mediumLSF.length} chars, Difference: ${((mediumLSF.length / mediumJSON.length) * 100 - 100).toFixed(1)}%`);

  // Large data
  let largeLSF;
  const largeEncodeResult = benchmark("Encode large data (LSFSimple)", 20, () => {
    largeLSF = lsfSimple.encode(largeData);
  });
  
  const largeJsonEncodeResult = benchmark("Encode large data (JSON.stringify)", 20, () => {
    JSON.stringify(largeData);
  });
  
  console.log(`Format Size Comparison - Large Data:`);
  console.log(`JSON: ${largeJSON.length} chars, LSF: ${largeLSF.length} chars, Difference: ${((largeLSF.length / largeJSON.length) * 100 - 100).toFixed(1)}%`);
  
  // Decode using different parsers
  console.log("\n----- DECODING BENCHMARKS -----");
  
  // Small data  
  benchmark("Decode small data (LSFDecoder)", 5000, () => {
    const decoder = new LSFDecoder();
    decoder.decode(smallLSF);
  });
  
  benchmark("Decode small data (UltraFastLSFParser)", 5000, () => {
    const parser = new UltraFastLSFParser(smallLSF);
    parser.parse();
  });
  
  benchmark("Decode small data (JSON.parse)", 5000, () => {
    JSON.parse(smallJSON);
  });
  
  // Medium data
  benchmark("Decode medium data (LSFDecoder)", 200, () => {
    const decoder = new LSFDecoder();
    decoder.decode(mediumLSF);
  });
  
  benchmark("Decode medium data (UltraFastLSFParser)", 200, () => {
    const parser = new UltraFastLSFParser(mediumLSF);
    parser.parse();
  });
  
  benchmark("Decode medium data (JSON.parse)", 200, () => {
    JSON.parse(mediumJSON);
  });
  
  // Large data
  benchmark("Decode large data (LSFDecoder)", 10, () => {
    const decoder = new LSFDecoder();
    decoder.decode(largeLSF);
  });
  
  benchmark("Decode large data (UltraFastLSFParser)", 10, () => {
    const parser = new UltraFastLSFParser(largeLSF);
    parser.parse();
  });
  
  benchmark("Decode large data (JSON.parse)", 10, () => {
    JSON.parse(largeJSON);
  });
  
  // Test parser factory performance
  console.log("\n----- PARSER FACTORY BENCHMARKS -----");
  
  benchmark("Parser factory (STANDARD) with medium data", 200, () => {
    const parser = getParser(mediumLSF, LSFParserType.STANDARD);
    parser.parse();
  });
  
  benchmark("Parser factory (FAST) with medium data", 200, () => {
    const parser = getParser(mediumLSF, LSFParserType.FAST);
    parser.parse();
  });
  
  benchmark("Parser factory (AUTO) with medium data", 200, () => {
    const parser = getParser(mediumLSF);
    parser.parse();
  });
  
  // Test round-trip performance
  console.log("\n----- ROUND-TRIP BENCHMARKS -----");
  
  benchmark("LSF round-trip (medium data)", 100, () => {
    const lsf = new LSFSimple();
    const encoded = lsf.encode(mediumData);
    lsf.decode(encoded);
  });
  
  benchmark("JSON round-trip (medium data)", 100, () => {
    const encoded = JSON.stringify(mediumData);
    JSON.parse(encoded);
  });
  
  console.log("\n====== BENCHMARK COMPLETE ======");
}

// Run the benchmarks
runBenchmarks().catch(console.error); 