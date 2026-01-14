// Import dependencies
const TestDataFactory = require("../helpers/TestDataFactory");
const TestAssertions = require("../helpers/TestAssertions");

// Import class yang akan di-test
const User = require("../../src/models/User");

describe("User Model", () => {
  describe("User Creation", () => {
    test("should create user with valid data", () => {
      // Arrange
      const userData = TestDataFactory.createValidUserData();

      // Act
      const user = new User(
        userData.username,
        userData.email,
        userData.fullName
      );

      // Assert
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.fullName).toBe(userData.fullName);
      expect(user.isActive).toBe(true);
      TestAssertions.assertUserHasRequiredProperties(user);
    });

    test("should throw error when username is empty", () => {
      const userData = TestDataFactory.createValidUserData({ username: "" });
      expect(() => {
        new User(userData.username, userData.email, userData.fullName);
      }).toThrow("Username wajib diisi");
    });

    test("should throw error when email is invalid", () => {
      const userData = TestDataFactory.createValidUserData({
        email: "invalid-email",
      });
      expect(() => {
        new User(userData.username, userData.email, userData.fullName);
      }).toThrow("Email tidak valid");
    });

    test("should generate unique ID for each user", () => {
      const userData1 = TestDataFactory.createValidUserData({
        username: "user1",
      });
      const userData2 = TestDataFactory.createValidUserData({
        username: "user2",
      });

      const user1 = new User(
        userData1.username,
        userData1.email,
        userData1.fullName
      );
      const user2 = new User(
        userData2.username,
        userData2.email,
        userData2.fullName
      );

      expect(user1.id).toBeDefined();
      expect(user2.id).toBeDefined();
      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe("User Methods", () => {
    let user;

    beforeEach(() => {
      const userData = TestDataFactory.createValidUserData();
      user = new User(userData.username, userData.email, userData.fullName);
    });

    test("should update profile successfully", () => {
      const newFullName = "Updated Name";
      const newEmail = "updated@example.com";

      user.updateProfile(newFullName, newEmail);

      expect(user.fullName).toBe(newFullName);
      expect(user.email).toBe(newEmail);
    });

    test("should record login time", () => {
      const beforeLogin = new Date();
      user.recordLogin();

      expect(user.lastLoginAt).toBeDefined();
      expect(user.lastLoginAt).toBeInstanceOf(Date);
      expect(user.lastLoginAt.getTime()).toBeGreaterThanOrEqual(
        beforeLogin.getTime()
      );
    });

    test("should deactivate user", () => {
      user.deactivate();
      expect(user.isActive).toBe(false);
    });
  });
});
