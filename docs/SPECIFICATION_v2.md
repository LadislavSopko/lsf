# ✴️ LSF: LLM-Safe Format Specification v2.0

## Overview

**LSF (LLM-Safe Format)** is a structured, flat serialization format designed specifically for maximum reliability and minimal error when used with large language models (LLMs). Version 2.0 introduces forward-only linear parsing to eliminate parsing ambiguity and improve LLM reliability.

⚠️ LSF is **not intended to be human-readable**. Its design prioritizes **compactness**, **robustness**, and **LLM interpretability**, not readability.

This format is ideal when asking LLMs to generate structured data reliably across any domain or language.

---

## Key Improvements in v2.0

* 🚀 **Forward-Only Parsing**: Eliminates `$r~` terminator - each separator implicitly ends the previous field
* 🔄 **Linear State Machine**: Unambiguous parsing with no backtracking needed
* 📋 **Explicit Arrays**: New `$a~` token for clear array declarations
* ⚡ **Simplified Grammar**: Fewer tokens means fewer LLM errors
* 🌐 **UTF-8 Safe**: Uses `~` instead of characters beyond ASCII set

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

### 📐 Record Grammar

```ebnf
lsf_document ::= version? object*
version      ::= "$v~" version_string
object       ::= "$o~" object_name
field        ::= "$f~" key ( single_value | array_value )
single_value ::= "$f~" value [ "$t~" type_code ]
array_value  ::= "$a~" typed_value ( "$l~" typed_value )*
typed_value  ::= value [ "$t~" type_code ]
value        ::= string | string_base64

type_code    ::= "n" | "f" | "b" | "d" | "s"
object_name  ::= string  
key          ::= string
string       ::= <any unicode except "$o~", "$f~", "$a~", "$l~", "$t~", "$v~">
string_base64::= <base64-encoded string for binary data>
version_string::= string
```

### 🔹 Separator Tokens

| Token | Purpose             | Description                                     |
| ----- | ------------------- | ----------------------------------------------- |
| `$o~` | Object start        | Declares the beginning of a named object        |
| `$f~` | Field separator     | Starts a field (key or value depending on context) |
| `$a~` | Array start         | Starts an array value                           |
| `$l~` | List item separator | Separates elements within an array              |
| `$t~` | Type suffix         | Optional type hint for values                   |
| `$v~` | Version marker      | Declares the LSF format version (optional)      |

### 🔸 Structure

Each record follows this basic form:

```
$o~<objectName>
$f~<key1>$f~<value1>
$f~<key2>$f~<value2>
...
```

With optional type hints:

```
$f~<key>$f~<value>$t~n
```

For arrays:

```
$f~<key>$a~<value1>$l~<value2>$l~<value3>
```

With typed arrays:

```
$f~<key>$a~<value1>$t~<type1>$l~<value2>$t~<type2>$l~<value3>$t~<type3>
```

Multiple objects are serialized one after another, each starting with `$o~`.

### 🚦 Forward-Linear Parsing Rules

1. **Version Declaration** (optional):
   - `$v~` → read until next `$o~` (version string)

2. **Object Declaration**:
   - `$o~` → read until next `$f~` or `$o~` (object name)

3. **Field Processing**:
   - `$f~` → read until next `$f~`, `$a~`, or `$o~`
   - If followed by another `$f~`: previous text was a key
   - If followed by `$a~`: previous text was a key, array starts
   - If followed by `$o~`: previous text was a single value

4. **Array Processing**:
   - `$a~` → read until next `$l~`, `$f~`, or `$o~` (first array item)
   - `$l~` → read until next `$l~`, `$f~`, or `$o~` (next array item)

5. **Type Hints** (optional):
   - `$t~` → read exactly one character for type code
   - Follows immediately after a value

### 🛑 Type System

| Type | Code | Example | When to Use |
|------|------|---------|-------------|
| Integer | `n` | `$f~age$f~25$t~n` | Whole numbers |
| Float | `f` | `$f~price$f~19.99$t~f` | Decimal numbers |
| Boolean | `b` | `$f~active$f~true$t~b` | Boolean values |
| DateTime | `d` | `$f~created$f~2025-01-15T10:30:00Z$t~d` | Date/time values |
| String | `s` | `$f~name$f~John$t~s` | Explicit string (optional) |
| (String) | (none) | `$f~name$f~John` | Default when no type specified |

---

## Examples

### Basic Object
```
$o~user
$f~id$f~123$t~n
$f~name$f~John
$f~active$f~true$t~b
```

### Arrays
```
$o~document
$f~title$f~LSF Spec  
$f~tags$a~llm$l~format$l~parsing
$f~scores$a~98.5$t~f$l~87.3$t~f$l~92.1$t~f
$f~mixed$a~Alice$l~30$t~n$l~true$t~b
```

### Multiple Objects
```
$o~company
$f~id$f~C123
$f~name$f~Acme Corp

$o~employee
$f~id$f~E456
$f~companyId$f~C123
$f~name$f~Alice
$f~roles$a~manager$l~engineer
```

---

## LLM Prompt Templates

### Production Template
```
You MUST output structured data using LSF v2.0 format.

FORMAT RULES:
1. Start objects with: $o~name
2. Start fields with: $f~key$f~value
3. Start arrays with: $f~key$a~item1$l~item2
4. Add types after values: $f~key$f~value$t~type
   
TYPES: n=integer, f=float, b=boolean, d=date, s=string

EXAMPLE:
$o~user
$f~id$f~123$t~n
$f~roles$a~admin$l~user
$f~scores$a~98.5$t~f$l~87.3$t~f

NO EXPLANATIONS - OUTPUT ONLY LSF!
```

### Advanced Prompt
```
Transform to LSF v2.0 format:

EXAMPLE 1:
Input: department: Sales, employees: Tom, Sarah, budget: 50000
Output:
$o~department
$f~name$f~Sales
$f~employees$a~Tom$l~Sarah
$f~budget$f~50000$t~n

EXAMPLE 2:
Input: product=Laptop, price=999.99, stock=true
Output:
$o~product
$f~name$f~Laptop
$f~price$f~999.99$t~f
$f~stock$f~true$t~b

RULES:
- Objects: $o~<name>
- Fields: $f~<key>$f~<value>
- Arrays: $f~<key>$a~<item>$l~<item>  
- Types: optional, add $t~<type> after value

Convert: [YOUR INPUT]
```

---

## Pros and Cons

### ✅ Pros

* **Impossible to Misparse**: Forward-only parsing eliminates structural ambiguity
* **Fewer LLM Errors**: Simple token rules prevent common mistakes like double `$f~`
* **Faster Parsing**: Single-pass parsing with linear state machine
* **Explicit Arrays**: No confusion between single values and lists
* **Flat Structure**: No nesting complexity, perfect for relationship IDs
* **Robust with Any LLM**: Works well even with smaller models

### ⚠️ Cons

* ❌ **Not Human-Friendly**: Even less readable than JSON
* ❌ **No Nesting**: Must use IDs for relationships 
* ❌ **Custom Tooling**: Need parsers aware of v2.0 rules
* ❌ **Learning Curve**: LLMs must learn token sequence rules
* ❌ **Verbose Numbers**: Typed numeric arrays require more tokens

---

## Design Philosophy

LSF v2.0 pushes for maximum simplicity by recognizing that:

1. **ID-Based Relationships** are more reliable than nesting for LLMs
2. **Application-Level Trees** can be built from flat structures
3. **Token Reduction** means fewer places for LLMs to make errors
4. **Forward Parsing** matches how LLMs generate text (left-to-right)

The format excels at data transfer reliability, letting applications handle complex logic.

---

## Implementation

For implementation details and parsers, refer to:

- Python: [github.com/LadislavSopko/lsf/v2/python](https://github.com/LadislavSopko/lsf/tree/master/implementations/python)
- TypeScript: [github.com/LadislavSopko/lsf/v2/javascript](https://github.com/LadislavSopko/lsf/tree/master/implementations/javascript)

---

## License

LSF (LLM-Safe Format) is an open specification. Use freely with or without attribution.

---

## Authors

Created by developers building agent- and LLM-based systems requiring ultra-reliable structured data output.

<!-- Version 2.0 - Introduced forward-only parsing, explicit arrays, and eliminated record terminators -->