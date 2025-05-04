# ✴️ LSF: LLM-Safe Format

A structured, flat serialization format designed specifically for maximum reliability when used with Large Language Models (LLMs).

![LSF Version](https://img.shields.io/badge/LSF-v1.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

## 🚀 Quick Start

```bash
# Install Python implementation
pip install lsf-format

# Install JavaScript implementation
npm install lsf-format
```

```python
# Python usage
from lsf import LSFEncoder, LSFDecoder

encoder = LSFEncoder()
lsf_output = (encoder
    .start_object("user")
    .add_field("id", 123)
    .add_field("name", "John")
    .to_string())

decoder = LSFDecoder()
data = decoder.decode(lsf_output)
```

```javascript
// JavaScript usage
import { LSFSimple } from 'lsf-format';

const lsf = new LSFSimple();
const encoded = lsf.encode({ user: { id: 123, name: "John" } });
const decoded = lsf.decode(encoded);
```

## 🎯 Why LSF?

| Problem | JSON | LSF |
|---------|------|-----|
| LLM Parse Errors | 18% fail rate | 3% fail rate |
| Token Efficiency | Baseline | 52% fewer tokens |
| Complex Data Structures | Baseline | 83% fewer tokens |
| Error Recovery | Complete failure | Graceful degradation |
| Nest complexity | Unlimited recursion | Flat only |

## 📚 Documentation

- [Full Specification](./docs/SPECIFICATION.md)
- [Implementation Guide](./docs/IMPLEMENTATION.md)
- [LLM Prompt Templates](./docs/PROMPTS.md)
- [API Reference](./docs/API.md)

## 🔧 Language Implementations

- [Python](./implementations/python/)
- [JavaScript/TypeScript](./implementations/javascript/)
- [C#](./implementations/csharp/) (Coming Soon)
- [Rust](./implementations/rust/) (Coming Soon)

## 🏃‍♂️ Benchmarks

Our [benchmarking tools](./implementations/javascript/benchmarks/) have revealed:

- **Token Efficiency**: LSF uses 52% fewer tokens on average compared to JSON
- **Complex Data**: For deeply nested structures, LSF is up to 83% more token-efficient
- **Performance**: LSF encoding performance improves with data complexity:
  - Small datasets: LSF is slower than JSON
  - Large, complex datasets: LSF encoding can be faster than JSON

View detailed results in the [benchmarks README](./implementations/javascript/benchmarks/README.md).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

Created for reliable structured data generation in LLM-based systems.

## 📞 Contact

- GitHub Issues: [Report bugs or feature requests](https://github.com/LadislavSopko/lsf/issues)
- Discussions: [Join the community](https://github.com/LadislavSopko/lsf/discussions)

---

**⚠️ Note**: LSF is optimized for machine-to-machine communication, not human readability. 