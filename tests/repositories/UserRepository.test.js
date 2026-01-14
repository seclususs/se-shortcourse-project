const TestDataFactory = require("../helpers/TestDataFactory");
const TestAssertions = require("../helpers/TestAssertions");
const UserRepository = require("../../src/repositories/UserRepository");
const User = require("../../src/models/User");

describe("UserRepository", () => {
  let userRepository;
  let mockStorage;

  beforeEach(() => {
    mockStorage = TestDataFactory.createMockStorage();
    userRepository = new UserRepository(mockStorage);
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
  });
});
