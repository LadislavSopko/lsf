# LSF for Python

A Python implementation of the LSF (LLM-Safe Format) specification.

## Installation

```bash
pip install lsf-format
```

## Usage

### Basic Usage

```python
from lsf import LSFEncoder, LSFDecoder

# Encoding data to LSF
encoder = LSFEncoder()
lsf_string = (encoder
    .start_object("user")
    .add_field("id", 123)
    .add_field("name", "John Doe")
    .add_list("tags", ["admin", "user"])
    .add_typed_field("verified", True, "bool")
    .to_string())

# Decoding LSF to Python objects
decoder = LSFDecoder()
data = decoder.decode(lsf_string)
# Returns: {'user': {'id': '123', 'name': 'John Doe', 'tags': ['admin', 'user'], 'verified': True}}
```

### Simple Conversion API

For convenience, you can also use the simple conversion functions:

```python
from lsf import to_lsf, from_lsf

# Convert Python dictionary to LSF
data = {
    "product": {
        "id": 456,
        "name": "Laptop",
        "price": 999.99,
        "in_stock": True,
        "tags": ["electronics", "computers"]
    }
}
lsf_string = to_lsf(data)

# Convert LSF string back to Python dictionary
parsed_data = from_lsf(lsf_string)
```

## Advanced Features

### Type Hints

LSF supports explicit type hints for values:

```python
encoder = LSFEncoder()
lsf_string = (encoder
    .start_object("data")
    .add_typed_field("count", 42, "int")
    .add_typed_field("price", 19.99, "float")
    .add_typed_field("active", True, "bool")
    .add_typed_field("metadata", None, "null")
    .to_string())
```

### Binary Data

Binary data is automatically base64 encoded:

```python
import os
binary_data = os.urandom(16)  # Some binary data

encoder = LSFEncoder()
lsf_string = (encoder
    .start_object("file")
    .add_typed_field("content", binary_data, "bin")
    .to_string())
```

### Transactions

Group multiple objects in a transaction:

```python
encoder = LSFEncoder()
lsf_string = (encoder
    .start_object("user")
    .add_field("id", 123)
    .start_object("profile")
    .add_field("name", "John")
    .end_transaction()
    .to_string())
```

## Development

```bash
# Clone the repository
git clone https://github.com/LadislavSopko/lsf.git
cd lsf/implementations/python

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest
```

## License

MIT License - see [LICENSE](../../LICENSE) file for details. 