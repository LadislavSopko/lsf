/**
 * LSF vs JSON Performance Benchmark
 * 
 * This script compares the performance of LSF and JSON for encoding/decoding operations
 * across different data sizes and complexity levels.
 */

const { LSFSimple, LSFEncoder, lsfToJson } = require('../dist');

// Utility for timing operations
function measureTime(fn, iterations = 1) {
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const end = process.hrtime.bigint();
  const timeInMs = Number(end - start) / 1_000_000;
  
  return {
    totalTimeMs: timeInMs,
    avgTimeMs: timeInMs / iterations
  };
}

// Sample data sets of varying complexity
const dataSets = {
  small: {
    user: {
      id: 12345,
      name: "John Doe",
      active: true
    }
  },
  medium: {
    user: {
      id: 12345,
      name: "John Doe",
      email: "john@example.com",
      active: true,
      roles: ["user", "admin"],
      preferences: {
        theme: "dark",
        notifications: true,
        language: "en-US"
      }
    }
  },
  large: (() => {
    // Generate a larger dataset with some repetitive content
    const data = {
      users: {},
      products: {},
      transactions: {},
      settings: {
        system: {
          debug: false,
          cacheEnabled: true,
          timeout: 30000,
          retryCount: 3,
          features: ["search", "export", "import", "reports", "dashboards"]
        }
      }
    };
    
    // Add 100 users
    for (let i = 1; i <= 100; i++) {
      data.users[`user${i}`] = {
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: i % 7 !== 0, // Some inactive users
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        permissions: i % 10 === 0 ? ["admin", "user", "manager"] : ["user"]
      };
    }
    
    // Add 20 products
    for (let i = 1; i <= 20; i++) {
      data.products[`product${i}`] = {
        id: i,
        name: `Product ${i}`,
        price: 9.99 + i,
        stock: i * 5,
        categories: [`category${i % 5 + 1}`, `category${i % 3 + 1}`],
        features: Array(i % 5 + 1).fill(0).map((_, idx) => `Feature ${idx + 1}`)
      };
    }
    
    // Add 50 transactions
    for (let i = 1; i <= 50; i++) {
      const userId = i % 100 + 1;
      const productId = i % 20 + 1;
      
      data.transactions[`tx${i}`] = {
        id: `TX-${10000 + i}`,
        userId: userId,
        productId: productId,
        amount: 9.99 + productId,
        date: new Date().toISOString(),
        status: i % 10 === 0 ? "pending" : (i % 5 === 0 ? "failed" : "completed")
      };
    }
    
    return data;
  })()
};

// Size reporting in tokens and bytes
function formatSize(obj) {
  const jsonString = JSON.stringify(obj);
  const lsfInstance = new LSFSimple();
  const lsfString = lsfInstance.encode(obj);
  
  // Very rough token estimation for comparison purposes
  // This is a simplistic model and not accurate for actual LLM token counting
  function estimateTokens(str) {
    // Roughly 4 chars per token as a simple estimation
    return Math.ceil(str.length / 4);
  }
  
  return {
    jsonBytes: jsonString.length,
    lsfBytes: lsfString.length,
    jsonTokens: estimateTokens(jsonString),
    lsfTokens: estimateTokens(lsfString),
    bytesRatio: (lsfString.length / jsonString.length).toFixed(2),
    tokensRatio: (estimateTokens(lsfString) / estimateTokens(jsonString)).toFixed(2)
  };
}

// Run benchmarks for each data set
function runBenchmarks() {
  const iterations = {
    small: 10000,
    medium: 5000,
    large: 500
  };
  
  console.log('LSF vs JSON Performance Benchmark\n');
  console.log('==================================\n');
  
  // Create instances
  const lsfSimple = new LSFSimple();
  
  // For each data set
  for (const [dataSetName, dataSet] of Object.entries(dataSets)) {
    const iters = iterations[dataSetName];
    console.log(`\n## ${dataSetName.toUpperCase()} DATA SET (${iters} iterations)`);
    
    // Get size metrics
    const sizeMetrics = formatSize(dataSet);
    console.log('\nSize Comparison:');
    console.log(`  JSON: ${sizeMetrics.jsonBytes} bytes / ~${sizeMetrics.jsonTokens} tokens`);
    console.log(`  LSF:  ${sizeMetrics.lsfBytes} bytes / ~${sizeMetrics.lsfTokens} tokens`);
    console.log(`  Ratio (LSF/JSON): ${sizeMetrics.bytesRatio}x bytes, ${sizeMetrics.tokensRatio}x tokens`);
    
    // Prepare data
    let jsonString;
    let lsfString;
    let jsonParsed;
    let lsfParsed;
    
    // Benchmark JSON stringify
    const jsonStringifyTime = measureTime(() => {
      jsonString = JSON.stringify(dataSet);
    }, iters);
    
    // Benchmark LSF encode
    const lsfEncodeTime = measureTime(() => {
      lsfString = lsfSimple.encode(dataSet);
    }, iters);
    
    // Benchmark JSON parse
    const jsonParseTime = measureTime(() => {
      jsonParsed = JSON.parse(jsonString);
    }, iters);
    
    // Benchmark LSF decode
    const lsfDecodeTime = measureTime(() => {
      lsfParsed = lsfSimple.decode(lsfString);
    }, iters);
    
    // Output results table
    console.log('\nPerformance Comparison:');
    console.log('| Operation     | JSON (avg ms) | LSF (avg ms) | LSF/JSON Ratio |');
    console.log('|---------------|--------------|--------------|----------------|');
    console.log(`| Encode        | ${jsonStringifyTime.avgTimeMs.toFixed(4).padStart(12)} | ${lsfEncodeTime.avgTimeMs.toFixed(4).padStart(12)} | ${(lsfEncodeTime.avgTimeMs / jsonStringifyTime.avgTimeMs).toFixed(2).padStart(14)} |`);
    console.log(`| Decode        | ${jsonParseTime.avgTimeMs.toFixed(4).padStart(12)} | ${lsfDecodeTime.avgTimeMs.toFixed(4).padStart(12)} | ${(lsfDecodeTime.avgTimeMs / jsonParseTime.avgTimeMs).toFixed(2).padStart(14)} |`);
    console.log(`| Total         | ${(jsonStringifyTime.avgTimeMs + jsonParseTime.avgTimeMs).toFixed(4).padStart(12)} | ${(lsfEncodeTime.avgTimeMs + lsfDecodeTime.avgTimeMs).toFixed(4).padStart(12)} | ${((lsfEncodeTime.avgTimeMs + lsfDecodeTime.avgTimeMs) / (jsonStringifyTime.avgTimeMs + jsonParseTime.avgTimeMs)).toFixed(2).padStart(14)} |`);
    
    // Verify data consistency
    const isConsistent = JSON.stringify(jsonParsed) === JSON.stringify(lsfParsed);
    console.log(`\nData consistency check: ${isConsistent ? 'PASSED' : 'FAILED'}`);
  }
  
  console.log('\n==================================');
}

// Run the benchmarks
console.log('Starting benchmarks...');
runBenchmarks(); 