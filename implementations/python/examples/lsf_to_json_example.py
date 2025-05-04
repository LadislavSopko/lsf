"""
Example demonstrating LSF to JSON conversion in Python
"""

from lsf import LSFEncoder, lsf_to_json, lsf_to_json_pretty

# Create some LSF data using the encoder
encoder = LSFEncoder()
lsf_string = (encoder
    .start_object("user")
    .add_field("id", 123)
    .add_field("name", "John Doe")
    .add_list("tags", ["admin", "developer", "tester"])
    .add_typed_field("active", True, "bool")
    .add_typed_field("salary", 75000.50, "float")
    .add_typed_field("manager", None, "null")
    .start_object("company")
    .add_field("name", "Acme Corp")
    .add_field("industry", "Technology")
    .add_typed_field("founded", 1985, "int")
    .to_string())

print("LSF String (not human readable):")
print(lsf_string)
print("\n" + "-" * 50 + "\n")

# Convert to compact JSON
json_string = lsf_to_json(lsf_string)
print("Compact JSON:")
print(json_string)
print("\n" + "-" * 50 + "\n")

# Convert to pretty-printed JSON
pretty_json = lsf_to_json_pretty(lsf_string)
print("Pretty JSON:")
print(pretty_json)
print("\n" + "-" * 50 + "\n")

# Custom indentation
custom_json = lsf_to_json(lsf_string, indent=4)
print("Custom Indentation (4 spaces):")
print(custom_json)
print("\n" + "-" * 50 + "\n")

# Sorted keys
sorted_json = lsf_to_json(lsf_string, indent=2, sort_keys=True)
print("With Sorted Keys:")
print(sorted_json) 