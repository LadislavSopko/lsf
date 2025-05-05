using System;
using System.Collections.Generic;
using System.Linq;
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

        public static BenchmarkDataset GetMediumDataset(int complexityFactor = 1000, int listSizeFactor = 10) // complexityFactor = # fields, listSizeFactor = size of lists
        {
             if (_mediumDataCache != null && _mediumDataCache.Name.Contains($"({complexityFactor},{listSizeFactor})")) // Check cache key includes factors
             {
                 return _mediumDataCache;
             }

            // Generate a single large, flat dictionary
            var mediumObject = new Dictionary<string, object?>(complexityFactor * 2); // Estimate capacity
            var random = new Random(42); // Seed for reproducibility
            var lipsum = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".Split(' ');

            for (int i = 0; i < complexityFactor; i++)
            {
                // Add various types of fields
                mediumObject.Add($"Guid_{i}", Guid.NewGuid().ToString());
                mediumObject.Add($"Index_{i}", i);
                mediumObject.Add($"Timestamp_{i}", DateTime.UtcNow.AddSeconds(i).ToString("o"));
                mediumObject.Add($"Value_{i}", random.NextDouble() * 1000);
                mediumObject.Add($"IsEnabled_{i}", i % 2 == 0);
                mediumObject.Add($"Notes_{i}", $"Note for item {i}: {string.Join(" ", lipsum.OrderBy(x => random.Next()).Take(10))}"); // Add some text
                
                // Add a list field (implicit array in LSF)
                var subList = new List<object?>(listSizeFactor);
                for(int j = 0; j < listSizeFactor; j++)
                {
                    subList.Add(random.Next(10000)); // Add numbers to the list
                    if(j % 5 == 0) subList.Add(null); // Add some nulls
                    if(j % 7 == 0) subList.Add(lipsum[random.Next(lipsum.Length)]); // Add some strings
                }
                mediumObject.Add($"SubItems_{i}", subList); 
            }

            // Encode the flat dictionary to LSF bytes
            byte[] lsfBytes = LSFEncoder.EncodeToArray(mediumObject); 

            // Serialize the flat dictionary to JSON string
            string jsonString = JsonConvert.SerializeObject(mediumObject);
            
            // Update cache with specific factors in name
            _mediumDataCache = new BenchmarkDataset($"Medium ({complexityFactor},{listSizeFactor})", lsfBytes, jsonString);
            return _mediumDataCache;
        }

        // Method for BenchmarkDotNet ParamsSource
        public static IEnumerable<BenchmarkDataset> GetDataSets()
        {
            yield return GetSmallDataset();
            yield return GetMediumDataset(); // Uses default factors
            // Can add more datasets here if needed, e.g.:
            // yield return GetMediumDataset(5000, 20);
        }
    }
} 