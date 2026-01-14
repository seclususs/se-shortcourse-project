const TestDataFactory = require("../helpers/TestDataFactory");
const TestAssertions = require("../helpers/TestAssertions");
const TaskController = require("../../src/controllers/TaskController");
const TaskRepository = require("../../src/repositories/TaskRepository");
const UserRepository = require("../../src/repositories/UserRepository");

describe("TaskController", () => {
  let taskController;
  let taskRepository;
  let userRepository;
  let mockStorage;
  let testUser;

  beforeEach(() => {
    // Setup integration system
    mockStorage = TestDataFactory.createMockStorage();
    taskRepository = new TaskRepository(mockStorage);
    userRepository = new UserRepository(mockStorage);
    taskController = new TaskController(taskRepository, userRepository);

    // Create user & login
    const userData = TestDataFactory.createValidUserData();
    testUser = userRepository.create(userData);
    taskController.setCurrentUser(testUser.id);
  });

  describe("Task Creation", () => {
    test("should create task successfully", () => {
      const taskData = TestDataFactory.createValidTaskData();
      const response = taskController.createTask(taskData);

      TestAssertions.assertControllerResponse(response, true);
      expect(response.data.title).toBe(taskData.title);
      expect(response.data.ownerId).toBe(testUser.id);
    });

    test("should fail when user not logged in", () => {
      taskController.currentUser = null;
      const taskData = TestDataFactory.createValidTaskData();
      const response = taskController.createTask(taskData);

      TestAssertions.assertControllerResponse(response, false);
      expect(response.error).toBe("Silakan login terlebih dahulu");
    });

    test("should fail when title is empty", () => {
      const taskData = TestDataFactory.createValidTaskData({ title: "" });
      const response = taskController.createTask(taskData);

      TestAssertions.assertControllerResponse(response, false);
      expect(response.error).toBe("Judul tugas wajib diisi");
    });
  });

  describe("Task Retrieval", () => {
    let testTask;

    beforeEach(() => {
      const taskData = TestDataFactory.createValidTaskData();
      const createResponse = taskController.createTask(taskData);
      testTask = createResponse.data;
    });

    test("should get all user tasks", () => {
      const response = taskController.getTasks();

      TestAssertions.assertControllerResponse(response, true);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].id).toBe(testTask.id);
    });

    test("should filter overdue tasks", () => {
      // Set task as overdue via repository backdoor (controller might restrict setting past due dates if logic existed)
      testTask.setDueDate(new Date("2020-01-01"));

      const response = taskController.getOverdueTasks();
      TestAssertions.assertControllerResponse(response, true);
      expect(response.data).toHaveLength(1);
    });
  });

  describe("Task Updates", () => {
    let testTask;

    beforeEach(() => {
      const taskData = TestDataFactory.createValidTaskData();
      const createResponse = taskController.createTask(taskData);
      testTask = createResponse.data;
    });

    test("should toggle task status", () => {
      expect(testTask.status).toBe("pending");

      const response = taskController.toggleTaskStatus(testTask.id);
      TestAssertions.assertControllerResponse(response, true);
      expect(response.data.status).toBe("completed");
    });

    test("should delete task successfully", () => {
      const response = taskController.deleteTask(testTask.id);
      TestAssertions.assertControllerResponse(response, true);
      expect(response.message).toContain("berhasil dihapus");

      const getResponse = taskController.getTasks();
      expect(getResponse.data).toHaveLength(0);
    });
  });
});
