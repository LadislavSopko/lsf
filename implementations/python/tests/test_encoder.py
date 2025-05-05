"""
Tests for the LSF encoder component.
"""

import base64
import unittest
from unittest import TestCase

from lsf.encoder import LSFEncoder


class LSFEncoderTests(TestCase):
    """Test cases for the LSFEncoder class."""

    def test_start_object(self):
        """Test the start_object method."""
        encoder = LSFEncoder()
        result = encoder.start_object("user").to_string()
        self.assertEqual(result, "$o~user$r~")

    def test_add_field(self):
        """Test the add_field method."""
        encoder = LSFEncoder()
        result = encoder.start_object("user").add_field("name", "John").to_string()
        self.assertEqual(result, "$o~user$r~$f~name$f~John$r~")

    def test_add_multiple_fields(self):
        """Test adding multiple fields."""
        encoder = LSFEncoder()
        result = (encoder
                  .start_object("user")
                  .add_field("name", "John")
                  .add_field("age", 30)
                  .to_string())
        self.assertEqual(result, "$o~user$r~$f~name$f~John$r~$f~age$f~30$r~")

    def test_add_field_without_object(self):
        """Test adding a field without starting an object first."""
        encoder = LSFEncoder()
        with self.assertRaises(ValueError):
            encoder.add_field("name", "John")

    def test_add_typed_field_int(self):
        """Test adding a typed field with int type."""
        encoder = LSFEncoder()
        result = (encoder
                  .start_object("user")
                  .add_typed_field("age", 30, "int")
                  .to_string())
        self.assertEqual(result, "$o~user$r~$t~int$f~age$f~30$r~")

    def test_add_typed_field_float(self):
        """Test adding a typed field with float type."""
        encoder = LSFEncoder()
        result = (encoder
                  .start_object("product")
                  .add_typed_field("price", 19.99, "float")
                  .to_string())
        self.assertEqual(result, "$o~product$r~$t~float$f~price$f~19.99$r~")

    def test_add_typed_field_bool(self):
        """Test adding a typed field with bool type."""
        encoder = LSFEncoder()
        result = (encoder
                  .start_object("user")
                  .add_typed_field("active", True, "bool")
                  .to_string())
        self.assertEqual(result, "$o~user$r~$t~bool$f~active$f~True$r~")

    def test_add_typed_field_null(self):
        """Test adding a typed field with null type."""
        encoder = LSFEncoder()
        result = (encoder
                  .start_object("user")
                  .add_typed_field("metadata", None, "null")
                  .to_string())
        self.assertEqual(result, "$o~user$r~$t~null$f~metadata$f~$r~")

    def test_add_typed_field_bin(self):
        """Test adding a typed field with bin type."""
        encoder = LSFEncoder()
        binary_data = b'hello world'
        expected_b64 = base64.b64encode(binary_data).decode('ascii')
        result = (encoder
                  .start_object("file")
                  .add_typed_field("content", binary_data, "bin")
                  .to_string())
        self.assertEqual(result, f"$o~file$r~$t~bin$f~content$f~{expected_b64}$r~")

    def test_add_typed_field_invalid_type(self):
        """Test adding a typed field with an invalid type."""
        encoder = LSFEncoder()
        encoder.start_object("user")
        with self.assertRaises(ValueError):
            encoder.add_typed_field("field", "value", "invalid_type")

    def test_add_list(self):
        """Test adding a list field."""
        encoder = LSFEncoder()
        result = (encoder
                  .start_object("user")
                  .add_list("tags", ["admin", "user"])
                  .to_string())
        self.assertEqual(result, "$o~user$r~$f~tags$f~admin$l~user$r~")

    def test_add_empty_list(self):
        """Test adding an empty list field."""
        encoder = LSFEncoder()
        result = (encoder
                  .start_object("user")
                  .add_list("tags", [])
                  .to_string())
        self.assertEqual(result, "$o~user$r~$f~tags$f~$r~")

    def test_add_error(self):
        """Test adding an error marker."""
        encoder = LSFEncoder()
        result = (encoder
                  .start_object("user")
                  .add_error("Something went wrong")
                  .to_string())
        self.assertEqual(result, "$o~user$r~$e~Something went wrong$r~")

    def test_end_transaction(self):
        """Test ending a transaction."""
        encoder = LSFEncoder()
        result = (encoder
                  .start_object("user")
                  .add_field("name", "John")
                  .end_transaction()
                  .to_string())
        self.assertEqual(result, "$o~user$r~$f~name$f~John$r~$x~$r~")

    def test_complex_encoding(self):
        """Test a more complex encoding scenario."""
        encoder = LSFEncoder()
        result = (encoder
                  .start_object("user")
                  .add_field("id", 123)
                  .add_field("name", "John Doe")
                  .add_list("tags", ["admin", "user", "editor"])
                  .add_typed_field("active", True, "bool")
                  .start_object("profile")
                  .add_field("bio", "A software developer")
                  .add_list("skills", ["Python", "JavaScript", "TypeScript"])
                  .end_transaction()
                  .to_string())
        
        expected = (
            "$o~user$r~"
            "$f~id$f~123$r~"
            "$f~name$f~John Doe$r~"
            "$f~tags$f~admin$l~user$l~editor$r~"
            "$t~bool$f~active$f~True$r~"
            "$o~profile$r~"
            "$f~bio$f~A software developer$r~"
            "$f~skills$f~Python$l~JavaScript$l~TypeScript$r~"
            "$x~$r~"
        )
        self.assertEqual(result, expected)


if __name__ == '__main__':
    unittest.main() 