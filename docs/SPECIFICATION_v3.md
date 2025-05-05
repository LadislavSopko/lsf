# ✴️ LSF: LLM-Safe Format Specification v3.0

## Overview

**LSF (LLM-Safe Format)** is a structured, flat serialization format designed specifically for maximum reliability and minimal error when used with large language models (LLMs). Version 3.0 radically simplifies the format to its absolute essence with just three structural tokens.

⚠️ LSF is **not intended to be human-readable**. Its design prioritizes **compactness**, **robustness**, and **LLM interpretability**, not readability.

This format is ideal when asking LLMs to generate structured data reliably across any domain or language.

---

## Key Innovations in v3.0

* 🔥 **Three-Token Design**: Only `$o~`, `$f~`, and `$v~` needed
* 🎯 **Natural Array Handling**: 2+ values = array (semantic rule)
* 🧹 **Zero Ambiguity**: Each token has exactly one purpose
* 🌊 **Flow-Based**: Data flows naturally without delimiters
* 🚀 **Optional Everything**: Objects and object names are optional
* 💡 **Implicit Arrays**: No explicit array tokens needed

---

## Goals

* ✅ **LLM-friendly**: easily remembered and reproduced by LLMs
* ✅ **Forward-linear**: every token uniquely determines what follows
* ✅ **No ambiguous syntax**: no nested brackets, quotes, or indentation
* ✅ **Minimal token errors**: each token can only appear in valid contexts
* ✅ **Fast parsing**: single-pass with simple string operations
* ✅ **Fully deterministic**: all fields are flat, ordered, and explicitly labeled
* ✅ **Cross-language safe**: ASCII-only tokens, safe across all encodings

---

## Format Definition

### 📐 Simple Grammar

```ebnf
lsf_document ::= ($o~object_name? field*)*
field        ::= $f~key element*
element      ::= $v~data ($t~type)?
data         ::= <any character except $o~, $f~, $v~, $t~>*
object_name  ::= <any character except $o~, $f~, $v~>+
key          ::= <any character except $o~, $f~, $v~>+
type         ::= n | f | b | d | s
```

### 🔹 Core Tokens

| Token | Purpose             | Description                                     |
| ----- | ------------------- | ----------------------------------------------- |
| `$o~` | Object start        | Begins an object (name optional)                |
| `$f~` | Field start         | Declares a field key                            |
| `$v~` | Value marker        | Marks a value (single or array element)         |
| `$t~` | Type suffix         | Optional type hint for values                   |

### 🔸 Structure

Each record follows this basic form:

```
$o~<objectName>
$f~<key1>$v~<value1>
$f~<key2>$v~<value2>
...
```

With optional types:

```
$f~<key>$v~<value>$t~n
```

For arrays (multiple values):

```
$f~<key>$v~<value1>$v~<value2>$v~<value3>
```

With typed arrays:

```
$f~<key>$v~<value1>$t~f$v~<value2>$t~f$v~<value3>$t~f
```

Anonymous objects:

```
$o~
$f~<key>$v~<value>
```

### 🚦 Forward-Linear Parsing Rules

1. **Object Declaration**:
   - `$o~` → read until next `$f~` or `$o~` (object name)
   - If no name: empty string, immediately followed by `$f~` or EOF

2. **Field Declaration**:
   - `$f~` → read until next `$v~` or `$o~` or `$f~` (key)
   - No `$v~` after key = undefined/null value

3. **Value Declaration**:
   - `$v~` → read until next token or EOF (data)
   - Multiple `$v~` create an array
   - Data cannot contain any tokens

4. **Type Hints** (optional):
   - `$t~` → read exactly one character for type code
   - Follows immediately after a value

### 🛑 Type System

| Type | Code | Example | When to Use |
|------|------|---------|-------------|
| Integer | `n` | `$v~25$t~n` | Whole numbers |
| Float | `f` | `$v~19.99$t~f` | Decimal numbers |
| Boolean | `b` | `$v~true$t~b` | Boolean values |
| DateTime | `d` | `$v~2025-01-15T10:30:00Z$t~d` | Date/time values |
| String | `s` | `$v~John$t~s` | Explicit string (optional) |
| (String) | (none) | `$v~John` | Default when no type specified |

---

## Examples

### Basic Object
```
$o~user
$f~id$v~123$t~n
$f~name$v~John
$f~active$v~true$t~b
```

### Arrays
```
$o~document
$f~title$v~LSF Spec  
$f~tags$v~llm$v~format$v~parsing
$f~scores$v~98.5$t~f$v~87.3$t~f$v~92.1$t~f
$f~mixed$v~Alice$v~30$t~n$v~true$t~b
```

### Multiple Objects
```
$o~company
$f~id$v~C123
$f~name$v~Acme Corp

$o~employee  
$f~id$v~E456
$f~companyId$v~C123
$f~name$v~Alice
$f~roles$v~manager$v~engineer
```

### Anonymous Objects
```
$o~
$f~status$v~ok
$f~data$v~Result
```

### Empty/Null Values
```
$o~user
$f~id$v~123
$f~middleName       // undefined/null
$f~email$v~        // empty string
$f~phone$v~$t~s    // explicitly typed empty string
```

---

## LLM Prompt Templates

### Production Template
```
You MUST output structured data using LSF v3.0 format.

FORMAT RULES:
- Start objects: $o~name (name optional)
- Declare fields: $f~key
- Add values: $v~value
- Arrays: multiple $v~ for same field
- Types (optional): add $t~type after value

EXAMPLE:
$o~user
$f~id$v~123$t~n
$f~roles$v~admin$v~user
$f~scores$v~98.5$t~f$v~87.3$t~f

NO EXPLANATIONS - OUTPUT ONLY LSF!
```

### Advanced Prompt
```
Transform to LSF v3.0 format:

EXAMPLE 1:
Input: department: Sales, employees: Tom, Sarah, budget: 50000
Output:
$o~department
$f~name$v~Sales
$f~employees$v~Tom$v~Sarah
$f~budget$v~50000$t~n

EXAMPLE 2:
Input: product=Laptop, price=999.99, stock=true
Output:
$o~product
$f~name$v~Laptop
$f~price$v~999.99$t~f
$f~stock$v~true$t~b

RULES:
- Objects: $o~name (optional)
- Fields: $f~key
- Values: $v~value
- Arrays: multiple $v~ values  
- Types: optional, add $t~type after value

Convert: [YOUR INPUT]
```

---

## Pros and Cons

### ✅ Pros

* **Ultra-Simple**: Only 3 structural tokens
* **No Array Complexity**: Natural multiple-value handling
* **Fewer Errors**: Less tokens = less mistakes
* **Fastest Parsing**: Minimal state machine
* **Maximum Flexibility**: Optional everything
* **Perfect for LLMs**: Minimal grammar to learn

### ⚠️ Cons

* ❌ **Not Human-Friendly**: Even more compact than v2.0
* ❌ **No Visual Arrays**: No explicit array markers
* ❌ **Custom Tooling**: Requires LSF v3.0 aware parsers
* ❌ **Data Restrictions**: Cannot contain token strings

---

## Token Efficiency vs. JSON (Hypothesized)

While not rigorously benchmarked with tokenizers yet, LSF is expected to be significantly more token-efficient than JSON for LLM processing, based on the following:

1.  **LSF**: Omits quotes around keys and simple values, commas, and structural characters (`{}[],:`). Uses few, short delimiters (`$o~`, `$f~`, `$v~`, `$t~`).
2.  **JSON (Minified)**: Requires quotes around all keys and string values, plus structural characters and commas.
3.  **JSON (Pretty-Printed)**: Includes all characters from minified JSON plus extensive whitespace (newlines, indentation), which consumes additional tokens.

**Predicted Token Count Ranking (Lowest is best):**

1.  **LSF (Most Efficient)**
2.  **Minified JSON**
3.  **Pretty-Printed JSON (Least Efficient)**

The primary saving in LSF comes from eliminating the ubiquitous quotes and punctuation required by JSON.

---

## Design Philosophy

LSF v3.0 pushes simplicity to the extreme by recognizing that:

1. **Fewer tokens = fewer mistakes** for LLMs to make
2. **Semantic rules** (2+ values = array) are clearer than syntax
3. **Everything optional** maximizes flexibility
4. **Linear parsing** matches LLM text generation
5. **Flat structure** prevents nesting errors

The format achieves the minimum viable syntax for structured data.

---

## Implementation

For implementation details and parsers, refer to:

- Python: [github.com/LadislavSopko/lsf/v3/python](https://github.com/LadislavSopko/lsf/tree/master/implementations/python)
- TypeScript: [github.com/LadislavSopko/lsf/v3/javascript](https://github.com/LadislavSopko/lsf/tree/master/implementations/javascript)

---

## License

LSF (LLM-Safe Format) is an open specification. Use freely with or without attribution.

---

## Authors

Created by developers building agent- and LLM-based systems requiring ultra-reliable structured data output.

<!-- Version 3.0 - Reduced to three core tokens with semantic array handling -->