# LSF (LLM-Safe Format) v3.0 - C# Implementation

This directory contains the C# implementation of the LSF v3.0 specification.

LSF is a structured, flat serialization format designed specifically for maximum reliability and minimal error when used with large language models (LLMs).

For the full specification, see [LSF Specification v3.0](../../docs/SPECIFICATION_v3.md).

## Features

*   Parses LSF v3.0 format from strings or `ReadOnlyMemory<byte>`.
*   Provides access to the parsed data via:
    *   A structured Document Object Model (DOM) using `LSFNode`.
    *   Direct conversion to a JSON string.
*   Encodes C# `Dictionary<string, object?>` objects into LSF strings or byte arrays.
*   High performance, benchmarked against standard JSON libraries.
*   Targets .NET Standard 2.0 for broad compatibility.

## Installation

```bash
# Replace with actual package name when published
dotnet add package Zerox.LSF 
```

## Usage

The primary entry point is the static `Zerox.LSF.LSFParser` class.

### Parsing LSF

**1. Parsing to DOM:**

```csharp
using System;
using Zerox.LSF;

string lsfInput = "$o~user$f~id$v~123$t~n$f~name$v~Alice$f~roles$v~admin$v~editor";

// Parse from string
ParseResult result = LSFParser.ParseToDom(lsfInput);

if (result.Success && result.Nodes != null)
{
    Console.WriteLine($"Parsed {result.Nodes.Count} nodes successfully.");
    
    // Navigate the DOM (Example - requires DOMNavigator)
    var navigator = new DOMNavigator(lsfInputBytes, result.Nodes);
    foreach(int rootIndex in navigator.GetRootIndices())
    {
        Console.WriteLine($"Root Node ({rootIndex}): {navigator.GetNodeDataAsString(rootIndex)}");
        // Further navigation...
    }
}
else
{
    Console.WriteLine($"Parsing failed: {result.ErrorMessage}");
}

// Or parse from ReadOnlyMemory<byte>
// ReadOnlyMemory<byte> lsfInputBytes = ...;
// ParseResult resultBytes = LSFParser.ParseToDom(lsfInputBytes);
```

**2. Parsing Directly to JSON String:**

```csharp
using System;
using Zerox.LSF;

string lsfInput = "$o~user$f~id$v~123$t~n$f~name$v~Alice$f~roles$v~admin$v~editor";

string? jsonOutput = LSFParser.ParseToJsonString(lsfInput);

if (jsonOutput != null)
{
    Console.WriteLine("Generated JSON:");
    Console.WriteLine(jsonOutput);
    // Output:
    // {"id":123,"name":"Alice","roles":["admin","editor"]}
}
else
{
    Console.WriteLine("Parsing to JSON failed.");
}
```

### Encoding to LSF

```csharp
using System;
using System.Collections.Generic;
using Zerox.LSF;

var dataToEncode = new Dictionary<string, object?>
{
    { "product", "Laptop" },
    { "price", 1299.99 },
    { "features", new List<object?> { "16GB RAM", "512GB SSD", null, true } },
    { "available", true }
};

// Encode to string
string lsfString = LSFEncoder.EncodeToString(dataToEncode, "item"); // Optional object name "item"
Console.WriteLine("LSF String:");
Console.WriteLine(lsfString);
// Output: $o~item$f~product$v~Laptop$f~price$v~1299.99$t~n$f~features$v~16GB RAM$v~512GB SSD$v~$t~z$v~true$t~b$f~available$v~true$t~b

// Encode to byte array
byte[] lsfBytes = LSFEncoder.EncodeToArray(dataToEncode, "item");
Console.WriteLine($"\nLSF Bytes Length: {lsfBytes.Length}");
```

## Development

- Solution file: `Zerox.LSF.sln`
- Library project: `Zerox.LSF/Zerox.LSF.csproj` (.NET Standard 2.0)
- Test project: `Zerox.LSF.Tests/Zerox.LSF.Tests.csproj` (.NET 9.0, xUnit)
- Benchmark project: `Zerox.LSF.Benchmarks/Zerox.LSF.Benchmarks.csproj` (.NET 9.0, BenchmarkDotNet)

### Running Tests

```bash
cd implementations/csharp/Zerox.LSF
dotnet test
```

### Running Benchmarks

```bash
cd implementations/csharp/Zerox.LSF/Zerox.LSF.Benchmarks
dotnet run -c Release
``` 