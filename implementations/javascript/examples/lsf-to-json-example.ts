/**
 * Example demonstrating LSF to JSON conversion in TypeScript
 */

import { LSFEncoder, lsfToJson, lsfToJsonPretty } from '../src';

// Create some LSF data using the encoder
const encoder = new LSFEncoder();
const lsfString = encoder
    .startObject("user")
    .addField("id", 123)
    .addField("name", "John Doe")
    .addList("tags", ["admin", "developer", "tester"])
    .addTypedField("active", true, "bool")
    .addTypedField("salary", 75000.50, "float")
    .addTypedField("manager", null, "null")
    .startObject("company")
    .addField("name", "Acme Corp")
    .addField("industry", "Technology")
    .addTypedField("founded", 1985, "int")
    .toString();

console.log("LSF String (not human readable):");
console.log(lsfString);
console.log("\n" + "-".repeat(50) + "\n");

// Convert to compact JSON
const jsonString = lsfToJson(lsfString);
console.log("Compact JSON:");
console.log(jsonString);
console.log("\n" + "-".repeat(50) + "\n");

// Convert to pretty-printed JSON
const prettyJson = lsfToJsonPretty(lsfString);
console.log("Pretty JSON:");
console.log(prettyJson);
console.log("\n" + "-".repeat(50) + "\n");

// Custom indentation
const customJson = lsfToJson(lsfString, 4);
console.log("Custom Indentation (4 spaces):");
console.log(customJson);
console.log("\n" + "-".repeat(50) + "\n");

// Using a replacer function to filter out sensitive information
const replacer = (key: string, value: any) => {
    // Remove salary information for privacy
    if (key === 'salary') return '(redacted)';
    return value;
};

const filteredJson = lsfToJson(lsfString, 2, replacer);
console.log("With Sensitive Information Filtered:");
console.log(filteredJson); 