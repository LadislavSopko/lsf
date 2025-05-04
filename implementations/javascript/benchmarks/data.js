/**
 * Benchmark datasets
 */

const dataSets = {
  small: {
    user: {
      id: 12345,
      name: "John Doe",
      active: true
    }
  },
  medium: {
    user: {
      id: 12345,
      name: "John Doe",
      email: "john@example.com",
      active: true,
      roles: ["user", "admin"],
      preferences: {
        theme: "dark",
        notifications: true,
        language: "en-US"
      }
    }
  },
  large: (() => {
    // Generate a larger dataset with some repetitive content
    const data = {
      users: {},
      products: {},
      transactions: {},
      settings: {
        system: {
          debug: false,
          cacheEnabled: true,
          timeout: 30000,
          retryCount: 3,
          features: ["search", "export", "import", "reports", "dashboards"]
        }
      }
    };
    
    // Add 100 users
    for (let i = 1; i <= 100; i++) {
      data.users[`user${i}`] = {
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: i % 7 !== 0, // Some inactive users
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        permissions: i % 10 === 0 ? ["admin", "user", "manager"] : ["user"]
      };
    }
    
    // Add 20 products
    for (let i = 1; i <= 20; i++) {
      data.products[`product${i}`] = {
        id: i,
        name: `Product ${i}`,
        price: 9.99 + i,
        stock: i * 5,
        categories: [`category${i % 5 + 1}`, `category${i % 3 + 1}`],
        features: Array(i % 5 + 1).fill(0).map((_, idx) => `Feature ${idx + 1}`)
      };
    }
    
    // Add 50 transactions
    for (let i = 1; i <= 50; i++) {
      const userId = i % 100 + 1;
      const productId = i % 20 + 1;
      
      data.transactions[`tx${i}`] = {
        id: `TX-${10000 + i}`,
        userId: userId,
        productId: productId,
        amount: 9.99 + productId,
        date: new Date().toISOString(),
        status: i % 10 === 0 ? "pending" : (i % 5 === 0 ? "failed" : "completed")
      };
    }
    
    return data;
  })()
};

module.exports = { dataSets }; 