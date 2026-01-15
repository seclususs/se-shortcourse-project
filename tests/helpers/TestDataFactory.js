class TestDataFactory {
  static createValidUserData(overrides = {}) {
    return {
      username: "testuser",
      email: "test@example.com",
      fullName: "Test User",
      ...overrides,
    };
  }

  static createValidTaskData(overrides = {}) {
    return {
      title: "Test Task",
      description: "Test Description",
      ownerId: "user123",
      category: "work",
      priority: "medium",
      ...overrides,
    };
  }

  static createMultipleTasks(count = 3, baseData = {}) {
    return Array.from({ length: count }, (_, i) =>
      this.createValidTaskData({
        title: `Task ${i + 1}`,
        priority: ["low", "medium", "high"][i % 3],
        ...baseData,
      })
    );
  }

  static createMockStorage() {
    const storage = new Map();
    return {
      save: jest.fn((key, data) => {
        storage.set(key, JSON.stringify(data));
        return true;
      }),
      load: jest.fn((key, defaultValue = null) => {
        const data = storage.get(key);
        return data ? JSON.parse(data) : defaultValue;
      }),
      remove: jest.fn((key) => {
        storage.delete(key);
        return true;
      }),
      clear: jest.fn(() => {
        storage.clear();
        return true;
      }),
    };
  }
}

module.exports = TestDataFactory;
