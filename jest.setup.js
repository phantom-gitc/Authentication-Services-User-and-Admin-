// jest.setup.js
// This file can be used to set up global test hooks, mocks, or environment variables for Jest.

// Example: Set test timeout globally
jest.setTimeout(20000);

// Mock Redis for testing to avoid using production database
jest.mock('./src/db/redis', () => {
  // In-memory store for test data
  const store = new Map();
  
  return {
    connected: true,
    get: jest.fn(async (key) => {
      return store.get(key) || null;
    }),
    set: jest.fn(async (key, value, exOption, exTime) => {
      store.set(key, value);
      // Simulate expiration by setting a timeout (optional)
      if (exOption === 'EX' && exTime) {
        setTimeout(() => {
          store.delete(key);
        }, exTime * 1000);
      }
      return 'OK';
    }),
    del: jest.fn(async (key) => {
      return store.delete(key) ? 1 : 0;
    }),
    flushAll: jest.fn(async () => {
      store.clear();
      return 'OK';
    }),
    on: jest.fn(),
  };
});

// You can add more global setup code here as needed.
