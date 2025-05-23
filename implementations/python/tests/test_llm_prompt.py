"""Tests for get_llm_prompt function."""
import pytest
from lsf import get_llm_prompt


def test_get_llm_prompt_minimal_with_example():
    """Test minimal prompt with example."""
    prompt = get_llm_prompt(include_example=True, style="minimal")
    
    assert "Output in LSF format:" in prompt
    assert "$o~=object, $f~=field, $v~=value" in prompt
    assert "NO quotes/brackets" in prompt
    assert "Example:" in prompt
    assert "$o~$f~name$v~John" in prompt


def test_get_llm_prompt_minimal_without_example():
    """Test minimal prompt without example."""
    prompt = get_llm_prompt(include_example=False, style="minimal")
    
    assert "Output in LSF format:" in prompt
    assert "Example:" not in prompt
    assert "$o~$f~name$v~John" not in prompt


def test_get_llm_prompt_detailed_with_example():
    """Test detailed prompt with example."""
    prompt = get_llm_prompt(include_example=True, style="detailed")
    
    assert "Generate output in LSF (LLM-Safe Format):" in prompt
    assert "TOKENS:" in prompt
    assert "TYPES:" in prompt
    assert "RULES:" in prompt
    assert "Multi-line strings: write actual newlines, not \\n" in prompt
    assert "NO escaping - write everything literally" in prompt
    assert "EXAMPLE:" in prompt


def test_get_llm_prompt_detailed_without_example():
    """Test detailed prompt without example."""
    prompt = get_llm_prompt(include_example=False, style="detailed")
    
    assert "RULES:" in prompt
    assert "EXAMPLE:" not in prompt


def test_get_llm_prompt_default_parameters():
    """Test default parameters return minimal with example."""
    prompt = get_llm_prompt()
    
    assert "Output in LSF format:" in prompt
    assert "Example:" in prompt