using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Jobs;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using Zerox.LSF; // Reference the main library

namespace Zerox.LSF.Benchmarks
{
    [MemoryDiagnoser] // Add memory allocation diagnostics
    // [SimpleJob(RuntimeMoniker.Net80)] // Target .NET 8 for benchmarks if possible (adjust if needed)
    [SimpleJob(RuntimeMoniker.Net90)] // Target .NET 9 as the project does
    public class ParseBenchmark
    {
        // --- Test Data --- 
        // Simple data for initial benchmark
        private string _lsfSmall = "$o~Simple$f~Name$v~Test$f~Id$v~12345$t~n$f~Active$v~true$t~b";
        private string _jsonSmall = "{\"Name\":\"Test\",\"Id\":12345,\"Active\":true}";
        
        private ReadOnlyMemory<byte> _lsfSmallBytes;
        private byte[]? _jsonSmallBytes; // JsonSerializer often works best with byte[]

        [GlobalSetup]
        public void Setup()
        {
            _lsfSmallBytes = new UTF8Encoding(false).GetBytes(_lsfSmall);
            _jsonSmallBytes = new UTF8Encoding(false).GetBytes(_jsonSmall);
            
            // Pre-run once to avoid JIT overhead in first measurement (optional but good practice)
            var warmupJson = LSFParser.ParseToJsonString(_lsfSmallBytes);
            var warmupObj = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(_jsonSmallBytes);
            if (warmupJson == null || warmupObj == null) throw new Exception("Warmup failed");
        }

        // --- Benchmarks --- 

        [Benchmark(Baseline = true)] // Mark LSF as the baseline for comparison
        public string? LsfParseToJsonString()
        {
            return LSFParser.ParseToJsonString(_lsfSmallBytes);
        }
        
        [Benchmark]
        public Dictionary<string, JsonElement>? SystemTextJsonDeserialize()
        {
            // Deserialize JSON to a comparable structure (Dictionary)
            // Note: This isn't a perfect 1:1 comparison as LSF parses to string, JSON to object,
            // but it gives a reasonable baseline for parsing complexity.
            return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(_jsonSmallBytes);
        }
        
        // TODO: Add benchmark for LSFParser.ParseToDom()
        // TODO: Add benchmarks for larger datasets (medium, large)
        // TODO: Potentially add Newtonsoft.Json comparison
    }
} 