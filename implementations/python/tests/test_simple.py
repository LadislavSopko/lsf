"""
Tests for the LSF simple API functions.
"""

import base64
import unittest
from unittest import TestCase

from lsf.simple import to_lsf, from_lsf


class LSFSimpleTests(TestCase):
    """Test cases for the LSF simple API functions."""

    def test_to_lsf_basic(self):
        """Test converting a basic Python dict to LSF."""
        data = {
            "user": {
                "name": "John",
                "age": 30
            }
        }
        result = to_lsf(data)
        
        # Check for object marker and fields
        self.assertIn("$o§user$r§", result)
        self.assertIn("$f§name$f§John$r§", result)
        self.assertIn("$t§int$f§age$f§30$r§", result)
        
    def test_to_lsf_multiple_objects(self):
        """Test converting multiple objects to LSF."""
        data = {
            "user": {
                "name": "John"
            },
            "product": {
                "name": "Laptop",
                "price": 999.99
            }
        }
        result = to_lsf(data)
        
        # Check for both objects
        self.assertIn("$o§user$r§", result)
        self.assertIn("$o§product$r§", result)
        self.assertIn("$f§name$f§John$r§", result)
        self.assertIn("$f§name$f§Laptop$r§", result)
        self.assertIn("$t§float$f§price$f§999.99$r§", result)
        
    def test_to_lsf_with_list(self):
        """Test converting a dict with a list to LSF."""
        data = {
            "user": {
                "name": "John",
                "tags": ["admin", "user"]
            }
        }
        result = to_lsf(data)
        
        # Check for list representation
        self.assertIn("$f§tags$f§admin$l§user$r§", result)
        
    def test_to_lsf_with_nested_types(self):
        """Test converting a dict with various types to LSF."""
        data = {
            "data": {
                "int_val": 42,
                "float_val": 3.14,
                "bool_val": True,
                "null_val": None,
                "str_val": "hello",
                "binary_val": b"hello world"
            }
        }
        result = to_lsf(data)
        
        # Check type hints
        self.assertIn("$t§int$f§int_val$f§42$r§", result)
        self.assertIn("$t§float$f§float_val$f§3.14$r§", result)
        self.assertIn("$t§bool$f§bool_val$f§True$r§", result)
        self.assertIn("$t§null$f§null_val$f§$r§", result)
        self.assertIn("$f§str_val$f§hello$r§", result)
        
        # Binary data is encoded as base64
        binary_str = base64.b64encode(b"hello world").decode('ascii')
        self.assertIn(f"$t§bin$f§binary_val$f§{binary_str}$r§", result)
        
    def test_to_lsf_empty_dict(self):
        """Test converting an empty dict to LSF."""
        data = {}
        result = to_lsf(data)
        self.assertEqual(result, "")
        
    def test_from_lsf_basic(self):
        """Test converting basic LSF to Python dict."""
        lsf_str = "$o§user$r§$f§name$f§John$r§$t§int$f§age$f§30$r§"
        result = from_lsf(lsf_str)
        
        expected = {
            "user": {
                "name": "John",
                "age": 30
            }
        }
        self.assertEqual(result, expected)
        
    def test_from_lsf_multiple_objects(self):
        """Test converting LSF with multiple objects to Python dict."""
        lsf_str = "$o§user$r§$f§name$f§John$r§$o§product$r§$f§name$f§Laptop$r§$t§float$f§price$f§999.99$r§"
        result = from_lsf(lsf_str)
        
        expected = {
            "user": {
                "name": "John"
            },
            "product": {
                "name": "Laptop",
                "price": 999.99
            }
        }
        self.assertEqual(result, expected)
        
    def test_from_lsf_with_list(self):
        """Test converting LSF with a list to Python dict."""
        lsf_str = "$o§user$r§$f§name$f§John$r§$f§tags$f§admin$l§user$r§"
        result = from_lsf(lsf_str)
        
        expected = {
            "user": {
                "name": "John",
                "tags": ["admin", "user"]
            }
        }
        self.assertEqual(result, expected)
        
    def test_from_lsf_with_typed_values(self):
        """Test converting LSF with typed values to Python dict."""
        lsf_str = (
            "$o§data$r§"
            "$t§int$f§int_val$f§42$r§"
            "$t§float$f§float_val$f§3.14$r§"
            "$t§bool$f§bool_val$f§true$r§"
            "$t§null$f§null_val$f§$r§"
        )
        result = from_lsf(lsf_str)
        
        expected = {
            "data": {
                "int_val": 42,
                "float_val": 3.14,
                "bool_val": True,
                "null_val": None
            }
        }
        self.assertEqual(result, expected)
        
    def test_from_lsf_with_binary(self):
        """Test converting LSF with binary data to Python dict."""
        binary_data = b'hello world'
        b64_data = base64.b64encode(binary_data).decode('ascii')
        lsf_str = f"$o§file$r§$t§bin$f§content$f§{b64_data}$r§"
        
        result = from_lsf(lsf_str)
        self.assertEqual(result["file"]["content"], binary_data)
        
    def test_from_lsf_empty_string(self):
        """Test converting an empty LSF string to Python dict."""
        result = from_lsf("")
        self.assertEqual(result, {})
        
    def test_round_trip(self):
        """Test a complete round trip from dict to LSF and back."""
        original = {
            "user": {
                "id": 123,
                "name": "John Doe",
                "active": True,
                "balance": 45.67,
                "metadata": None,
                "tags": ["admin", "premium"],
                "image": b"profile-image-data"
            }
        }
        
        # Convert to LSF
        lsf_str = to_lsf(original)
        
        # Convert back to dict
        result = from_lsf(lsf_str)
        
        # Check types and values match
        self.assertEqual(result["user"]["id"], original["user"]["id"])
        self.assertEqual(result["user"]["name"], original["user"]["name"])
        self.assertEqual(result["user"]["active"], original["user"]["active"])
        self.assertEqual(result["user"]["balance"], original["user"]["balance"])
        self.assertEqual(result["user"]["metadata"], original["user"]["metadata"])
        self.assertEqual(result["user"]["tags"], original["user"]["tags"])
        self.assertEqual(result["user"]["image"], original["user"]["image"])


if __name__ == '__main__':
    unittest.main() 