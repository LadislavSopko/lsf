using BenchmarkDotNet.Running;
using Zerox.LSF.Benchmarks;

Console.WriteLine("Starting LSF Benchmarks...");

// Run the benchmark for the ParseBenchmark class
var summary = BenchmarkRunner.Run<ParseBenchmark>();

Console.WriteLine("Benchmarks finished.");
// You can optionally process the summary object here
