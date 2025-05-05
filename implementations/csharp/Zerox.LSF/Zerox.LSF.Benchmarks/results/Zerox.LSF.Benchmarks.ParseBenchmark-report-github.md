```

BenchmarkDotNet v0.14.0, Ubuntu 24.04.2 LTS (Noble Numbat) WSL
AMD Ryzen 9 7950X3D, 1 CPU, 32 logical and 16 physical cores
.NET SDK 9.0.200
  [Host]   : .NET 9.0.2 (9.0.225.6610), X64 RyuJIT AVX-512F+CD+BW+DQ+VL+VBMI
  .NET 9.0 : .NET 9.0.2 (9.0.225.6610), X64 RyuJIT AVX-512F+CD+BW+DQ+VL+VBMI

Job=.NET 9.0  Runtime=.NET 9.0  

```
| Method                    | Dataset          | Mean           | Error         | StdDev        | Ratio | RatioSD | Gen0     | Gen1     | Gen2     | Allocated  | Alloc Ratio |
|-------------------------- |----------------- |---------------:|--------------:|--------------:|------:|--------:|---------:|---------:|---------:|-----------:|------------:|
| **LsfParseToJsonString**      | **Medium (1000,10)** | **4,813,930.3 ns** |  **95,468.50 ns** | **106,112.99 ns** |  **4.20** |    **0.11** | **445.3125** | **437.5000** | **351.5625** | **8501.19 KB** |        **2.30** |
| LsfParseToDom             | Medium (1000,10) | 1,145,114.6 ns |  17,349.83 ns |  16,229.04 ns |  1.00 |    0.02 | 515.6250 | 513.6719 | 500.0000 | 3691.57 KB |        1.00 |
| SystemTextJsonDeserialize | Medium (1000,10) | 1,869,273.6 ns |  27,378.10 ns |  25,609.50 ns |  1.63 |    0.03 | 146.4844 | 144.5313 | 109.3750 | 2263.62 KB |        0.61 |
| NewtonsoftJsonDeserialize | Medium (1000,10) | 5,086,347.6 ns | 101,573.71 ns | 190,780.07 ns |  4.44 |    0.18 | 156.2500 | 148.4375 |  78.1250 | 4421.78 KB |        1.20 |
|                           |                  |                |               |               |       |         |          |          |          |            |             |
| **LsfParseToJsonString**      | **Small**            |     **2,301.0 ns** |      **33.62 ns** |      **31.45 ns** |  **4.47** |    **0.08** |   **0.0954** |        **-** |        **-** |     **4.7 KB** |        **2.34** |
| LsfParseToDom             | Small            |       515.1 ns |       7.50 ns |       7.01 ns |  1.00 |    0.02 |   0.0401 |        - |        - |    2.01 KB |        1.00 |
| SystemTextJsonDeserialize | Small            |       830.7 ns |       9.69 ns |       9.06 ns |  1.61 |    0.03 |   0.0286 |        - |        - |    1.43 KB |        0.71 |
| NewtonsoftJsonDeserialize | Small            |     1,510.7 ns |      25.89 ns |      24.22 ns |  2.93 |    0.06 |   0.1106 |        - |        - |    5.48 KB |        2.73 |
