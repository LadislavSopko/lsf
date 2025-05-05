using System;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;
using Zerox.LSF; // For LSFEncoder

namespace Zerox.LSF.Benchmarks
{
    // Helper class to hold data pairs for benchmarks
    public class BenchmarkDataset
    {
        public string Name { get; } // e.g., "Small", "Medium"
        public byte[] LsfBytes { get; }
        public ReadOnlyMemory<byte> LsfMemoryBytes { get; } // Provide ReadOnlyMemory for LSF methods
        public string JsonString { get; }
        public byte[] JsonBytes { get; } // Provide byte[] for System.Text.Json

        public BenchmarkDataset(string name, byte[] lsfBytes, string jsonString)
        {
            Name = name;
            LsfBytes = lsfBytes;
            LsfMemoryBytes = new ReadOnlyMemory<byte>(lsfBytes);
            JsonString = jsonString;
            JsonBytes = new UTF8Encoding(false).GetBytes(jsonString); // Ensure consistent encoding
        }

        // Override ToString for better BenchmarkDotNet output
        public override string ToString() => Name;
    }

    public static class BenchmarkDataGenerator
    {
        // Cache generated data to avoid regenerating multiple times
        private static BenchmarkDataset? _smallDataCache;
        private static BenchmarkDataset? _mediumDataCache;

        public static BenchmarkDataset GetSmallDataset()
        {
            if (_smallDataCache != null)
            {
                return _smallDataCache;
            }

            // Define the C# object for the small dataset
            var smallObject = new Dictionary<string, object?>
            {
                { "Name", "Test" },
                { "Id", 12345 },
                { "Active", true },
                { "Description", "A simple test object for benchmarking." },
                { "Tags", new List<object?> { "tag1", "tag2", null, 100 } }
            };

            // Encode to LSF bytes
            byte[] lsfBytes = LSFEncoder.EncodeToArray(smallObject);

            // Serialize to JSON string (using Newtonsoft for consistency with benchmark)
            string jsonString = JsonConvert.SerializeObject(smallObject);

            _smallDataCache = new BenchmarkDataset("Small", lsfBytes, jsonString);
            return _smallDataCache;
        }

        public static BenchmarkDataset GetMediumDataset(int complexityFactor = 1000) // complexityFactor determines size
        {
             if (_mediumDataCache != null)
            {
                return _mediumDataCache;
            }

            // Generate a more complex object (e.g., a list of dictionaries)
            var mediumList = new List<Dictionary<string, object?>>(complexityFactor);
            var random = new Random(42); // Seed for reproducibility

            for (int i = 0; i < complexityFactor; i++)
            {
                mediumList.Add(new Dictionary<string, object?>
                {
                    { "Guid", Guid.NewGuid().ToString() },
                    { "Index", i },
                    { "Timestamp", DateTime.UtcNow.AddSeconds(i).ToString("o") }, // ISO 8601 format
                    { "Value", random.NextDouble() * 1000 },
                    { "IsEnabled", i % 2 == 0 },
                    { "Notes", $"This is item number {i} with some random text: {Guid.NewGuid()}" },
                    { "SubItems", new List<object?> { random.Next(100), null, Guid.NewGuid().ToString().Substring(0, 8), i % 3 == 0 } }
                });
            }

            // Encode to LSF bytes
            byte[] lsfBytes = LSFEncoder.EncodeToArray(mediumList);

            // Serialize to JSON string
            string jsonString = JsonConvert.SerializeObject(mediumList);
            
            _mediumDataCache = new BenchmarkDataset($"Medium ({complexityFactor})", lsfBytes, jsonString);
            return _mediumDataCache;
        }

        // Method for BenchmarkDotNet ParamsSource
        public static IEnumerable<BenchmarkDataset> GetDataSets()
        {
            yield return GetSmallDataset();
            yield return GetMediumDataset(); // Uses default complexityFactor
            // Can add more datasets here if needed, e.g.:
            // yield return GetMediumDataset(5000);
        }
    }
} 