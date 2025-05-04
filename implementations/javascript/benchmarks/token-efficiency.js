/**
 * LSF vs JSON Token Efficiency Analysis
 * 
 * This script analyzes the token efficiency of LSF compared to JSON
 * with a focus on LLM input/output efficiency.
 */

const { LSFSimple, lsfToJson, lsfToJsonPretty } = require('../dist');

// Sample scenarios that represent common LLM use cases
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
  },
  {
    name: "Complex Nested Structure",
    description: "Deeply nested JSON structure with arrays and objects",
    data: {
      organization: {
        id: "org123",
        name: "Acme Inc.",
        departments: [
          {
            id: "dep1",
            name: "Engineering",
            teams: [
              {
                id: "team1",
                name: "Frontend",
                members: [
                  {
                    id: "emp101",
                    name: "Alex Chen",
                    role: "Lead Developer",
                    skills: ["JavaScript", "React", "TypeScript"],
                    projects: [
                      {
                        id: "proj1",
                        name: "Website Redesign",
                        status: "In Progress",
                        completion: 0.75
                      }
                    ]
                  },
                  {
                    id: "emp102",
                    name: "Sam Taylor",
                    role: "UX Designer",
                    skills: ["Figma", "UI/UX", "Prototyping"],
                    projects: [
                      {
                        id: "proj1",
                        name: "Website Redesign",
                        status: "In Progress",
                        completion: 0.8
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  },
  {
    name: "LLM Completion Context",
    description: "Typical context passed to an LLM for completion",
    data: {
      context: {
        system_prompt: "You are a helpful assistant that answers questions about programming.",
        user_history: [
          {
            role: "user",
            message: "How do I create a React component?",
            timestamp: "2023-05-10T14:22:10Z"
          },
          {
            role: "assistant",
            message: "In React, you can create a component using either a function or a class. Here's an example of a functional component...",
            timestamp: "2023-05-10T14:22:15Z"
          },
          {
            role: "user",
            message: "How do I add state to it?",
            timestamp: "2023-05-10T14:23:30Z"
          }
        ],
        preferences: {
          temperature: 0.7,
          top_p: 1,
          max_tokens: 300,
          code_examples: true
        }
      }
    }
  },
  {
    name: "Repetitive Data",
    description: "Data with repeated structures that might benefit from references",
    data: {
      order: {
        id: "ord789",
        customer: {
          id: "cust123",
          name: "John Doe",
          email: "john@example.com",
          address: {
            street: "123 Main St",
            city: "Anytown",
            state: "CA",
            zip: "90210",
            country: "USA"
          }
        },
        items: [
          {
            id: "item1",
            product: {
              id: "prod555",
              name: "Coffee Maker",
              brand: "BrewMaster",
              price: 89.99,
              category: "Kitchen Appliances"
            },
            quantity: 1,
            price: 89.99
          },
          {
            id: "item2",
            product: {
              id: "prod556",
              name: "Coffee Beans",
              brand: "BrewMaster",
              price: 15.99,
              category: "Groceries"
            },
            quantity: 2,
            price: 31.98
          },
          {
            id: "item3",
            product: {
              id: "prod557",
              name: "Coffee Filters",
              brand: "BrewMaster",
              price: 5.99,
              category: "Kitchen Supplies"
            },
            quantity: 1,
            price: 5.99
          }
        ],
        shipping_address: {
          street: "123 Main St",
          city: "Anytown",
          state: "CA",
          zip: "90210",
          country: "USA"
        },
        billing_address: {
          street: "123 Main St",
          city: "Anytown",
          state: "CA",
          zip: "90210",
          country: "USA"
        }
      }
    }
  }
];

// Token estimation function
function estimateTokens(str) {
  // This is a very rough estimation!
  // In reality, tokenization depends on the specific model and tokenizer
  
  // Average 4 characters per token as a rough estimate
  // This is oversimplified but gives us a basis for comparison
  return Math.ceil(str.length / 4);
}

// Function to analyze a scenario
function analyzeScenario(scenario) {
  const { name, description, data } = scenario;
  
  // Create different representations
  const lsfInstance = new LSFSimple();
  const lsfString = lsfInstance.encode(data);
  const jsonString = JSON.stringify(data);
  const jsonPrettyString = JSON.stringify(data, null, 2);
  const lsfPrettyString = lsfToJsonPretty(lsfString);
  
  // Calculate sizes and estimated tokens
  const lsfBytes = lsfString.length;
  const jsonBytes = jsonString.length;
  const jsonPrettyBytes = jsonPrettyString.length;
  
  const lsfTokens = estimateTokens(lsfString);
  const jsonTokens = estimateTokens(jsonString);
  const jsonPrettyTokens = estimateTokens(jsonPrettyString);
  
  // Calculate ratios
  const bytesRatio = (lsfBytes / jsonBytes).toFixed(2);
  const tokensRatio = (lsfTokens / jsonTokens).toFixed(2);
  const prettyBytesRatio = (lsfBytes / jsonPrettyBytes).toFixed(2);
  const prettyTokensRatio = (lsfTokens / jsonPrettyTokens).toFixed(2);
  
  // Results
  return {
    name,
    description,
    lsfBytes,
    jsonBytes,
    jsonPrettyBytes,
    lsfTokens,
    jsonTokens,
    jsonPrettyTokens,
    bytesRatio,
    tokensRatio,
    prettyBytesRatio,
    prettyTokensRatio,
    lsfSample: lsfString.length > 100 ? lsfString.substring(0, 97) + '...' : lsfString,
    jsonSample: jsonString.length > 100 ? jsonString.substring(0, 97) + '...' : jsonString
  };
}

// Run analysis for all scenarios
function runAnalysis() {
  console.log('LSF vs JSON Token Efficiency Analysis\n');
  console.log('=======================================\n');
  
  // Table headers for summary
  const summaryResults = [];
  
  // Analyze each scenario
  for (const scenario of scenarios) {
    const results = analyzeScenario(scenario);
    summaryResults.push(results);
    
    console.log(`## ${results.name}`);
    console.log(`${results.description}\n`);
    
    console.log('Size Comparison:');
    console.log(`  LSF:             ${results.lsfBytes} bytes / ~${results.lsfTokens} tokens`);
    console.log(`  JSON (compact):  ${results.jsonBytes} bytes / ~${results.jsonTokens} tokens`);
    console.log(`  JSON (pretty):   ${results.jsonPrettyBytes} bytes / ~${results.jsonPrettyTokens} tokens`);
    
    console.log('\nEfficiency Ratios (LSF/JSON):');
    console.log(`  vs JSON compact: ${results.bytesRatio}x bytes, ${results.tokensRatio}x tokens`);
    console.log(`  vs JSON pretty:  ${results.prettyBytesRatio}x bytes, ${results.prettyTokensRatio}x tokens`);
    
    console.log('\nSamples:');
    console.log(`  LSF:    ${results.lsfSample}`);
    console.log(`  JSON:   ${results.jsonSample}`);
    
    console.log('\n---------------------------------------\n');
  }
  
  // Print summary table
  console.log('## Summary Table');
  console.log('| Scenario | LSF Size | JSON Size | Pretty JSON | LSF/JSON Ratio | vs Pretty |');
  console.log('|----------|----------|-----------|-------------|----------------|----------|');
  
  for (const result of summaryResults) {
    console.log(
      `| ${result.name} | ${result.lsfBytes} B / ${result.lsfTokens} T | ${result.jsonBytes} B / ${result.jsonTokens} T | ${result.jsonPrettyBytes} B / ${result.jsonPrettyTokens} T | ${result.bytesRatio}x / ${result.tokensRatio}x | ${result.prettyBytesRatio}x / ${result.prettyTokensRatio}x |`
    );
  }
  
  // Calculate averages
  const avgBytesRatio = summaryResults.reduce((sum, r) => sum + parseFloat(r.bytesRatio), 0) / summaryResults.length;
  const avgTokensRatio = summaryResults.reduce((sum, r) => sum + parseFloat(r.tokensRatio), 0) / summaryResults.length;
  const avgPrettyBytesRatio = summaryResults.reduce((sum, r) => sum + parseFloat(r.prettyBytesRatio), 0) / summaryResults.length;
  const avgPrettyTokensRatio = summaryResults.reduce((sum, r) => sum + parseFloat(r.prettyTokensRatio), 0) / summaryResults.length;
  
  console.log('|----------|----------|-----------|-------------|----------------|----------|');
  console.log(`| **AVERAGE** | | | | **${avgBytesRatio.toFixed(2)}x / ${avgTokensRatio.toFixed(2)}x** | **${avgPrettyBytesRatio.toFixed(2)}x / ${avgPrettyTokensRatio.toFixed(2)}x** |`);
  
  console.log('\n## Conclusion');
  
  if (avgTokensRatio < 1) {
    console.log(`LSF is on average ${(1 - avgTokensRatio).toFixed(2) * 100}% more token-efficient than JSON.`);
    console.log(`When compared to pretty-printed JSON, LSF is ${(1 - avgPrettyTokensRatio).toFixed(2) * 100}% more token-efficient.`);
  } else {
    console.log(`LSF uses on average ${(avgTokensRatio - 1).toFixed(2) * 100}% more tokens than JSON.`);
    console.log(`When compared to pretty-printed JSON, LSF uses ${(avgPrettyTokensRatio - 1).toFixed(2) * 100}% less tokens.`);
  }
  
  console.log('\nNote: Token estimation is very approximate and actual token counts will vary depending on the specific tokenizer and model used.');
}

// Run the analysis
console.log('Starting token efficiency analysis...');
runAnalysis(); 