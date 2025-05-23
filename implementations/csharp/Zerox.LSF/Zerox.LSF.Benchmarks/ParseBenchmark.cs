using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Jobs;
using Newtonsoft.Json; // Add Newtonsoft.Json
using Newtonsoft.Json.Linq;
using System.Text.Json;
using JsonSerializer = System.Text.Json.JsonSerializer; // For JObject
using System;
using System.Collections.Generic;

namespace Zerox.LSF.Benchmarks
{
    [MemoryDiagnoser] // Add memory allocation diagnostics
    // [SimpleJob(RuntimeMoniker.Net80)] // Target .NET 8 for benchmarks if possible (adjust if needed)
    [SimpleJob(RuntimeMoniker.Net90)] // Target .NET 9 as the project does
    public class ParseBenchmark
    {
        // Define a static property within this class to serve as the ParamsSource
        public static IEnumerable<BenchmarkDataset> DataSets => BenchmarkDataGenerator.GetDataSets();

        // Point ParamsSource to the local static property
        [ParamsSource(nameof(DataSets))]
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider adding the 'required' modifier or declaring as nullable.
        public BenchmarkDataset Dataset { get; set; }
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider adding the 'required' modifier or declaring as nullable.

        // --- Benchmarks --- 

        [Benchmark]
        public string? LsfParseToJsonString()
        {
            // Use data from the Dataset parameter
            return LSFParser.ParseToJsonString(Dataset.LsfMemoryBytes);
        }

        [Benchmark(Baseline = true)]
        public ParseResult LsfParseToDom()
        {
            // Use data from the Dataset parameter
            return LSFParser.ParseToDom(Dataset.LsfMemoryBytes);
        }
        
        [Benchmark]
        public Dictionary<string, JsonElement>? SystemTextJsonDeserialize()
        {
            // Use data from the Dataset parameter
            return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(Dataset.JsonBytes);
        }

        [Benchmark]
        public JObject? NewtonsoftJsonDeserialize()
        {
            // Use data from the Dataset parameter
            return JsonConvert.DeserializeObject<JObject>(Dataset.JsonString);
        }
        
        // TODO: Add benchmark for Newtonsoft.Json comparison
        // TODO: Add benchmarks for larger datasets (medium, large) using ParamsSource
    }
} 