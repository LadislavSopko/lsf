# ✴️ LSF: LLM-Safe Format

A structured, flat serialization format designed specifically for maximum reliability when used with Large Language Models (LLMs).

![LSF Version](https://img.shields.io/badge/LSF-v3.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

## 🚀 Quick Start

```bash
# Install JavaScript/TypeScript implementation
npm install lsf-parser

# C# Package (Example - Replace when published)
dotnet add package Zerox.LSF
```

```javascript
// JavaScript/TypeScript Usage (Example - Verify Package API)
import { LSFParser } from 'lsf-parser';

const lsfInput = '$o~user$f~id$v~123$t~n$f~name$v~Alice';
const jsonData = LSFParser.parseToJsonString(lsfInput);
console.log(jsonData);

const dataToEncode = { id: 456, name: 'Bob', active: true };
const lsfString = LSFParser.encodeToString(dataToEncode, 'user');
console.log(lsfString);
```

```csharp
// C# Usage
using Zerox.LSF;
using System.Collections.Generic;

// Parsing
string lsfInput = "$o~user$f~id$v~123$t~n$f~name$v~Alice";
string? jsonOutput = LSFParser.ParseToJsonString(lsfInput);
Console.WriteLine(jsonOutput);

// Encoding
var dataToEncode = new Dictionary<string, object?>
{
    { "id", 456 }, { "name", "Bob" }, { "active", true }
};
string lsfString = LSFParser.EncodeToString(dataToEncode, "user");
Console.WriteLine(lsfString);
```

## 🎯 Why LSF?

LSF v3.0 prioritizes extreme simplicity and a flat structure to minimize LLM errors and maximize token efficiency for common structured data patterns.

## 📚 Documentation

- [Full Specification v3.0](./docs/SPECIFICATION_v3.md)
- [Implementation Guide](./docs/IMPLEMENTATION.md)
- [LLM Prompt Templates](./docs/PROMPTS.md)
- [API Reference](./docs/API.md)

## 🔧 Language Implementations

- **JavaScript/TypeScript**: [Complete](./implementations/javascript/)
- **C#**: [Complete](./implementations/csharp/)
- **Python**: [Planned (v3.0)](./ver2-parser-python-pllan.md) (*Note: Existing code in `./implementations/python/` may be outdated/for v1.x*)
- **Rust**: [Coming Soon](./implementations/rust/)

## 🏃‍♂️ Benchmarks

Benchmarks comparing LSF v3.0 parsing performance against standard JSON libraries are available for:

- [JavaScript/TypeScript Benchmarks](./implementations/javascript/benchmarks/)
- [C# Benchmarks](./implementations/csharp/Zerox.LSF/Zerox.LSF.Benchmarks/)

Key findings generally show LSF parsing directly to a DOM is significantly faster than JSON parsing, though memory allocation patterns may differ. Refer to the specific benchmark results for details.

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