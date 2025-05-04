# Contributing to LSF

We love your input! We want to make contributing to LSF as easy and transparent as possible.

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code follows the existing style.
6. Issue that pull request!

## Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable.
2. Update the docs with any new features or changes.
3. The PR will be merged once you have the sign-off of at least one maintainer.

## Any contributions you make will be under the MIT Software License

When you submit code changes, your submissions are understood to be under the same [MIT License](./LICENSE) that covers the project.

## Report bugs using GitHub's [issues](https://github.com/LadislavSopko/lsf/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/LadislavSopko/lsf/issues/new).

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## Development Setup

### Python Implementation
```bash
cd implementations/python
python -m venv venv
source venv/bin/activate
pip install -e ".[dev]"
pytest
```

### JavaScript Implementation
```bash
cd implementations/javascript
npm install
npm test
```

### C# Implementation
```bash
cd implementations/csharp
dotnet restore
dotnet test
```

## Coding Style

- **Python**: Follow PEP 8, use Black for formatting
- **JavaScript**: Follow Airbnb style guide, use Prettier
- **C#**: Follow Microsoft conventions

## Testing

All implementations must have:
- Unit tests for basic functionality
- Integration tests for full encode/decode cycle
- Performance benchmarks
- LLM compatibility tests (when possible)

## Documentation

- Keep README.md updated
- Add docstrings/JSDoc to all public functions
- Update CHANGELOG.md for significant changes
- Add examples for new features

## Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create PR to `main` branch
4. After merge, create a GitHub release
5. CI will automatically publish to package managers

## Community

- Be respectful and inclusive
- Help newcomers feel welcome
- Share knowledge and learn from others

Thank you for contributing to LSF! 🚀 