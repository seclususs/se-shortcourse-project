const UserService = require("../../src/services/UserService");
const TestDataFactory = require("../helpers/TestDataFactory");

describe("UserService", () => {
  let userService;
  let mockUserRepo;

  beforeEach(() => {
    mockUserRepo = {
      create: jest.fn(),
      findByUsername: jest.fn(),
      findActive: jest.fn(),
      findById: jest.fn(),
      recordLogin: jest.fn(),
    };
    userService = new UserService(mockUserRepo);
  });

  describe("register", () => {
    test("should fail if username empty", () => {
      expect(() => userService.register({ username: "" })).toThrow(
        "Username wajib diisi"
      );
    });
    test("should fail if email empty", () => {
      expect(() =>
        userService.register({ username: "user", email: "" })
      ).toThrow("Email wajib diisi");
    });
    test("should call repo create on success", () => {
      const userData = TestDataFactory.createValidUserData();
      userService.register(userData);
      expect(mockUserRepo.create).toHaveBeenCalledWith(userData);
    });
  });

  describe("login", () => {
    test("should fail if username empty", () => {
      expect(() => userService.login("")).toThrow("Username wajib diisi");
    });
    test("should fail if user not found", () => {
      mockUserRepo.findByUsername.mockReturnValue(null);
      expect(() => userService.login("unknown")).toThrow(
        "Pengguna tidak ditemukan"
      );
    });
    test("should fail if user inactive", () => {
      mockUserRepo.findByUsername.mockReturnValue({ isActive: false });
      expect(() => userService.login("inactiveUser")).toThrow(
        "Akun tidak aktif"
      );
    });
    test("should record login on success", () => {
      const user = { id: "u1", isActive: true };
      mockUserRepo.findByUsername.mockReturnValue(user);
      const result = userService.login("valid");
      expect(mockUserRepo.recordLogin).toHaveBeenCalledWith("u1");
      expect(result).toBe(user);
    });
  });

  describe("getters", () => {
    test("getAllUsers", () => {
      userService.getAllUsers();
      expect(mockUserRepo.findActive).toHaveBeenCalled();
    });
    test("getUserById success", () => {
      const user = { id: "u1" };
      mockUserRepo.findById.mockReturnValue(user);
      expect(userService.getUserById("u1")).toBe(user);
    });
    test("getUserById fail", () => {
      mockUserRepo.findById.mockReturnValue(null);
      expect(() => userService.getUserById("inv")).toThrow(
        "User tidak ditemukan"
      );
    });
  });
});
