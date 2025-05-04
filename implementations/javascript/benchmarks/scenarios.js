/**
 * Benchmark scenarios
 */

const scenarios = [
  {
    name: "Simple User Profile",
    description: "Basic user profile with personal information",
    data: {
      user: {
        id: 12345,
        name: "Jane Smith",
        email: "jane.smith@example.com",
        verified: true,
        joined: "2023-04-15T10:30:00Z"
      }
    }
  },
  {
    name: "Function Call Parameters",
    description: "Typical parameters for an LLM function call",
    data: {
      function_call: {
        name: "get_weather",
        parameters: {
          location: "San Francisco, CA",
          units: "celsius",
          days: 5,
          include_hourly: true
        }
      }
    }
  },
  {
    name: "API Response",
    description: "Response from an API call with nested data",
    data: {
      response: {
        status: "success",
        code: 200,
        data: {
          products: [
            {
              id: "p123",
              name: "Smartphone X",
              price: 999.99,
              in_stock: true,
              features: ["5G", "Water resistant", "12MP camera"]
            },
            {
              id: "p456",
              name: "Laptop Pro",
              price: 1299.99,
              in_stock: false,
              features: ["16GB RAM", "512GB SSD", "4K display"]
            }
          ],
          pagination: {
            total: 42,
            page: 1,
            per_page: 10
          }
        }
      }
    }
  },
  {
    name: "Complex Nested Structure",
    description: "Deeply nested JSON structure with arrays and objects",
    data: {
      organization: {
        id: "org123",
        name: "Acme Inc.",
        departments: [
          {
            id: "dep1",
            name: "Engineering",
            teams: [
              {
                id: "team1",
                name: "Frontend",
                members: [
                  {
                    id: "emp101",
                    name: "Alex Chen",
                    role: "Lead Developer",
                    skills: ["JavaScript", "React", "TypeScript"],
                    projects: [
                      {
                        id: "proj1",
                        name: "Website Redesign",
                        status: "In Progress",
                        completion: 0.75
                      }
                    ]
                  },
                  {
                    id: "emp102",
                    name: "Sam Taylor",
                    role: "UX Designer",
                    skills: ["Figma", "UI/UX", "Prototyping"],
                    projects: [
                      {
                        id: "proj1",
                        name: "Website Redesign",
                        status: "In Progress",
                        completion: 0.8
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
    name: "LLM Completion Context",
    description: "Typical context passed to an LLM for completion",
    data: {
      context: {
        system_prompt: "You are a helpful assistant that answers questions about programming.",
        user_history: [
          {
            role: "user",
            message: "How do I create a React component?",
            timestamp: "2023-05-10T14:22:10Z"
          },
          {
            role: "assistant",
            message: "In React, you can create a component using either a function or a class. Here's an example of a functional component...",
            timestamp: "2023-05-10T14:22:15Z"
          },
          {
            role: "user",
            message: "How do I add state to it?",
            timestamp: "2023-05-10T14:23:30Z"
          }
        ],
        preferences: {
          temperature: 0.7,
          top_p: 1,
          max_tokens: 300,
          code_examples: true
        }
      }
    }
  },
  {
    name: "Repetitive Data",
    description: "Data with repeated structures that might benefit from references",
    data: {
      order: {
        id: "ord789",
        customer: {
          id: "cust123",
          name: "John Doe",
          email: "john@example.com",
          address: {
            street: "123 Main St",
            city: "Anytown",
            state: "CA",
            zip: "90210",
            country: "USA"
          }
        },
        items: [
          {
            id: "item1",
            product: {
              id: "prod555",
              name: "Coffee Maker",
              brand: "BrewMaster",
              price: 89.99,
              category: "Kitchen Appliances"
            },
            quantity: 1,
            price: 89.99
          },
          {
            id: "item2",
            product: {
              id: "prod556",
              name: "Coffee Beans",
              brand: "BrewMaster",
              price: 15.99,
              category: "Groceries"
            },
            quantity: 2,
            price: 31.98
          },
          {
            id: "item3",
            product: {
              id: "prod557",
              name: "Coffee Filters",
              brand: "BrewMaster",
              price: 5.99,
              category: "Kitchen Supplies"
            },
            quantity: 1,
            price: 5.99
          }
        ],
        shipping_address: {
          street: "123 Main St",
          city: "Anytown",
          state: "CA",
          zip: "90210",
          country: "USA"
        },
        billing_address: {
          street: "123 Main St",
          city: "Anytown",
          state: "CA",
          zip: "90210",
          country: "USA"
        }
      }
    }
  }
];

module.exports = { scenarios }; 