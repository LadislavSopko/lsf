# LSF Python Implementation

Python implementation of the LLM-Safe Format (LSF) - a minimal serialization format designed for reliable structured data generation by Large Language Models.

## Installation

```bash
pip install lsf-format  # Coming soon to PyPI
```

For development:
```bash
pip install -e ".[dev]"
```

## Usage

```python
from lsf import parse_to_json, encode_to_string

# Parse LSF to JSON
lsf_data = "$o~user$f~name$v~Alice$f~age$v~30$t~n"
json_str = parse_to_json(lsf_data)
print(json_str)  # {"name": "Alice", "age": 30}

# Encode Python dict to LSF
data = {"name": "Bob", "active": True}
lsf_str = encode_to_string(data)
print(lsf_str)  # $o~$f~name$v~Bob$f~active$v~true$t~b
```

## Development

Run tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=lsf
```

Format code:
```bash
black lsf tests
```

Type checking:
```bash
mypy lsf
```

## License

MIT