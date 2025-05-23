const Anthropic = require('@anthropic-ai/sdk');
const { parseToJsonString } = require('lsf-format');
const chalk = require('chalk');
const { testCases } = require('./test-cases.js');
const dotenv = require('dotenv');

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const format = process.argv[2] || 'lsf';
const testCaseIndex = parseInt(process.argv[3]) || 0;

async function testSingleFormat() {
  const testCase = testCases[testCaseIndex];
  if (!testCase) {
    console.error(chalk.red(`Test case ${testCaseIndex} not found`));
    process.exit(1);
  }

  console.log(chalk.bold(`\nTesting ${format.toUpperCase()} format`));
  console.log(chalk.blue(`Test case: ${testCase.name}`));
  console.log(chalk.gray(testCase.description));
  console.log('\nInput data:');
  console.log(JSON.stringify(testCase.data, null, 2));

  const prompts = {
    json: "Generate the following data as valid JSON. Ensure all strings are properly escaped.",
    xml: "Generate the following data as valid XML with proper escaping.",
    lsf: `Generate the following data in LSF (LLM-Safe Format) following these EXACT rules:

LSF uses only 4 tokens:
- $o~ starts an object (optionally followed by object name)
- $f~ starts a field name
- $v~ starts a field value
- $t~ marks a type hint (single character after value)

Type codes (use AFTER $v~value):
- n = integer (whole numbers like 123)
- f = float (decimal numbers like 3.14)
- b = boolean (true/false)
- d = datetime (ISO format)
- s = string (optional, default if no type given)
- z = null

CRITICAL RULES:
1. NEVER use quotes, brackets, commas, or colons
2. Write values directly after $v~ with NO escaping
3. For arrays: repeat $v~ multiple times for same field
4. For null/undefined: use $f~fieldname with no $v~ OR use $v~null$t~z
5. Newlines, quotes, special chars in strings: write them as-is
6. Every value can have optional type hint: $v~value$t~X

Example:
$o~person
$f~name$v~John Doe
$f~age$v~30$t~n
$f~active$v~true$t~b
$f~bio$v~Lives in "NYC"
Loves coding!`
  };

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-latest',
      max_tokens: 4000,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `${prompts[format]}

Data to convert:
${JSON.stringify(testCase.data, null, 2)}

Return ONLY the ${format.toUpperCase()} data, no explanations.`
      }]
    });

    const generated = message.content[0].text.trim();
    console.log(chalk.green('\n✓ Generated output:'));
    console.log(generated);

    // Try to parse
    console.log(chalk.blue('\n🔍 Attempting to parse...'));
    
    try {
      let parsed;
      if (format === 'json') {
        parsed = JSON.parse(generated);
      } else if (format === 'lsf') {
        const jsonStr = parseToJsonString(generated);
        if (!jsonStr) throw new Error('LSF parsing returned null');
        parsed = JSON.parse(jsonStr);
      }
      
      console.log(chalk.green('✓ Successfully parsed!'));
      console.log('\nParsed result:');
      console.log(JSON.stringify(parsed, null, 2));
      
    } catch (e) {
      console.log(chalk.red(`✗ Parsing failed: ${e.message}`));
      
      // For LSF, show more debugging info
      if (format === 'lsf') {
        console.log(chalk.yellow('\nDebug info:'));
        console.log('Generated LSF tokens:', generated.match(/\$[ovft]~/g));
      }
    }

  } catch (error) {
    console.error(chalk.red(`API Error: ${error.message}`));
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(chalk.red('Please set ANTHROPIC_API_KEY environment variable'));
  process.exit(1);
}

testSingleFormat().catch(console.error);