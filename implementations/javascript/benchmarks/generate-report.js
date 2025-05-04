/**
 * LSF Benchmark Report Generator
 * 
 * This script runs benchmarks and generates CSV reports for further analysis.
 */

const fs = require('fs');
const path = require('path');
const { LSFSimple } = require('../dist');

// Import benchmark datasets
const { dataSets } = require('./data');

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

// Token estimation function (very rough)
function estimateTokens(str) {
  return Math.ceil(str.length / 4);
}

// Function to run performance benchmarks
function runPerformanceBenchmarks() {
  const results = [];
  const iterations = {
    small: 5000,
    medium: 1000,
    large: 100,
    xl: 10
  };
  
  console.log('Running performance benchmarks...');
  
  // Create instances
  const lsfSimple = new LSFSimple();
  
  // For each data set
  for (const [dataSetName, dataSet] of Object.entries(dataSets)) {
    console.log(`  Processing ${dataSetName} dataset...`);
    const iters = iterations[dataSetName] || 100;
    
    // Get size metrics
    const jsonString = JSON.stringify(dataSet);
    const lsfString = lsfSimple.encode(dataSet);
    
    const jsonBytes = jsonString.length;
    const lsfBytes = lsfString.length;
    const jsonTokens = estimateTokens(jsonString);
    const lsfTokens = estimateTokens(lsfString);
    
    // Benchmark JSON stringify
    const jsonStringifyTime = measureTime(() => {
      JSON.stringify(dataSet);
    }, iters);
    
    // Benchmark LSF encode
    const lsfEncodeTime = measureTime(() => {
      lsfSimple.encode(dataSet);
    }, iters);
    
    // Benchmark JSON parse
    const jsonParseTime = measureTime(() => {
      JSON.parse(jsonString);
    }, iters);
    
    // Benchmark LSF decode
    const lsfDecodeTime = measureTime(() => {
      lsfSimple.decode(lsfString);
    }, iters);
    
    // Store results
    results.push({
      dataSet: dataSetName,
      iterations: iters,
      jsonBytes,
      lsfBytes,
      jsonTokens,
      lsfTokens,
      bytesRatio: (lsfBytes / jsonBytes).toFixed(4),
      tokensRatio: (lsfTokens / jsonTokens).toFixed(4),
      jsonStringifyMs: jsonStringifyTime.avgTimeMs.toFixed(4),
      lsfEncodeMs: lsfEncodeTime.avgTimeMs.toFixed(4),
      encodeRatio: (lsfEncodeTime.avgTimeMs / jsonStringifyTime.avgTimeMs).toFixed(4),
      jsonParseMs: jsonParseTime.avgTimeMs.toFixed(4),
      lsfDecodeMs: lsfDecodeTime.avgTimeMs.toFixed(4),
      decodeRatio: (lsfDecodeTime.avgTimeMs / jsonParseTime.avgTimeMs).toFixed(4),
      jsonTotalMs: (jsonStringifyTime.avgTimeMs + jsonParseTime.avgTimeMs).toFixed(4),
      lsfTotalMs: (lsfEncodeTime.avgTimeMs + lsfDecodeTime.avgTimeMs).toFixed(4),
      totalRatio: ((lsfEncodeTime.avgTimeMs + lsfDecodeTime.avgTimeMs) / 
                   (jsonStringifyTime.avgTimeMs + jsonParseTime.avgTimeMs)).toFixed(4)
    });
  }
  
  return results;
}

// Function to run token efficiency benchmarks
function runTokenEfficiencyBenchmarks() {
  const results = [];
  
  console.log('Running token efficiency benchmarks...');
  
  // Import scenarios from the token efficiency script
  const { scenarios } = require('./scenarios');
  
  // Create instance
  const lsfSimple = new LSFSimple();
  
  // For each scenario
  for (const scenario of scenarios) {
    console.log(`  Processing ${scenario.name} scenario...`);
    const { name, description, data } = scenario;
    
    // Create different representations
    const lsfString = lsfSimple.encode(data);
    const jsonString = JSON.stringify(data);
    const jsonPrettyString = JSON.stringify(data, null, 2);
    
    // Calculate sizes and estimated tokens
    const lsfBytes = lsfString.length;
    const jsonBytes = jsonString.length;
    const jsonPrettyBytes = jsonPrettyString.length;
    
    const lsfTokens = estimateTokens(lsfString);
    const jsonTokens = estimateTokens(jsonString);
    const jsonPrettyTokens = estimateTokens(jsonPrettyString);
    
    // Store results
    results.push({
      scenario: name,
      description,
      lsfBytes,
      jsonBytes,
      jsonPrettyBytes,
      lsfTokens,
      jsonTokens,
      jsonPrettyTokens,
      bytesRatio: (lsfBytes / jsonBytes).toFixed(4),
      tokensRatio: (lsfTokens / jsonTokens).toFixed(4),
      prettyBytesRatio: (lsfBytes / jsonPrettyBytes).toFixed(4),
      prettyTokensRatio: (lsfTokens / jsonPrettyTokens).toFixed(4)
    });
  }
  
  return results;
}

// Function to generate CSV from results
function generateCSV(results, headers, filename) {
  const headerRow = headers.map(h => h.name).join(',');
  
  const rows = results.map(result => {
    return headers.map(header => {
      const value = result[header.key];
      // If value contains commas, wrap in quotes
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',');
  });
  
  const csv = [headerRow, ...rows].join('\n');
  
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }
  
  const filePath = path.join(reportsDir, filename);
  fs.writeFileSync(filePath, csv);
  console.log(`Report saved to: ${filePath}`);
  
  return filePath;
}

// Main function to run benchmarks and generate reports
function generateReports() {
  // Create data file if it doesn't exist
  const dataFile = path.join(__dirname, 'data.js');
  if (!fs.existsSync(dataFile)) {
    console.log('Creating data file...');
    
    // Get datasets from performance benchmark script
    const content = `
/**
 * Benchmark datasets
 */

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
      data.users[\`user\${i}\`] = {
        id: i,
        name: \`User \${i}\`,
        email: \`user\${i}@example.com\`,
        active: i % 7 !== 0, // Some inactive users
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        permissions: i % 10 === 0 ? ["admin", "user", "manager"] : ["user"]
      };
    }
    
    // Add 20 products
    for (let i = 1; i <= 20; i++) {
      data.products[\`product\${i}\`] = {
        id: i,
        name: \`Product \${i}\`,
        price: 9.99 + i,
        stock: i * 5,
        categories: [\`category\${i % 5 + 1}\`, \`category\${i % 3 + 1}\`],
        features: Array(i % 5 + 1).fill(0).map((_, idx) => \`Feature \${idx + 1}\`)
      };
    }
    
    // Add 50 transactions
    for (let i = 1; i <= 50; i++) {
      const userId = i % 100 + 1;
      const productId = i % 20 + 1;
      
      data.transactions[\`tx\${i}\`] = {
        id: \`TX-\${10000 + i}\`,
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

module.exports = { dataSets };
`;
    
    fs.writeFileSync(dataFile, content);
  }
  
  // Create scenarios file if it doesn't exist
  const scenariosFile = path.join(__dirname, 'scenarios.js');
  if (!fs.existsSync(scenariosFile)) {
    console.log('Creating scenarios file...');
    
    // Get scenarios from token efficiency benchmark script
    const content = `
/**
 * Benchmark scenarios
 */

const scenarios = [
  {
    name: "Simple User Profile",
    description: "Basic user profile with personal information",
    data: {
      user: {
        id: 12345,
        name: "Jane Smith",
        email: "jane.smith@example.com",
        verified: true,
        joined: "2023-04-15T10:30:00Z"
      }
    }
  },
  {
    name: "Function Call Parameters",
    description: "Typical parameters for an LLM function call",
    data: {
      function_call: {
        name: "get_weather",
        parameters: {
          location: "San Francisco, CA",
          units: "celsius",
          days: 5,
          include_hourly: true
        }
      }
    }
  },
  {
    name: "API Response",
    description: "Response from an API call with nested data",
    data: {
      response: {
        status: "success",
        code: 200,
        data: {
          products: [
            {
              id: "p123",
              name: "Smartphone X",
              price: 999.99,
              in_stock: true,
              features: ["5G", "Water resistant", "12MP camera"]
            },
            {
              id: "p456",
              name: "Laptop Pro",
              price: 1299.99,
              in_stock: false,
              features: ["16GB RAM", "512GB SSD", "4K display"]
            }
          ],
          pagination: {
            total: 42,
            page: 1,
            per_page: 10
          }
        }
      }
    }
  }
];

module.exports = { scenarios };
`;
    
    fs.writeFileSync(scenariosFile, content);
  }
  
  console.log('Starting benchmark report generation...');
  
  // Run benchmarks
  const performanceResults = runPerformanceBenchmarks();
  const tokenResults = runTokenEfficiencyBenchmarks();
  
  // Define headers for performance CSV
  const performanceHeaders = [
    { name: 'Dataset', key: 'dataSet' },
    { name: 'Iterations', key: 'iterations' },
    { name: 'JSON Size (bytes)', key: 'jsonBytes' },
    { name: 'LSF Size (bytes)', key: 'lsfBytes' },
    { name: 'Size Ratio (LSF/JSON)', key: 'bytesRatio' },
    { name: 'JSON Tokens (est)', key: 'jsonTokens' },
    { name: 'LSF Tokens (est)', key: 'lsfTokens' },
    { name: 'Token Ratio (LSF/JSON)', key: 'tokensRatio' },
    { name: 'JSON Stringify (ms)', key: 'jsonStringifyMs' },
    { name: 'LSF Encode (ms)', key: 'lsfEncodeMs' },
    { name: 'Encode Ratio (LSF/JSON)', key: 'encodeRatio' },
    { name: 'JSON Parse (ms)', key: 'jsonParseMs' },
    { name: 'LSF Decode (ms)', key: 'lsfDecodeMs' },
    { name: 'Decode Ratio (LSF/JSON)', key: 'decodeRatio' },
    { name: 'JSON Total (ms)', key: 'jsonTotalMs' },
    { name: 'LSF Total (ms)', key: 'lsfTotalMs' },
    { name: 'Total Ratio (LSF/JSON)', key: 'totalRatio' }
  ];
  
  // Define headers for token efficiency CSV
  const tokenHeaders = [
    { name: 'Scenario', key: 'scenario' },
    { name: 'Description', key: 'description' },
    { name: 'LSF Size (bytes)', key: 'lsfBytes' },
    { name: 'JSON Size (bytes)', key: 'jsonBytes' },
    { name: 'Pretty JSON Size (bytes)', key: 'jsonPrettyBytes' },
    { name: 'LSF Tokens (est)', key: 'lsfTokens' },
    { name: 'JSON Tokens (est)', key: 'jsonTokens' },
    { name: 'Pretty JSON Tokens (est)', key: 'jsonPrettyTokens' },
    { name: 'Bytes Ratio (LSF/JSON)', key: 'bytesRatio' },
    { name: 'Token Ratio (LSF/JSON)', key: 'tokensRatio' },
    { name: 'Pretty Bytes Ratio (LSF/JSON Pretty)', key: 'prettyBytesRatio' },
    { name: 'Pretty Token Ratio (LSF/JSON Pretty)', key: 'prettyTokensRatio' }
  ];
  
  // Generate CSVs
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const performanceFile = generateCSV(
    performanceResults,
    performanceHeaders,
    `performance-benchmark-${timestamp}.csv`
  );
  
  const tokenFile = generateCSV(
    tokenResults,
    tokenHeaders,
    `token-efficiency-${timestamp}.csv`
  );
  
  console.log('\nReport generation complete!');
  console.log('Summary:');
  console.log(`- Performance benchmark: ${performanceResults.length} datasets`);
  console.log(`- Token efficiency: ${tokenResults.length} scenarios`);
  
  // Calculate averages for summary
  const avgPerformance = performanceResults.reduce((sum, r) => sum + parseFloat(r.totalRatio), 0) / performanceResults.length;
  const avgTokens = tokenResults.reduce((sum, r) => sum + parseFloat(r.tokensRatio), 0) / tokenResults.length;
  const avgPrettyTokens = tokenResults.reduce((sum, r) => sum + parseFloat(r.prettyTokensRatio), 0) / tokenResults.length;
  
  console.log('\nKey Findings:');
  console.log(`- LSF is ${avgPerformance < 1 ? (1 - avgPerformance) * 100 + '% faster' : (avgPerformance - 1) * 100 + '% slower'} than JSON on average.`);
  
  if (avgTokens < 1) {
    console.log(`- LSF uses ${((1 - avgTokens) * 100).toFixed(2)}% fewer tokens compared to compact JSON.`);
  } else {
    console.log(`- LSF uses ${((avgTokens - 1) * 100).toFixed(2)}% more tokens compared to compact JSON.`);
  }
  
  if (avgPrettyTokens < 1) {
    console.log(`- LSF uses ${((1 - avgPrettyTokens) * 100).toFixed(2)}% fewer tokens compared to pretty-printed JSON.`);
  } else {
    console.log(`- LSF uses ${((avgPrettyTokens - 1) * 100).toFixed(2)}% more tokens compared to pretty-printed JSON.`);
  }
  
  return {
    performanceFile,
    tokenFile,
    performanceResults,
    tokenResults
  };
}

// Run the report generation
generateReports(); 