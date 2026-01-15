const UserController = require("../../src/controllers/UserController");
const TestDataFactory = require("../helpers/TestDataFactory");

describe("UserController", () => {
  let userController;
  let mockUserService;

  beforeEach(() => {
    mockUserService = {
      register: jest.fn(),
      login: jest.fn(),
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      logout: jest.fn(),
    };
    userController = new UserController(mockUserService);
  });

  describe("register", () => {
    test("success", () => {
      const user = TestDataFactory.createValidUserData({ username: "test" });
      mockUserService.register.mockReturnValue(user);
      const res = userController.register({});
      expect(res.success).toBe(true);
      expect(res.message).toContain("berhasil");
      expect(res.data).toEqual(user);
    });
    test("failure", () => {
      mockUserService.register.mockImplementation(() => {
        throw new Error("Err");
      });
      const res = userController.register({});
      expect(res.success).toBe(false);
      expect(res.error).toBe("Err");
    });
  });

  describe("login", () => {
    test("success", () => {
      const user = TestDataFactory.createValidUserData({
        username: "test",
        fullName: "Test User",
      });
      mockUserService.login.mockReturnValue(user);
      const res = userController.login("test");
      expect(res.success).toBe(true);
      expect(userController.currentUser).toBe(user);
    });
    test("failure", () => {
      mockUserService.login.mockImplementation(() => {
        throw new Error("Login Fail");
      });
      const res = userController.login("test");
      expect(res.success).toBe(false);
      expect(userController.currentUser).toBeNull();
    });
  });

  describe("logout", () => {
    test("should clear current user", () => {
      userController.currentUser = TestDataFactory.createValidUserData({
        username: "test",
      });
      const res = userController.logout();
      expect(res.success).toBe(true);
      expect(userController.currentUser).toBeNull();
    });
    test("should handle logout when no user logged in", () => {
      const res = userController.logout();
      expect(res.success).toBe(true);
    });
  });

  describe("getCurrentUser", () => {
    test("should return user if logged in", () => {
      const user = TestDataFactory.createValidUserData({ id: "u1" });
      userController.currentUser = user;
      const res = userController.getCurrentUser();
      expect(res.success).toBe(true);
      expect(res.data).toBe(user);
    });
    test("should fail if not logged in", () => {
      const res = userController.getCurrentUser();
      expect(res.success).toBe(false);
    });
  });

  describe("getAllUsers", () => {
    test("fail if not logged in", () => {
      const res = userController.getAllUsers();
      expect(res.success).toBe(false);
      expect(res.error).toContain("login");
    });
    test("success mapping data", () => {
      userController.currentUser = TestDataFactory.createValidUserData({
        id: "u1",
      });
      const mockUsers = [
        TestDataFactory.createValidUserData({
          id: "u1",
          username: "a",
          fullName: "A",
        }),
      ];
      mockUsers[0].secret = "hidden";
      mockUserService.getAllUsers.mockReturnValue(mockUsers);
      const res = userController.getAllUsers();
      expect(res.success).toBe(true);
      expect(res.data[0]).not.toHaveProperty("secret");
      expect(res.data[0]).toHaveProperty("username");
      expect(res.data[0].username).toBe("a");
    });
    test("handle service error", () => {
      userController.currentUser = { id: 1 };
      mockUserService.getAllUsers.mockImplementation(() => {
        throw new Error("Ops");
      });
      const res = userController.getAllUsers();
      expect(res.success).toBe(false);
    });
  });

  describe("getUserById", () => {
    test("success", () => {
      const user = TestDataFactory.createValidUserData({
        id: "u1",
        username: "u",
      });
      mockUserService.getUserById.mockReturnValue(user);
      const res = userController.getUserById("u1");
      expect(res.success).toBe(true);
      expect(res.data.username).toBe("u");
    });
    test("failure", () => {
      mockUserService.getUserById.mockImplementation(() => {
        throw new Error("404");
      });
      const res = userController.getUserById(1);
      expect(res.success).toBe(false);
    });
  });
});
