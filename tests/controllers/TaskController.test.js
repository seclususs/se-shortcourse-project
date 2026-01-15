const TestDataFactory = require("../helpers/TestDataFactory");
const TestAssertions = require("../helpers/TestAssertions");
const TaskController = require("../../src/controllers/TaskController");

describe("TaskController", () => {
  let taskController;
  let mockTaskService;
  let mockUserController;

  beforeEach(() => {
    mockTaskService = {
      createTask: jest.fn(),
      getTasks: jest.fn(),
      toggleTaskStatus: jest.fn(),
      deleteTask: jest.fn(),
      searchTasks: jest.fn(),
      getTaskStats: jest.fn(),
      getTasksDueSoon: jest.fn(),
      getOverdueTasks: jest.fn(),
    };
    mockUserController = {
      getCurrentUser: jest
        .fn()
        .mockReturnValue({ success: true, data: { id: "user1" } }),
    };
    taskController = new TaskController(mockTaskService, mockUserController);
  });

  test("createTask should handle service errors", () => {
    mockTaskService.createTask.mockImplementation(() => {
      throw new Error("Database connection failed");
    });
    const response = taskController.createTask(
      TestDataFactory.createValidTaskData()
    );
    TestAssertions.assertControllerResponse(response, false);
    expect(response.error).toBe("Database connection failed");
  });

  test("getTasks should handle service errors", () => {
    mockTaskService.getTasks.mockImplementation(() => {
      throw new Error("Service unavailable");
    });
    const response = taskController.getTasks();
    TestAssertions.assertControllerResponse(response, false);
    expect(response.error).toBe("Service unavailable");
  });

  test("toggleTaskStatus should handle service errors", () => {
    mockTaskService.toggleTaskStatus.mockImplementation(() => {
      throw new Error("Task locked");
    });
    const response = taskController.toggleTaskStatus("t1");
    TestAssertions.assertControllerResponse(response, false);
    expect(response.error).toBe("Task locked");
  });

  test("deleteTask should handle service errors", () => {
    mockTaskService.deleteTask.mockImplementation(() => {
      throw new Error("Permission denied");
    });
    const response = taskController.deleteTask("t1");
    TestAssertions.assertControllerResponse(response, false);
    expect(response.error).toBe("Permission denied");
  });

  test("searchTasks should handle service errors", () => {
    mockTaskService.searchTasks.mockImplementation(() => {
      throw new Error("Search index failed");
    });
    const response = taskController.searchTasks("query");
    TestAssertions.assertControllerResponse(response, false);
  });

  test("getTaskStats should handle service errors", () => {
    mockTaskService.getTaskStats.mockImplementation(() => {
      throw new Error("Calc failed");
    });
    const response = taskController.getTaskStats();
    TestAssertions.assertControllerResponse(response, false);
  });

  test("getTasksDueSoon should handle service errors", () => {
    mockTaskService.getTasksDueSoon.mockImplementation(() => {
      throw new Error("Date error");
    });
    const response = taskController.getTasksDueSoon();
    TestAssertions.assertControllerResponse(response, false);
  });

  test("getOverdueTasks should handle service errors", () => {
    mockTaskService.getOverdueTasks.mockImplementation(() => {
      throw new Error("Date error");
    });
    const response = taskController.getOverdueTasks();
    TestAssertions.assertControllerResponse(response, false);
  });

  test("setCurrentUser should warn about deprecation", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    taskController.setCurrentUser("u1");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
