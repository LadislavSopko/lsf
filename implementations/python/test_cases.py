"""Test cases for LLM integration testing."""

test_cases = [
    {
        "name": "Simple User Profile",
        "description": "Basic test to ensure the system works",
        "data": {
            "username": "alice_doe",
            "email": "alice@example.com",
            "age": 28,
            "active": True
        }
    },
    {
        "name": "Quotes and Escaping Hell",
        "description": "Multiple quote types and escape sequences that often break JSON generation",
        "data": {
            "title": 'He said "Hello" and she replied \'Hi there!\'',
            "description": 'This has "quotes", \'apostrophes\', and even `backticks`. Also backslashes: C:\\Users\\Test',
            "code": 'console.log("Hello \\"World\\"");',
            "regex": '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            "mixed": '"It\'s a `complex` world," he said, adding: "especially with \\n newlines!"'
        }
    },
    {
        "name": "Multi-line Nightmare",
        "description": "Content with newlines, tabs, and various formatting",
        "data": {
            "poem": "Roses are red\nViolets are blue\nStructured data\nIs hard for LLMs too",
            "code_snippet": "function hello() {\n\tconsole.log('Hello');\n\treturn \"World\";\n}",
            "address": "123 Main St.\nApt. 4B\nNew York, NY 10001\nUSA",
            "notes": "Important:\n- Remember to escape\n- Don't forget quotes\n- Handle \ttabs properly\n- Deal with trailing whitespace   ",
            "markdown": "# Title\n\nThis is **bold** and _italic_.\n\n```json\n{\"test\": true}\n```"
        }
    },
    {
        "name": "Unicode and Emoji Chaos",
        "description": "International characters and emojis that can break encoding",
        "data": {
            "greeting": "Hello 世界 🌍",
            "name": "José María García-Pérez",
            "bio": "Software engineer 👨‍💻 from España 🇪🇸. Love coding 💻 & coffee ☕!",
            "special_chars": "α β γ δ ε • ™ © ® ¿ ¡ § ¶",
            "rtl_text": "مرحبا بالعالم",
            "emoji_overload": "🎉🎊🎈🎆🎇🧨✨🎃🎄🎋🎍🎑🎁🎀🎗️",
            "zalgo": "T̸h̴i̸s̶ ̷i̵s̷ ̶Z̶a̸l̴g̷o̶ ̴t̸e̷x̴t̶"
        }
    },
    {
        "name": "Format-Breaking Strings",
        "description": "Text that tries to break JSON/XML syntax",
        "data": {
            "json_breaker": '"}], "injected": true, "original": [{"value": "',
            "xml_breaker": '</field><injected>true</injected><field>',
            "sql_like": "'; DROP TABLE users; --",
            "html_content": '<script>alert("XSS")</script><img src=x onerror="alert(1)">',
            "json_in_string": '{"message": "This is just text, not parsed JSON"}'
        }
    },
    {
        "name": "Edge Cases and Limits",
        "description": "Boundary conditions and special values",
        "data": {
            "empty_string": "",
            "just_spaces": "   ",
            "null_value": None,
            "zero": 0,
            "negative": -42,
            "float": 3.14159265359,
            "scientific": 6.022e23,
            "boolean_true": True,
            "boolean_false": False,
            "very_long_string": "Lorem ipsum dolor sit amet, " * 100,
            "infinity_str": "Infinity",
            "neg_infinity_str": "-Infinity",
            "not_a_number_str": "NaN"
        }
    },
    {
        "name": "Real-world Blog Post",
        "description": "Realistic content combining multiple challenges",
        "data": {
            "title": "Why \"Clean Code\" Isn't Always Clean",
            "author": "Sarah O'Connor",
            "date": "2024-03-15T10:30:00Z",
            "content": """I've been thinking about Robert C. Martin's "Clean Code" lately.

The irony? Sometimes "clean" code isn't actually clean. Here's why:

1. Over-abstraction: When you create 15 classes for what could be a simple function
2. Naming obsession: 'calculateUserAccountBalanceAfterTransactionWithTaxConsideration()' 
3. The "Uncle Bob said..." syndrome

Consider this "clean" example:
```java
public class UserAccountTransactionProcessor {
    private final TaxCalculator taxCalculator;
    private final TransactionValidator validator;
    // ... 50 more lines
}
```

Versus the "dirty" version:
```python
def process_transaction(user, amount):
    tax = amount * 0.1
    return user.balance - (amount + tax)
```

Which is really cleaner? 🤔

Remember: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." - Antoine de Saint-Exupéry""",
            "tags": ["programming", "clean code", "opinion", "best practices"],
            "views": 1523,
            "likes": 89,
            "comments": 23,
            "controversial": True
        }
    }
]