"""
Tests for the LSF decoder component.
"""

import base64
import unittest
from unittest import TestCase

from lsf.decoder import LSFDecoder


class LSFDecoderTests(TestCase):
    """Test cases for the LSFDecoder class."""

    def test_decode_basic(self):
        """Test decoding a basic object."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~$f~name$f~John$r~"
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "name": "John"
            }
        }
        self.assertEqual(result, expected)

    def test_decode_multiple_fields(self):
        """Test decoding an object with multiple fields."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~$f~name$f~John$r~$f~age$f~30$r~"
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "name": "John",
                "age": "30"
            }
        }
        self.assertEqual(result, expected)

    def test_decode_multiple_objects(self):
        """Test decoding multiple objects."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~$f~name$f~John$r~$o~product$r~$f~name$f~Laptop$r~"
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "name": "John"
            },
            "product": {
                "name": "Laptop"
            }
        }
        self.assertEqual(result, expected)

    def test_decode_list(self):
        """Test decoding a field with a list value."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~$f~tags$f~admin$l~user$l~editor$r~"
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "tags": ["admin", "user", "editor"]
            }
        }
        self.assertEqual(result, expected)

    def test_decode_empty_list(self):
        """Test decoding a field with an empty list."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~$f~tags$f~$r~"
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "tags": ""
            }
        }
        self.assertEqual(result, expected)

    def test_decode_typed_int(self):
        """Test decoding a typed field with int type."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~$t~int$f~age$f~30$r~"
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "age": 30
            }
        }
        self.assertEqual(result, expected)
        self.assertIsInstance(result["user"]["age"], int)

    def test_decode_typed_float(self):
        """Test decoding a typed field with float type."""
        decoder = LSFDecoder()
        lsf_str = "$o~product$r~$t~float$f~price$f~19.99$r~"
        result = decoder.decode(lsf_str)
        
        expected = {
            "product": {
                "price": 19.99
            }
        }
        self.assertEqual(result, expected)
        self.assertIsInstance(result["product"]["price"], float)

    def test_decode_typed_bool(self):
        """Test decoding a typed field with bool type."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~$t~bool$f~active$f~true$r~"
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "active": True
            }
        }
        self.assertEqual(result, expected)
        self.assertIsInstance(result["user"]["active"], bool)

    def test_decode_typed_null(self):
        """Test decoding a typed field with null type."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~$t~null$f~metadata$f~$r~"
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "metadata": None
            }
        }
        self.assertEqual(result, expected)
        self.assertIsNone(result["user"]["metadata"])

    def test_decode_typed_bin(self):
        """Test decoding a typed field with bin type."""
        decoder = LSFDecoder()
        binary_data = b'hello world'
        b64_data = base64.b64encode(binary_data).decode('ascii')
        lsf_str = f"$o~file$r~$t~bin$f~content$f~{b64_data}$r~"
        result = decoder.decode(lsf_str)
        
        self.assertEqual(result["file"]["content"], binary_data)

    def test_decode_error_marker(self):
        """Test decoding with an error marker."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~$f~name$f~John$r~$e~Something went wrong$r~"
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "name": "John"
            }
        }
        self.assertEqual(result, expected)
        self.assertEqual(decoder.get_errors(), ["Something went wrong"])

    def test_decode_transaction_marker(self):
        """Test decoding with a transaction marker."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~$f~name$f~John$r~$x~$r~$o~product$r~$f~name$f~Laptop$r~"
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "name": "John"
            },
            "product": {
                "name": "Laptop"
            }
        }
        self.assertEqual(result, expected)

    def test_decode_malformed_input(self):
        """Test decoding malformed input with partial results."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~$f~name$f~John$r~$t~invalid$f~field$f~value$r~$f~age$f~30$r~"
        result = decoder.decode(lsf_str)
        
        # Should still get the valid parts
        self.assertEqual(result["user"]["name"], "John")
        self.assertEqual(result["user"]["age"], "30")
        
        # And have an error recorded
        self.assertTrue(len(decoder.get_errors()) > 0)

    def test_decode_complex(self):
        """Test decoding a complex LSF structure."""
        decoder = LSFDecoder()
        lsf_str = (
            "$o~user$r~"
            "$f~id$f~123$r~"
            "$f~name$f~John Doe$r~"
            "$f~tags$f~admin$l~user$l~editor$r~"
            "$t~bool$f~active$f~true$r~"
            "$o~profile$r~"
            "$f~bio$f~A software developer$r~"
            "$f~skills$f~Python$l~JavaScript$l~TypeScript$r~"
        )
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "id": "123",
                "name": "John Doe",
                "tags": ["admin", "user", "editor"],
                "active": True
            },
            "profile": {
                "bio": "A software developer",
                "skills": ["Python", "JavaScript", "TypeScript"]
            }
        }
        self.assertEqual(result, expected)

    def test_decode_empty_string(self):
        """Test decoding an empty string."""
        decoder = LSFDecoder()
        result = decoder.decode("")
        self.assertEqual(result, {})

    def test_decode_whitespace(self):
        """Test decoding whitespace between records."""
        decoder = LSFDecoder()
        lsf_str = "$o~user$r~  \n  $f~name$f~John$r~  "
        result = decoder.decode(lsf_str)
        
        expected = {
            "user": {
                "name": "John"
            }
        }
        self.assertEqual(result, expected)


if __name__ == '__main__':
    unittest.main() 