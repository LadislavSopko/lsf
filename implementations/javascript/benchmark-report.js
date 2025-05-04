/**
 * LSF Format Benchmark Report Generator
 * 
 * Runs benchmarks and creates a visual report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run the benchmarks and capture the output
function runBenchmarks() {
  try {
    console.log("Running LSF benchmarks...");
    const output = execSync('node benchmark.js', { encoding: 'utf8' });
    return output;
  } catch (error) {
    console.error("Error running benchmarks:", error.message);
    process.exit(1);
  }
}

// Parse the benchmark output to extract results
function parseResults(output) {
  const lines = output.split('\n');
  const results = [];
  
  // Simple parser to extract benchmark results
  for (const line of lines) {
    if (line.includes(': ') && line.includes('ms total')) {
      const parts = line.split(': ');
      const name = parts[0];
      const timeData = parts[1].split(', ');
      const totalMs = parseFloat(timeData[0].replace('ms total', ''));
      const avgMs = parseFloat(timeData[1].replace('ms per operation', ''));
      
      results.push({
        name,
        totalMs,
        avgMs
      });
    }
  }
  
  return results;
}

// Generate comparison groups
function generateComparisonGroups(results) {
  const groups = {
    'small-encode': results.filter(r => r.name.includes('Encode small data')),
    'medium-encode': results.filter(r => r.name.includes('Encode medium data')),
    'large-encode': results.filter(r => r.name.includes('Encode large data')),
    'small-decode': results.filter(r => r.name.includes('Decode small data')),
    'medium-decode': results.filter(r => r.name.includes('Decode medium data')),
    'large-decode': results.filter(r => r.name.includes('Decode large data')),
    'parser-factory': results.filter(r => r.name.includes('Parser factory')),
    'round-trip': results.filter(r => r.name.includes('round-trip'))
  };
  
  return groups;
}

// Generate HTML report
function generateHTMLReport(benchmarkOutput, results, groups) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LSF Format Benchmark Results</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    pre {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 14px;
      line-height: 1.4;
    }
    .chart {
      margin: 30px 0;
    }
    .bar-container {
      margin-bottom: 10px;
      display: flex;
      align-items: center;
    }
    .bar-label {
      width: 300px;
      text-align: right;
      padding-right: 15px;
      font-size: 14px;
    }
    .bar {
      height: 25px;
      background-color: #3498db;
      border-radius: 4px;
      position: relative;
      min-width: 2px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 10px;
      box-sizing: border-box;
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
    .bar.json {
      background-color: #e74c3c;
    }
    .bar.lsf-standard {
      background-color: #2980b9;
    }
    .bar.lsf-fast {
      background-color: #27ae60;
    }
    .bar.lsf-auto {
      background-color: #f39c12;
    }
    .bar-value {
      margin-left: 10px;
      font-size: 14px;
      color: #333;
    }
    .card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .legend {
      display: flex;
      margin: 20px 0;
      gap: 20px;
      flex-wrap: wrap;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin-right: 15px;
    }
    .legend-color {
      width: 20px;
      height: 20px;
      margin-right: 8px;
      border-radius: 4px;
    }
    .section {
      margin-bottom: 40px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    tr:hover {
      background-color: #f8f9fa;
    }
  </style>
</head>
<body>
  <h1>LSF Format Benchmark Results</h1>
  
  <div class="card">
    <h2>About</h2>
    <p>
      This report shows performance benchmarks for the LSF format TypeScript implementation. 
      Comparisons are made between different LSF parser implementations and JSON as a baseline.
    </p>
    
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color" style="background-color: #e74c3c;"></div>
        <div>JSON</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #2980b9;"></div>
        <div>LSF Standard</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #27ae60;"></div>
        <div>LSF Fast</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #f39c12;"></div>
        <div>LSF Auto</div>
      </div>
    </div>
  </div>

  <!-- Small data encoding -->
  <div class="section card">
    <h2>Small Data Encoding</h2>
    <p>Comparing encoding performance for small data objects (single user with basic fields)</p>
    <div class="chart">
      ${generateBarChart(groups['small-encode'], 'encode')}
    </div>
  </div>

  <!-- Medium data encoding -->
  <div class="section card">
    <h2>Medium Data Encoding</h2>
    <p>Comparing encoding performance for medium data objects (100 products with multiple fields)</p>
    <div class="chart">
      ${generateBarChart(groups['medium-encode'], 'encode')}
    </div>
  </div>

  <!-- Large data encoding -->
  <div class="section card">
    <h2>Large Data Encoding</h2>
    <p>Comparing encoding performance for large data objects (1000 products, 100 users, 200 orders)</p>
    <div class="chart">
      ${generateBarChart(groups['large-encode'], 'encode')}
    </div>
  </div>

  <!-- Small data decoding -->
  <div class="section card">
    <h2>Small Data Decoding</h2>
    <p>Comparing decoding performance for small data objects</p>
    <div class="chart">
      ${generateBarChart(groups['small-decode'], 'decode')}
    </div>
  </div>

  <!-- Medium data decoding -->
  <div class="section card">
    <h2>Medium Data Decoding</h2>
    <p>Comparing decoding performance for medium data objects</p>
    <div class="chart">
      ${generateBarChart(groups['medium-decode'], 'decode')}
    </div>
  </div>

  <!-- Large data decoding -->
  <div class="section card">
    <h2>Large Data Decoding</h2>
    <p>Comparing decoding performance for large data objects</p>
    <div class="chart">
      ${generateBarChart(groups['large-decode'], 'decode')}
    </div>
  </div>

  <!-- Parser factory -->
  <div class="section card">
    <h2>Parser Factory</h2>
    <p>Comparing performance of different parser factory options with medium data</p>
    <div class="chart">
      ${generateBarChart(groups['parser-factory'], 'parser')}
    </div>
  </div>

  <!-- Round trip -->
  <div class="section card">
    <h2>Round Trip Performance</h2>
    <p>Comparing full round-trip performance (encode + decode) with medium data</p>
    <div class="chart">
      ${generateBarChart(groups['round-trip'], 'round-trip')}
    </div>
  </div>

  <!-- All results table -->
  <div class="section card">
    <h2>All Benchmark Results</h2>
    <table>
      <thead>
        <tr>
          <th>Test</th>
          <th>Average (ms)</th>
          <th>Total (ms)</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(result => `
          <tr>
            <td>${result.name}</td>
            <td>${result.avgMs.toFixed(4)}</td>
            <td>${result.totalMs.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- Raw output -->
  <div class="section card">
    <h2>Raw Benchmark Output</h2>
    <pre>${benchmarkOutput}</pre>
  </div>

  <footer>
    <p>Generated on ${new Date().toISOString()}</p>
  </footer>

  <script>
    // Add any interactive features here if needed
  </script>
</body>
</html>
  `;
  
  return html;
}

// Generate a bar chart for a comparison group
function generateBarChart(items, type) {
  if (!items || items.length === 0) return '<p>No data available</p>';
  
  // Find the maximum value to scale the bars
  const maxValue = Math.max(...items.map(item => item.avgMs));
  
  return items.map(item => {
    const width = `${Math.max(1, (item.avgMs / maxValue) * 100)}%`;
    let barClass = 'bar';
    
    // Determine class based on item name
    if (item.name.toLowerCase().includes('json')) {
      barClass += ' json';
    } else if (item.name.toLowerCase().includes('ultrafastlsfparser') || 
               item.name.toLowerCase().includes('fast)')) {
      barClass += ' lsf-fast';
    } else if (item.name.toLowerCase().includes('auto)')) {
      barClass += ' lsf-auto';
    } else {
      barClass += ' lsf-standard';
    }
    
    return `
      <div class="bar-container">
        <div class="bar-label">${item.name}</div>
        <div class="${barClass}" style="width: ${width}">
          ${item.avgMs < 0.1 ? '' : item.avgMs.toFixed(4)}
        </div>
        <div class="bar-value">${item.avgMs.toFixed(4)} ms</div>
      </div>
    `;
  }).join('');
}

// Main function
async function main() {
  console.log("Generating LSF benchmark report...");
  
  // Run benchmarks
  const benchmarkOutput = runBenchmarks();
  
  // Parse results
  const results = parseResults(benchmarkOutput);
  
  // Generate comparison groups
  const groups = generateComparisonGroups(results);
  
  // Generate HTML report
  const html = generateHTMLReport(benchmarkOutput, results, groups);
  
  // Write HTML file
  fs.writeFileSync(path.join(__dirname, 'benchmark-report.html'), html);
  
  console.log("Benchmark report generated: benchmark-report.html");
}

// Run the main function
main().catch(console.error); 