const TestDataFactory = require("../helpers/TestDataFactory");
// const TestAssertions = require('../helpers/TestAssertions');
const TaskRepository = require("../../src/repositories/TaskRepository");
const EnhancedTask = require("../../src/models/EnhancedTask");

describe("TaskRepository", () => {
  let taskRepository;
  let mockStorage;

  beforeEach(() => {
    mockStorage = TestDataFactory.createMockStorage();
    taskRepository = new TaskRepository(mockStorage);
  });

  describe("Task Creation", () => {
    test("should create task successfully", () => {
      const taskData = TestDataFactory.createValidTaskData();
      const task = taskRepository.create(taskData);
      expect(task).toBeInstanceOf(EnhancedTask);
      expect(task.title).toBe(taskData.title);
      expect(task.id).toBeDefined();
      expect(mockStorage.save).toHaveBeenCalledWith("tasks", expect.any(Array));
    });
  });

  describe("Task Retrieval", () => {
    let createdTask;

    beforeEach(() => {
      const taskData = TestDataFactory.createValidTaskData();
      createdTask = taskRepository.create(taskData);
    });

    test("should find task by ID", () => {
      const found = taskRepository.findById(createdTask.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(createdTask.id);
    });

    test("should return null if ID not found", () => {
      const found = taskRepository.findById("invalid-id");
      expect(found).toBeNull();
    });

    test("should find all tasks", () => {
      taskRepository.create(
        TestDataFactory.createValidTaskData({ title: "Task 2" })
      );
      const tasks = taskRepository.findAll();
      expect(tasks).toHaveLength(2);
    });

    test("should filter tasks by ownerId", () => {
      taskRepository.create(
        TestDataFactory.createValidTaskData({
          title: "Other Task",
          ownerId: "other-user",
        })
      );
      const myTasks = taskRepository.filter({ ownerId: createdTask.ownerId });
      expect(myTasks).toHaveLength(1);
      expect(myTasks[0].ownerId).toBe(createdTask.ownerId);
    });
  });

  describe("Task Update", () => {
    let createdTask;

    beforeEach(() => {
      createdTask = taskRepository.create(
        TestDataFactory.createValidTaskData()
      );
    });

    test("should update task details", () => {
      const updates = { title: "Updated Title", priority: "high" };
      const updatedTask = taskRepository.update(createdTask.id, updates);
      expect(updatedTask.title).toBe("Updated Title");
      expect(updatedTask.priority).toBe("high");
      expect(mockStorage.save).toHaveBeenCalled();
    });

    test("should return null when updating non-existent task", () => {
      const result = taskRepository.update("fake-id", { title: "New" });
      expect(result).toBeNull();
    });
  });

  describe("Task Deletion", () => {
    let createdTask;

    beforeEach(() => {
      createdTask = taskRepository.create(
        TestDataFactory.createValidTaskData()
      );
    });

    test("should delete task successfully", () => {
      const result = taskRepository.delete(createdTask.id);
      expect(result).toBe(true);
      expect(taskRepository.findById(createdTask.id)).toBeNull();
    });

    test("should return false when deleting non-existent task", () => {
      const result = taskRepository.delete("fake-id");
      expect(result).toBe(false);
    });
  });

  describe("Advanced Features", () => {
    test("should search tasks by keyword", () => {
      taskRepository.create(
        TestDataFactory.createValidTaskData({ title: "Belajar Coding" })
      );
      taskRepository.create(
        TestDataFactory.createValidTaskData({ title: "Belajar Masak" })
      );
      taskRepository.create(
        TestDataFactory.createValidTaskData({ title: "Tidur" })
      );
      const results = taskRepository.search("Belajar");
      expect(results).toHaveLength(2);
    });

    test("should get statistics", () => {
      taskRepository.create(
        TestDataFactory.createValidTaskData({ status: "completed" })
      );
      taskRepository.create(
        TestDataFactory.createValidTaskData({ status: "pending" })
      );
      const stats = taskRepository.getStats();
      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.byStatus.pending).toBe(1);
    });
  });
});
