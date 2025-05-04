#!/usr/bin/env python

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="lsf-format",
    version="1.2.0",
    author="LSF Contributors",
    author_email="lsf@example.com",
    description="LLM-Safe Format: A structured serialization format for LLMs",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/LadislavSopko/lsf",
    packages=find_packages(exclude=["tests", "tests.*"]),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Text Processing :: Markup",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=[
        # Add any runtime dependencies here
    ],
    extras_require={
        "dev": [
            "pytest>=6.0",
            "pytest-cov>=2.0",
            "black>=21.0",
            "isort>=5.0",
            "mypy>=0.900",
            "flake8>=3.9",
            "sphinx>=4.0",
            "sphinx-rtd-theme>=0.5",
        ],
        "test": [
            "pytest>=6.0",
            "pytest-cov>=2.0",
        ],
    },
    keywords="serialization, llm, ai, structured-data, parsing",
    project_urls={
        "Bug Reports": "https://github.com/LadislavSopko/lsf/issues",
        "Source": "https://github.com/LadislavSopko/lsf",
        "Documentation": "https://lsf-format.readthedocs.io/",
    },
) 