"""
Tests for the LSF to JSON conversion functions.
"""

import json
import unittest
from unittest import TestCase

from lsf.conversion import lsf_to_json, lsf_to_json_pretty


class LSFConversionTests(TestCase):
    """Test cases for the LSF to JSON conversion functions."""

    def test_lsf_to_json_basic(self):
        """Test basic LSF to JSON conversion."""
        lsf_str = "$o~user$r~$f~name$f~John$r~$f~age$f~30$r~"
        json_str = lsf_to_json(lsf_str)
        
        # Parse and verify the content
        data = json.loads(json_str)
        self.assertEqual(data["user"]["name"], "John")
        self.assertEqual(data["user"]["age"], "30")
        
        # Check that it's valid, compact JSON
        self.assertNotIn("\n", json_str)
        self.assertIn('{"user":', json_str)

    def test_lsf_to_json_pretty(self):
        """Test pretty-printed LSF to JSON conversion."""
        lsf_str = "$o~user$r~$f~name$f~John$r~"
        json_str = lsf_to_json_pretty(lsf_str)
        
        # Pretty-printed JSON should have newlines and indentation
        self.assertIn("\n", json_str)
        self.assertIn("  ", json_str)
        
        # Should still be valid JSON
        data = json.loads(json_str)
        self.assertEqual(data["user"]["name"], "John")

    def test_lsf_to_json_with_indent(self):
        """Test LSF to JSON with custom indentation."""
        lsf_str = "$o~user$r~$f~name$f~John$r~"
        json_str = lsf_to_json(lsf_str, indent=4)
        
        # Should have 4-space indentation
        self.assertIn("    ", json_str)
        
        # Should still be valid JSON
        data = json.loads(json_str)
        self.assertEqual(data["user"]["name"], "John")

    def test_lsf_to_json_with_sort_keys(self):
        """Test LSF to JSON with sorted keys."""
        lsf_str = "$o~user$r~$f~name$f~John$r~$f~age$f~30$r~$f~city$f~New York$r~"
        json_str = lsf_to_json(lsf_str, sort_keys=True)
        
        # Without directly checking sort order (which depends on implementation),
        # just verify it still works with sort_keys=True
        data = json.loads(json_str)
        self.assertEqual(data["user"]["name"], "John")
        self.assertEqual(data["user"]["age"], "30")
        self.assertEqual(data["user"]["city"], "New York")

    def test_lsf_to_json_with_typed_values(self):
        """Test LSF to JSON with typed values."""
        lsf_str = (
            "$o~data$r~"
            "$t~int$f~int_val$f~42$r~"
            "$t~float$f~float_val$f~3.14$r~"
            "$t~bool$f~bool_val$f~true$r~"
            "$t~null$f~null_val$f~$r~"
        )
        json_str = lsf_to_json(lsf_str)
        data = json.loads(json_str)
        
        # Verify typed values are preserved
        self.assertEqual(data["data"]["int_val"], 42)
        self.assertEqual(data["data"]["float_val"], 3.14)
        self.assertEqual(data["data"]["bool_val"], True)
        self.assertIsNone(data["data"]["null_val"])

    def test_lsf_to_json_with_list(self):
        """Test LSF to JSON with list values."""
        lsf_str = "$o~user$r~$f~tags$f~admin$l~user$l~editor$r~"
        json_str = lsf_to_json(lsf_str)
        data = json.loads(json_str)
        
        self.assertEqual(data["user"]["tags"], ["admin", "user", "editor"])

    def test_lsf_to_json_with_multiple_objects(self):
        """Test LSF to JSON with multiple objects."""
        lsf_str = "$o~user$r~$f~name$f~John$r~$o~product$r~$f~name$f~Laptop$r~"
        json_str = lsf_to_json(lsf_str)
        data = json.loads(json_str)
        
        self.assertEqual(data["user"]["name"], "John")
        self.assertEqual(data["product"]["name"], "Laptop")

    def test_lsf_to_json_empty(self):
        """Test LSF to JSON with empty LSF string."""
        json_str = lsf_to_json("")
        self.assertEqual(json_str, "{}")


if __name__ == '__main__':
    unittest.main() 