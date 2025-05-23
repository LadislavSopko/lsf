using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Zerox.LSF;
using Zerox.LSF.TestPrompts;
using DotNetEnv;

// Load environment variables from .env file
Env.Load();

// Get API key from environment variable
var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
if (string.IsNullOrEmpty(apiKey))
{
    Console.WriteLine("Please set ANTHROPIC_API_KEY in .env file or environment variable");
    Environment.Exit(1);
}

// Parse command line arguments
var format = args.Length > 0 ? args[0] : "lsf";
var testCaseIndex = args.Length > 1 ? int.Parse(args[1]) : 0;

var testCases = TestCases.GetTestCases();
if (testCaseIndex >= testCases.Count)
{
    Console.WriteLine($"Test case {testCaseIndex} not found");
    Environment.Exit(1);
}

var testCase = testCases[testCaseIndex];

Console.WriteLine($"\nTesting {format.ToUpper()} format");
Console.WriteLine($"Test case: {testCase.Name}");
Console.WriteLine($"{testCase.Description}");
Console.WriteLine("\nInput data:");
Console.WriteLine(JsonSerializer.Serialize(testCase.Data, new JsonSerializerOptions { WriteIndented = true }));

// Get the appropriate prompt based on format
string prompt;
if (format == "lsf")
{
    prompt = LSFParser.GetLLMPrompt(true, "detailed");
}
else if (format == "json")
{
    prompt = "Generate the following data as valid JSON. Ensure all strings are properly escaped.";
}
else
{
    Console.WriteLine($"Unknown format: {format}");
    Environment.Exit(1);
    return;
}

// Call Anthropic API
using var httpClient = new HttpClient();
httpClient.DefaultRequestHeaders.Add("x-api-key", apiKey);
httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

var requestBody = new
{
    model = "claude-3-7-sonnet-latest",
    max_tokens = 4000,
    temperature = 0,
    messages = new[]
    {
        new
        {
            role = "user",
            content = $"{prompt}\n\nData to convert:\n{JsonSerializer.Serialize(testCase.Data, new JsonSerializerOptions { WriteIndented = true })}\n\nReturn ONLY the {format.ToUpper()} data, no explanations."
        }
    }
};

try
{
    var response = await httpClient.PostAsync(
        "https://api.anthropic.com/v1/messages",
        new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
    );

    if (!response.IsSuccessStatusCode)
    {
        var error = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"API Error: {response.StatusCode} - {error}");
        Environment.Exit(1);
    }

    var responseJson = await response.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(responseJson);
    var generated = doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString()?.Trim() ?? "";

    Console.WriteLine("\n✓ Generated output:");
    Console.WriteLine(generated);

    // Try to parse
    Console.WriteLine("\n🔍 Attempting to parse...");

    try
    {
        if (format == "json")
        {
            var parsed = JsonSerializer.Deserialize<Dictionary<string, object>>(generated);
            Console.WriteLine("✓ Successfully parsed JSON!");
            Console.WriteLine("\nParsed result:");
            Console.WriteLine(JsonSerializer.Serialize(parsed, new JsonSerializerOptions { WriteIndented = true }));
        }
        else if (format == "lsf")
        {
            var jsonResult = LSFParser.ParseToJsonString(generated);
            if (jsonResult == null)
            {
                throw new Exception("LSF parsing failed: returned null");
            }

            Console.WriteLine("✓ Successfully parsed LSF!");
            Console.WriteLine("\nParsed result:");
            Console.WriteLine(jsonResult);
        }
    }
    catch (Exception e)
    {
        Console.WriteLine($"✗ Parsing failed: {e.Message}");

        if (format == "lsf")
        {
            Console.WriteLine("\nDebug info:");
            var tokens = System.Text.RegularExpressions.Regex.Matches(generated, @"\$[ovft]~");
            Console.Write("Generated LSF tokens: ");
            foreach (System.Text.RegularExpressions.Match token in tokens)
            {
                Console.Write(token.Value + " ");
            }
            Console.WriteLine();
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Error: {ex.Message}");
    Environment.Exit(1);
}