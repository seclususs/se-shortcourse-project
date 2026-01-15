const TestDataFactory = require("../helpers/TestDataFactory");
const TestAssertions = require("../helpers/TestAssertions");
const User = require("../../src/models/User");

describe("User", () => {
  describe("Serialization (fromJSON)", () => {
    test("should reconstitute user from JSON correctly", () => {
      const rawData = {
        id: "user_123",
        username: "reborn_user",
        email: "reborn@test.com",
        fullName: "Reborn Identity",
        role: "admin",
        isActive: false,
        createdAt: "2023-01-01T00:00:00.000Z",
        lastLoginAt: "2023-01-02T00:00:00.000Z",
        preferences: { theme: "dark" },
      };
      const user = User.fromJSON(rawData);
      TestAssertions.assertUserHasRequiredProperties(user);
      expect(user.id).toBe(rawData.id);
      expect(user.username).toBe(rawData.username);
      expect(user.role).toBe("admin");
      expect(user.isActive).toBe(false);
      expect(user.preferences.theme).toBe("dark");
    });
    test("should handle missing optional fields in fromJSON", () => {
      const minimalData = {
        username: "min",
        email: "min@test.com",
        createdAt: "2023-01-01T00:00:00.000Z",
      };
      const user = User.fromJSON(minimalData);
      expect(user.lastLoginAt).toBeNull();
      expect(user.preferences.theme).toBe("light");
    });
  });

  describe("Validation & Updates", () => {
    let user;
    beforeEach(() => {
      const data = TestDataFactory.createValidUserData();
      user = new User(data.username, data.email, data.fullName);
    });
    test("updateProfile should throw on invalid email", () => {
      expect(() => user.updateProfile("Name", "invalid-email")).toThrow(
        "Email tidak valid"
      );
    });
    test("updateProfile should allow updating partial fields", () => {
      const oldEmail = user.email;
      user.updateProfile("New Name", null);
      expect(user.fullName).toBe("New Name");
      expect(user.email).toBe(oldEmail);
      user.updateProfile(null, "new@test.com");
      expect(user.email).toBe("new@test.com");
    });
    test("updatePreferences should merge with existing", () => {
      const defaultPrefs = user.preferences;
      user.updatePreferences({ theme: "dark" });
      expect(user.preferences.theme).toBe("dark");
      expect(user.preferences.emailNotifications).toBe(
        defaultPrefs.emailNotifications
      );
    });
    test("activate/deactivate toggle", () => {
      user.deactivate();
      expect(user.isActive).toBe(false);
      user.activate();
      expect(user.isActive).toBe(true);
    });
    test("Role getter", () => {
      expect(user.role).toBe("user");
    });
  });
});
