# LSF LLM Prompts

This file contains the official prompts for instructing LLMs to generate LSF format. All language implementations should use these exact prompts to ensure consistency.

## Minimal Prompt (Default)

```
Output in LSF format:
$o~=object, $f~=field, $v~=value, $t~=type(n=int,f=float,b=bool,d=date,z=null)
NO quotes/brackets. Arrays: repeat $v~. Continuous line.
Example: $o~$f~name$v~John$f~age$v~30$t~n$f~tags$v~a$v~b
```

## Minimal Prompt (Without Example)

```
Output in LSF format:
$o~=object, $f~=field, $v~=value, $t~=type(n=int,f=float,b=bool,d=date,z=null)
NO quotes/brackets. Arrays: repeat $v~. Continuous line.
```

## Detailed Prompt

```
Generate output in LSF (LLM-Safe Format):

TOKENS:
- $o~ = start object
- $f~ = field name follows
- $v~ = value follows  
- $t~ = type hint follows (single character)

TYPES:
- n = integer (e.g., 42)
- f = float (e.g., 3.14)
- b = boolean (true/false)
- d = datetime (ISO format)
- s = string (optional, default)
- z = null

RULES:
1. NO quotes, brackets, or commas anywhere
2. NO newlines between tokens (continuous stream)
3. Arrays: repeat $v~ for same field
4. Multi-line strings: write actual newlines, not \n
5. Write all special characters as-is
6. NO escaping - write everything literally

EXAMPLE:
$o~$f~name$v~John Doe$f~age$v~30$t~n$f~active$v~true$t~b$f~tags$v~admin$v~user
```

## Detailed Prompt (Without Example)

```
Generate output in LSF (LLM-Safe Format):

TOKENS:
- $o~ = start object
- $f~ = field name follows
- $v~ = value follows  
- $t~ = type hint follows (single character)

TYPES:
- n = integer (e.g., 42)
- f = float (e.g., 3.14)
- b = boolean (true/false)
- d = datetime (ISO format)
- s = string (optional, default)
- z = null

RULES:
1. NO quotes, brackets, or commas anywhere
2. NO newlines between tokens (continuous stream)
3. Arrays: repeat $v~ for same field
4. Multi-line strings: write actual newlines, not \n
5. Write all special characters as-is
6. NO escaping - write everything literally
```

## Implementation Notes

All implementations should provide a function/method with this signature:

- **TypeScript**: `getLLMPrompt(options?: { includeExample?: boolean; style?: 'minimal' | 'detailed' }): string`
- **C#**: `GetLLMPrompt(bool includeExample = true, string style = "minimal"): string`
- **Python**: `get_llm_prompt(include_example: bool = True, style: str = "minimal") -> str`

The function should return the exact prompts from this file based on the parameters.