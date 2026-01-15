const TestDataFactory = require("../helpers/TestDataFactory");
const TestAssertions = require("../helpers/TestAssertions");
const TaskController = require("../../src/controllers/TaskController");
const UserController = require("../../src/controllers/UserController");
const TaskService = require("../../src/services/TaskService");
const UserService = require("../../src/services/UserService");
const TaskRepository = require("../../src/repositories/TaskRepository");
const UserRepository = require("../../src/repositories/UserRepository");

describe("Integrasi Alur Kerja Tugas (Task Workflow)", () => {
  let taskController;
  let userController;
  let mockStorage;

  beforeEach(() => {
    mockStorage = TestDataFactory.createMockStorage();
    const taskRepo = new TaskRepository(mockStorage);
    const userRepo = new UserRepository(mockStorage);
    const taskService = new TaskService(taskRepo, userRepo);
    const userService = new UserService(userRepo);
    userController = new UserController(userService);
    taskController = new TaskController(taskService, userController);
  });

  test("Skenario Sukses: Registrasi -> Login -> Buat Tugas -> Cari -> Selesaikan", () => {
    const userData = {
      username: "workflow_user",
      email: "flow@test.com",
      fullName: "Workflow User",
    };
    const registerRes = userController.register(userData);
    expect(registerRes.success).toBe(true);
    expect(registerRes.data.username).toBe(userData.username);
    const loginRes = userController.login(userData.username);
    expect(loginRes.success).toBe(true);
    const taskData = {
      title: "Integrasi Test Task",
      description: "Mencoba alur lengkap sistem",
      priority: "high",
      category: "work",
      estimatedHours: 4,
    };
    const createRes = taskController.createTask(taskData);
    TestAssertions.assertControllerResponse(createRes, true);
    const createdTask = createRes.data;
    expect(createdTask.ownerId).toBe(loginRes.data.id);
    expect(createdTask.status).toBe("pending");
    expect(createdTask.priority).toBe("high");
    const searchRes = taskController.searchTasks("Integrasi");
    expect(searchRes.data).toHaveLength(1);
    expect(searchRes.data[0].id).toBe(createdTask.id);
    const toggleRes = taskController.toggleTaskStatus(createdTask.id);
    TestAssertions.assertControllerResponse(toggleRes, true);
    expect(toggleRes.data.status).toBe("completed");
    expect(toggleRes.data.isCompleted).toBe(true);
    const statsRes = taskController.getTaskStats();
    expect(statsRes.data.total).toBe(1);
    expect(statsRes.data.completed).toBe(1);
    expect(statsRes.data.byStatus.pending).toBe(0);
  });

  test("Keamanan: Tidak boleh membuat tugas jika belum login", () => {
    userController.logout();
    const response = taskController.createTask({ title: "Tugas Ilegal" });
    TestAssertions.assertControllerResponse(response, false);
    expect(response.error.toLowerCase()).toMatch(/login|akses|required/);
  });
});
