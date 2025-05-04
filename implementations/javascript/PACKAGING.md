# TypeScript/JavaScript LSF Package

This document provides instructions for building and publishing the LSF TypeScript implementation.

## Building the Package

To build the package:

```bash
# Install dependencies (if you haven't already)
npm install

# Build the TypeScript package
npm run build
```

This creates the `dist` directory with compiled JavaScript files and TypeScript declaration files.

## Verifying the Build

You can verify that the build works correctly by running the verification script:

```bash
node verify-build.js
```

This script imports the library from the `dist` directory and demonstrates the key functionality.

## Running Tests

The package includes a comprehensive test suite using Vitest:

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (automatically re-runs on file changes)
npm run test:watch
```

## Preparing for NPM Publication

Before publishing to NPM, make sure to:

1. Update the version number in `package.json` if needed
2. Ensure all tests pass
3. Build the package fresh with `npm run build`
4. Check that the files to be included are correct in `package.json` (currently includes `dist`, `README.md`, and `LICENSE`)

## Publishing to NPM

To publish the package to NPM:

```bash
# Login to NPM (if not already logged in)
npm login

# Publish the package
npm publish
```

### Creating a Tagged Release

For version releases, it's recommended to create a tagged release:

```bash
# Create a git tag
git tag v1.2.0

# Push the tag
git push origin v1.2.0

# Publish to NPM with a tag
npm publish --tag latest
```

## Development Installation

During development, you can link this package locally for testing with other projects:

```bash
# In this package directory, create a global link
npm link

# In another project directory, link to this package
npm link lsf-format
```

This creates a symbolic link to the package, allowing you to test changes without publishing.

## Package Structure

The built package has the following structure:

- `dist/index.js` - Main entry point
- `dist/index.d.ts` - TypeScript declarations
- `dist/*.js` - Compiled JavaScript modules
- `dist/*.d.ts` - TypeScript declarations for each module

## Publishing Checklist

- [ ] Update version in package.json
- [ ] Run tests to ensure they pass
- [ ] Build the package
- [ ] Verify the build with the verification script
- [ ] Check the package.json files array for completeness
- [ ] Publish to NPM
- [ ] Create a git tag for the release
- [ ] Update documentation if needed 