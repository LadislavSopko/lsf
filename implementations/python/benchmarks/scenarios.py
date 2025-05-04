#!/usr/bin/env python
"""
Benchmark data scenarios

This module provides common test data scenarios for benchmarking LSF.
"""

import datetime
from typing import Dict, Any, List

# Sample scenarios that represent common use cases
SCENARIOS = [
    {
        "name": "Simple User Profile",
        "description": "Basic user profile with personal information",
        "data": {
            "user": {
                "id": 12345,
                "name": "Jane Smith",
                "email": "jane.smith@example.com",
                "verified": True,
                "joined": "2023-04-15T10:30:00Z"
            }
        }
    },
    {
        "name": "Function Call Parameters",
        "description": "Typical parameters for an LLM function call",
        "data": {
            "function_call": {
                "name": "get_weather",
                "parameters": {
                    "location": "San Francisco, CA",
                    "units": "celsius",
                    "days": 5,
                    "include_hourly": True
                }
            }
        }
    },
    {
        "name": "API Response",
        "description": "Response from an API call with nested data",
        "data": {
            "response": {
                "status": "success",
                "code": 200,
                "data": {
                    "products": [
                        {
                            "id": "p123",
                            "name": "Smartphone X",
                            "price": 999.99,
                            "in_stock": True,
                            "features": ["5G", "Water resistant", "12MP camera"]
                        },
                        {
                            "id": "p456",
                            "name": "Laptop Pro",
                            "price": 1299.99,
                            "in_stock": False,
                            "features": ["16GB RAM", "512GB SSD", "4K display"]
                        }
                    ],
                    "pagination": {
                        "total": 42,
                        "page": 1,
                        "per_page": 10
                    }
                }
            }
        }
    },
    {
        "name": "Complex Nested Structure",
        "description": "Deeply nested structure with arrays and objects",
        "data": {
            "organization": {
                "id": "org123",
                "name": "Acme Inc.",
                "departments": [
                    {
                        "id": "dep1",
                        "name": "Engineering",
                        "teams": [
                            {
                                "id": "team1",
                                "name": "Frontend",
                                "members": [
                                    {
                                        "id": "emp101",
                                        "name": "Alex Chen",
                                        "role": "Lead Developer",
                                        "skills": ["JavaScript", "React", "TypeScript"],
                                        "projects": [
                                            {
                                                "id": "proj1",
                                                "name": "Website Redesign",
                                                "status": "In Progress",
                                                "completion": 0.75
                                            }
                                        ]
                                    },
                                    {
                                        "id": "emp102",
                                        "name": "Sam Taylor",
                                        "role": "UX Designer",
                                        "skills": ["Figma", "UI/UX", "Prototyping"],
                                        "projects": [
                                            {
                                                "id": "proj1",
                                                "name": "Website Redesign",
                                                "status": "In Progress",
                                                "completion": 0.8
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        }
    },
    {
        "name": "LLM Completion Context",
        "description": "Typical context passed to an LLM for completion",
        "data": {
            "context": {
                "system_prompt": "You are a helpful assistant that answers questions about programming.",
                "user_history": [
                    {
                        "role": "user",
                        "message": "How do I create a React component?",
                        "timestamp": "2023-05-10T14:22:10Z"
                    },
                    {
                        "role": "assistant",
                        "message": "In React, you can create a component using either a function or a class. Here's an example of a functional component...",
                        "timestamp": "2023-05-10T14:22:15Z"
                    },
                    {
                        "role": "user",
                        "message": "How do I add state to it?",
                        "timestamp": "2023-05-10T14:23:30Z"
                    }
                ],
                "preferences": {
                    "temperature": 0.7,
                    "top_p": 1,
                    "max_tokens": 300,
                    "code_examples": True
                }
            }
        }
    },
    {
        "name": "Repetitive Data",
        "description": "Data with repeated structures that might benefit from references",
        "data": {
            "order": {
                "id": "ord789",
                "customer": {
                    "id": "cust123",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "address": {
                        "street": "123 Main St",
                        "city": "Anytown",
                        "state": "CA",
                        "zip": "90210",
                        "country": "USA"
                    }
                },
                "items": [
                    {
                        "id": "item1",
                        "product": {
                            "id": "prod555",
                            "name": "Coffee Maker",
                            "brand": "BrewMaster",
                            "price": 89.99,
                            "category": "Kitchen Appliances"
                        },
                        "quantity": 1,
                        "price": 89.99
                    },
                    {
                        "id": "item2",
                        "product": {
                            "id": "prod556",
                            "name": "Coffee Beans",
                            "brand": "BrewMaster",
                            "price": 15.99,
                            "category": "Groceries"
                        },
                        "quantity": 2,
                        "price": 31.98
                    },
                    {
                        "id": "item3",
                        "product": {
                            "id": "prod557",
                            "name": "Coffee Filters",
                            "brand": "BrewMaster",
                            "price": 5.99,
                            "category": "Kitchen Supplies"
                        },
                        "quantity": 1,
                        "price": 5.99
                    }
                ],
                "shipping_address": {
                    "street": "123 Main St",
                    "city": "Anytown",
                    "state": "CA",
                    "zip": "90210",
                    "country": "USA"
                },
                "billing_address": {
                    "street": "123 Main St",
                    "city": "Anytown",
                    "state": "CA",
                    "zip": "90210",
                    "country": "USA"
                }
            }
        }
    }
]

# Additional benchmark data sets
DATA_SETS = {
    "small": {
        "user": {
            "id": 12345,
            "name": "John Doe",
            "active": True
        }
    },
    "medium": {
        "user": {
            "id": 12345,
            "name": "John Doe",
            "email": "john@example.com",
            "active": True,
            "roles": ["user", "admin"],
            "preferences": {
                "theme": "dark",
                "notifications": True,
                "language": "en-US"
            }
        }
    },
    "large": (lambda: {
        "users": {
            f"user{i}": {
                "id": i,
                "name": f"User {i}",
                "email": f"user{i}@example.com",
                "active": i % 7 != 0,  # Some inactive users
                "created_at": datetime.datetime.now().isoformat(),
                "last_login": datetime.datetime.now().isoformat(),
                "permissions": ["admin", "user", "manager"] if i % 10 == 0 else ["user"]
            } for i in range(1, 101)  # 100 users
        },
        "products": {
            f"product{i}": {
                "id": i,
                "name": f"Product {i}",
                "price": 9.99 + i,
                "stock": i * 5,
                "categories": [f"category{i % 5 + 1}", f"category{i % 3 + 1}"],
                "features": [f"Feature {idx + 1}" for idx in range(i % 5 + 1)]
            } for i in range(1, 21)  # 20 products
        },
        "transactions": {
            f"tx{i}": {
                "id": f"TX-{10000 + i}",
                "user_id": i % 100 + 1,
                "product_id": i % 20 + 1,
                "amount": 9.99 + (i % 20 + 1),
                "date": datetime.datetime.now().isoformat(),
                "status": "pending" if i % 10 == 0 else ("failed" if i % 5 == 0 else "completed")
            } for i in range(1, 51)  # 50 transactions
        },
        "settings": {
            "system": {
                "debug": False,
                "cache_enabled": True,
                "timeout": 30000,
                "retry_count": 3,
                "features": ["search", "export", "import", "reports", "dashboards"]
            }
        }
    })()
}

# Token estimation function (common utility for benchmarks)
def estimate_tokens(text: str) -> int:
    """Estimate the number of tokens in a string (roughly 4 chars = 1 token)."""
    return max(1, len(text) // 4) 