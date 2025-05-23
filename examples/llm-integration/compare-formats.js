const Anthropic = require('@anthropic-ai/sdk');
const { parseToJsonString, encodeToString, getLLMPrompt } = require('lsf-format');
const { parseStringPromise, Builder } = require('xml2js');
const chalk = require('chalk');
const { testCases, generateComplexDataset } = require('./test-cases.js');
const dotenv = require('dotenv');

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Format prompts for each format type
const FORMAT_PROMPTS = {
  json: {
    instruction: "Generate the following data as valid JSON. Ensure all strings are properly escaped, quotes are balanced, and the syntax is valid.",
    example: '{"name": "John", "age": 30, "active": true}'
  },
  xml: {
    instruction: "Generate the following data as valid XML. Use appropriate tags and ensure all special characters are properly escaped.",
    example: '<data><name>John</name><age>30</age><active>true</active></data>'
  },
  lsf: {
    instruction: getLLMPrompt({ style: 'detailed', includeExample: true }),
    example: '' // Already included in prompt
  }
};

// Test a single format with given data
async function testFormat(format, data, testName) {
  const prompt = FORMAT_PROMPTS[format];
  
  try {
    console.log(chalk.blue(`\nTesting ${format.toUpperCase()} with: ${testName}`));
    
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-latest',
      max_tokens: 4000,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `${prompt.instruction}

Example ${format.toUpperCase()}:
${prompt.example}

Now generate this data in ${format.toUpperCase()} format:
${JSON.stringify(data, null, 2)}

Important: Return ONLY the ${format.toUpperCase()} data, no explanation or markdown.`
      }]
    });
    
    const generatedContent = message.content[0].text.trim();
    console.log(chalk.gray('Generated content (first 200 chars):'));
    console.log(chalk.gray(generatedContent.substring(0, 200) + '...'));
    
    // Try to parse the generated content
    let parsed;
    let parseError = null;
    
    try {
      switch (format) {
        case 'json':
          parsed = JSON.parse(generatedContent);
          break;
          
        case 'xml':
          parsed = await parseStringPromise(generatedContent);
          // Convert XML structure to match original data structure
          parsed = normalizeXmlData(parsed);
          break;
          
        case 'lsf':
          const lsfJson = parseToJsonString(generatedContent);
          if (!lsfJson) throw new Error('LSF parsing returned null');
          parsed = JSON.parse(lsfJson);
          break;
      }
    } catch (e) {
      parseError = e;
    }
    
    if (parseError) {
      console.log(chalk.red(`✗ Parsing failed: ${parseError.message}`));
      return { success: false, error: parseError.message, format, testName };
    }
    
    // Compare parsed data with original
    const matches = deepCompare(data, parsed);
    
    if (matches.isEqual) {
      console.log(chalk.green('✓ Successfully parsed and data matches!'));
      return { success: true, format, testName };
    } else {
      console.log(chalk.yellow(`⚠ Parsed but data doesn't match:`));
      console.log(chalk.yellow(`  Differences: ${matches.differences.join(', ')}`));
      return { success: false, error: 'Data mismatch', differences: matches.differences, format, testName };
    }
    
  } catch (error) {
    console.log(chalk.red(`✗ API Error: ${error.message}`));
    return { success: false, error: error.message, format, testName };
  }
}

// Normalize XML parsed data to match original structure
function normalizeXmlData(xmlData) {
  // This is a simplified normalizer - in practice would need more sophistication
  
  function normalize(obj) {
    if (Array.isArray(obj)) {
      return obj.length === 1 ? normalize(obj[0]) : obj.map(normalize);
    }
    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === '_' || key === '$') continue; // Skip XML attributes
        result[key] = normalize(value);
      }
      return result;
    }
    // Try to parse numbers and booleans
    if (typeof obj === 'string') {
      if (obj === 'true') return true;
      if (obj === 'false') return false;
      if (obj === 'null') return null;
      const num = Number(obj);
      if (!isNaN(num) && obj.trim() !== '') return num;
    }
    return obj;
  }
  
  // Extract the root element
  const rootKey = Object.keys(xmlData)[0];
  return normalize(xmlData[rootKey]);
}

// Deep comparison of two objects
function deepCompare(obj1, obj2, path = '') {
  const differences = [];
  
  function compare(a, b, currentPath) {
    if (a === b) return true;
    
    if (a === null || b === null) {
      if (a !== b) differences.push(`${currentPath}: ${a} !== ${b}`);
      return false;
    }
    
    if (typeof a !== typeof b) {
      differences.push(`${currentPath}: type mismatch (${typeof a} vs ${typeof b})`);
      return false;
    }
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a).sort();
      const keysB = Object.keys(b).sort();
      
      if (keysA.length !== keysB.length) {
        differences.push(`${currentPath}: different number of keys`);
        return false;
      }
      
      let isEqual = true;
      for (const key of keysA) {
        if (!compare(a[key], b[key], `${currentPath}.${key}`)) {
          isEqual = false;
        }
      }
      return isEqual;
    }
    
    differences.push(`${currentPath}: ${a} !== ${b}`);
    return false;
  }
  
  const isEqual = compare(obj1, obj2, path || 'root');
  return { isEqual, differences };
}

// Main comparison function
async function runComparison() {
  console.log(chalk.bold('\n🔬 LLM Format Generation Comparison\n'));
  console.log(chalk.gray('Testing JSON, XML, and LSF with complex, problematic data...\n'));
  
  const results = {
    json: { success: 0, failed: 0, errors: [] },
    xml: { success: 0, failed: 0, errors: [] },
    lsf: { success: 0, failed: 0, errors: [] }
  };
  
  // Test each case with all formats
  for (const testCase of testCases) {
    console.log(chalk.bold(`\n📝 Test Case: ${testCase.name}`));
    console.log(chalk.gray(`   ${testCase.description}\n`));
    
    for (const format of ['json', 'xml', 'lsf']) {
      const result = await testFormat(format, testCase.data, testCase.name);
      
      if (result.success) {
        results[format].success++;
      } else {
        results[format].failed++;
        results[format].errors.push({
          test: testCase.name,
          error: result.error,
          differences: result.differences
        });
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Print summary
  console.log(chalk.bold('\n📊 Final Results:\n'));
  
  for (const [format, stats] of Object.entries(results)) {
    const total = stats.success + stats.failed;
    const successRate = total > 0 ? ((stats.success / total) * 100).toFixed(1) : 0;
    
    console.log(chalk.bold(`${format.toUpperCase()}:`));
    console.log(`  Success: ${chalk.green(stats.success)}/${total} (${successRate}%)`);
    console.log(`  Failed:  ${chalk.red(stats.failed)}`);
    
    if (stats.errors.length > 0) {
      console.log('  Errors:');
      stats.errors.forEach(err => {
        console.log(`    - ${err.test}: ${err.error}`);
      });
    }
    console.log();
  }
  
  // Determine winner
  const scores = Object.entries(results).map(([format, stats]) => ({
    format,
    score: stats.success
  })).sort((a, b) => b.score - a.score);
  
  console.log(chalk.bold.green(`\n🏆 Winner: ${scores[0].format.toUpperCase()}`));
  
  if (scores[0].format === 'lsf') {
    console.log(chalk.green('\nLSF demonstrates superior reliability for LLM-generated structured data!'));
  }
}

// Run the comparison
if (process.env.ANTHROPIC_API_KEY) {
  runComparison().catch(console.error);
} else {
  console.error(chalk.red('Please set ANTHROPIC_API_KEY environment variable'));
  console.log(chalk.yellow('Create a .env file with: ANTHROPIC_API_KEY=your-key-here'));
}