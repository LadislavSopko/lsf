# ✴️ LSF: LLM-Safe Format Specification v1.3

## Overview

**LSF (LLM-Safe Format)** is a structured, flat serialization format designed specifically for maximum reliability and minimal error when used with large language models (LLMs). It avoids pitfalls common in formats like JSON or XML (such as mismatched brackets, quotes, or indentation) and uses fixed-length, extremely rare separators to maintain structure and parseability.

⚠️ LSF is **not intended to be human-readable**. Its design prioritizes **compactness**, **robustness**, and **LLM interpretability**, not readability.

This format is ideal when asking LLMs to generate structured data reliably across any domain or language.

---

## Goals

* ✅ **LLM-friendly**: easily remembered and reproduced by LLMs
* ✅ **Low collision risk**: avoids characters common in code/text
* ✅ **No ambiguous syntax**: no nested brackets, quotes, or indentation
* ✅ **Fast parsing**: simple string operations
* ✅ **Fully deterministic**: all fields are flat, ordered, and explicitly labeled
* ✅ **Cross-language safe**: characters chosen are not valid identifiers or symbols in most programming languages
* ✅ **Token efficient**: minimal overhead for structure markers

---

## Format Definition

### 📐 Record Grammar

```ebnf
lsf_document ::= version? object*
version      ::= "$v~" version_string "$r~"
object       ::= "$o~" object_name "$r~" ( field )*
field        ::= key "$f~" value [ "$t~" type_code ] "$r~" | key "$f~" list_value "$r~"
list_value   ::= value ( "$l~" value )*
value        ::= string | string_base64

type_code    ::= "n" | "f" | "b" | "d" | "s"
object_name  ::= string
key          ::= string
string       ::= <any unicode except "$o~", "$f~", "$r~", "$l~", "$t~", "$v~">
string_base64::= <base64-encoded string for binary data>
version_string::= string
```

### 🔹 Separator Tokens

| Token | Purpose             | Description                                     |
| ----- | ------------------- | ----------------------------------------------- |
| `$o~` | Object start        | Declares the beginning of a named object        |
| `$f~` | Field separator     | Separates key from value within an object       |
| `$r~` | Record terminator   | Marks the end of a logical field or object line |
| `$l~` | List item separator | Separates elements within a collection or array |
| `$t~` | Type suffix         | Optional type hint for values                   |
| `$v~` | Version marker      | Declares the LSF format version (optional)      |

### 🔸 Structure

Each record follows this basic form:

```
$o~<objectName>$r~
<key1>$f~<value1>$r~
<key2>$f~<value2>$r~
...
```

With optional type hints:

```
<key>$f~<value>$t~n$r~
```

For lists or collections:

```
<key>$f~<value1>$l~<value2>$l~<value3>$r~
```

Multiple objects are serialized one after another, each starting with `$o~`.

### 🚦 Rules and Constraints

1. **Token Invariance**: Tokens `$o~`, `$f~`, `$r~`, `$l~`, `$t~`, `$v~` MUST be exactly 3 characters
2. **Token Isolation**: No token may appear within string data except in binary data (encoded as base64)
3. **Object Scope**: All fields belong to the most recently declared object
4. **Type Specificity**: Type hints are optional; default to string
5. **List Semantics**: Empty lists are valid: `tags$f~$r~`
6. **Whitespace**: Ignored between tokens, preserved within strings
7. **Binary Data**: Must be base64 encoded to prevent separator collision
8. **Multiline Text**: Treated as regular strings; no special handling required
9. **Missing Fields**: Fields not present in LSF are interpreted as null/undefined when parsed

### 🛑 Type System

| Type | Code | Example | When to Use |
|------|------|---------|-------------|
| Integer | `n` | `age$f~25$t~n$r~` | Whole numbers |
| Float | `f` | `price$f~19.99$t~f$r~` | Decimal numbers |
| Boolean | `b` | `active$f~true$t~b$r~` | Boolean values |
| DateTime | `d` | `created$f~2025-01-15T10:30:00Z$t~d$r~` | Date/time values |
| String | `s` | `name$f~John$t~s$r~` | Explicit string (optional) |
| (String) | (none) | `name$f~John$r~` | Default when no type specified |

**Binary Data Handling**: Binary data should be represented as base64-encoded strings. No special type code is required, but the value must be properly encoded to prevent token collisions.

---

## LLM Prompt Templates

### Production Template
```
You MUST output structured data using LSF v1.3 format.

FORMAT RULES:
1. Use EXACTLY these tokens:
   - Objects: $o~name$r~
   - Fields: key$f~value$r~
   - Lists: key$f~item1$l~item2$l~item3$r~
   - Types: key$f~value$t~type$r~
   
2. TYPES: n(int), f(float), b(bool), d(date), s(string)
   Default type is string (no type marker needed)

3. Structure:
$o~objectName$r~
key1$f~value1$r~
key2$f~value2$r~

Example response:
$o~user$r~
id$f~123$t~n$r~
name$f~John$r~
tags$f~admin$l~user$r~
active$f~true$t~b$r~

IMPORTANT: Output ONLY LSF format. No explanations.
```

### Advanced Prompt with Few-Shot Learning
```
Transform data to LSF v1.3 format following these examples:

EXAMPLE 1:
Input: name: Alice, age: 30, hobbies: reading, gaming
Output:
$o~person$r~
name$f~Alice$r~
age$f~30$t~n$r~
hobbies$f~reading$l~gaming$r~

EXAMPLE 2:
Input: product: laptop, price: 999.99, in_stock: true
Output:
$o~product$r~
name$f~laptop$r~
price$f~999.99$t~f$r~
in_stock$f~true$t~b$r~

RULES:
1. Objects: $o~<name>$r~
2. Fields: <key>$f~<value>$r~
3. Lists: Use $l~ to separate items
4. Types: <key>$f~<value>$t~<type>$r~
   - n = integer
   - f = float
   - b = boolean
   - d = date
   - Default = string (no type needed)

Your turn:
Input: [USER INPUT]
Output:
```

### Quality Control Template
```
Generate LSF v1.3 output with built-in validation:

QUALITY CHECKS:
1. Every object starts with $o~
2. Every field uses key$f~value$r~ format
3. Every line ends with $r~
4. Lists use $l~ separator
5. Type codes are after values: value$t~type$r~

SELF-VALIDATION:
After generating LSF, verify:
- Token count is minimal
- No JSON/XML artifacts
- All values properly separated

Generate LSF for: <task>

IMPORTANT: When unsure, use standard string format.
```

---

## Pros and Cons of LSF

### ✅ Pros

* **Error-Tolerant Output**: Unlike JSON, LSF has no nested structures, so small hallucinations or typos don't break the whole parse.
* **Simple Parser Logic**: Easy to split and reconstruct without full schema validation.
* **Reliable with Any Model**: Especially useful for smaller or open-source LLMs with limited JSON adherence.
* **Token Efficient**: Optimized format with reduced token overhead.
* **Optimization Options**: Multiple parsing strategies available for different performance needs.
* **One-pass JSON conversion**: You can safely convert LSF to valid JSON without needing to validate or reparse.

### ⚠️ Cons

* ❌ **Not Human-Friendly**: Debugging raw LSF is awkward compared to readable JSON.
* ❌ **Tooling Ecosystem**: Most libraries and APIs expect JSON/XML — using LSF requires custom parsing.
* ❌ **No Schema Enforcement**: Unlike JSON Schema or OpenAI function calling, LSF doesn't have built-in validation.
* ❌ **Requires Prompt Rigor**: The model must be consistently prompted to use LSF format — LLMs don't know it by default.
* ❌ **Unknown Model Exposure**: It's unlikely the format existed in training data; models must learn it via examples.

---

## Implementation

For implementation details and conversion utilities, refer to the official language libraries:

- Python: https://github.com/LadislavSopko/lsf/tree/master/implementations/python
- TypeScript: https://github.com/LadislavSopko/lsf/tree/master/implementations/javascript

The implementations include comprehensive test suites, benchmarking tools, and optimized parsers.

---

## License

LSF (LLM-Safe Format) is an open specification. You may implement and use it freely in any context, with or without attribution.

---

## Authors

This specification was defined by developers building agent- and LLM-based systems who required a fault-tolerant, lightweight structured format.

<!-- Version 1.3 - Updated with simplified format, optimized type system, and reduced token overhead --> 