const TestDataFactory = require("../helpers/TestDataFactory");
const TestAssertions = require("../helpers/TestAssertions");
const UserRepository = require("../../src/repositories/UserRepository");
const User = require("../../src/models/User");

describe("UserRepository", () => {
  let userRepository;
  let mockStorage;

  beforeEach(() => {
    mockStorage = TestDataFactory.createMockStorage();
    jest.spyOn(console, "error").mockImplementation(() => {});
    userRepository = new UserRepository(mockStorage);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("User Creation", () => {
    test("should create user successfully", () => {
      const userData = TestDataFactory.createValidUserData();
      const user = userRepository.create(userData);
      expect(user).toBeInstanceOf(User);
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      TestAssertions.assertUserHasRequiredProperties(user);
      expect(mockStorage.save).toHaveBeenCalledWith("users", expect.any(Array));
    });
    test("should throw error for duplicate username", () => {
      const userData = TestDataFactory.createValidUserData();
      userRepository.create(userData);
      expect(() => {
        userRepository.create(userData);
      }).toThrow("Username 'testuser' sudah digunakan");
    });
    test("should throw error for duplicate email", () => {
      const userData1 = TestDataFactory.createValidUserData({
        username: "u1",
        email: "dup@test.com",
      });
      const userData2 = TestDataFactory.createValidUserData({
        username: "u2",
        email: "dup@test.com",
      });
      userRepository.create(userData1);
      expect(() => {
        userRepository.create(userData2);
      }).toThrow("Email 'dup@test.com' sudah digunakan");
    });
    test("should handle duplicate email check case-insensitively", () => {
      const userData1 = TestDataFactory.createValidUserData({
        username: "u1",
        email: "dup@test.com",
      });
      userRepository.create(userData1);
      const userData2 = TestDataFactory.createValidUserData({
        username: "u2",
        email: "DUP@TEST.COM",
      });
      expect(userRepository.findByEmail(userData2.email)).not.toBeNull();
    });
  });

  describe("User Retrieval", () => {
    let testUser;
    beforeEach(() => {
      const userData = TestDataFactory.createValidUserData();
      testUser = userRepository.create(userData);
    });
    test("should find user by ID", () => {
      const foundUser = userRepository.findById(testUser.id);
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(testUser.id);
    });
    test("should return null for non-existent ID", () => {
      const foundUser = userRepository.findById("non-existent-id");
      expect(foundUser).toBeNull();
    });
    test("should return all users", () => {
      const userData2 = TestDataFactory.createValidUserData({
        username: "user2",
        email: "user2@example.com",
      });
      userRepository.create(userData2);
      const allUsers = userRepository.findAll();
      expect(allUsers).toHaveLength(2);
    });
    test("should find active users", () => {
      userRepository.create(
        TestDataFactory.createValidUserData({
          username: "active",
          email: "active@test.com",
        })
      );
      const u2 = userRepository.create(
        TestDataFactory.createValidUserData({
          username: "inactive",
          email: "inactive@test.com",
        })
      );
      u2.deactivate();
      const active = userRepository.findActive();
      expect(active.length).toBeGreaterThanOrEqual(2);
      expect(active.find((u) => u.username === "active")).toBeDefined();
    });
  });

  describe("Login Recording", () => {
    test("should record login timestamp for valid user", () => {
      const user = userRepository.create(TestDataFactory.createValidUserData());
      const originalLogin = user.lastLoginAt;
      const updatedUser = userRepository.recordLogin(user.id);
      expect(updatedUser.lastLoginAt).not.toBe(originalLogin);
      expect(mockStorage.save).toHaveBeenCalled();
    });
    test("should return null/undefined for invalid user", () => {
      const result = userRepository.recordLogin("invalid-id");
      expect(result).toBeFalsy();
    });
  });

  describe("Error Handling & Persistence", () => {
    test("should log error if saving to storage fails", () => {
      mockStorage.save.mockImplementation(() => {
        throw new Error("Save Error");
      });
      const user = TestDataFactory.createValidUserData();
      userRepository.create(user);
      expect(console.error).toHaveBeenCalledWith(
        "Error menyimpan users ke storage:",
        expect.any(Error)
      );
    });
    test("should handle errors when loading users from storage", () => {
      mockStorage.load.mockImplementation(() => {
        throw new Error("Load Error");
      });
      new UserRepository(mockStorage);
      expect(console.error).toHaveBeenCalledWith(
        "Error memuat users dari storage:",
        expect.any(Error)
      );
    });
    test("should handle corrupt user data in storage gracefully", () => {
      const validUser = TestDataFactory.createValidUserData({ id: "valid" });
      mockStorage.load.mockReturnValue([validUser, null]);
      new UserRepository(mockStorage);
      expect(console.error).toHaveBeenCalledWith(
        "Gagal memuat user:",
        null,
        expect.any(Error)
      );
    });
  });
});
