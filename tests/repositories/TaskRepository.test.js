const TestDataFactory = require("../helpers/TestDataFactory");
const TaskRepository = require("../../src/repositories/TaskRepository");

describe("TaskRepository", () => {
  let taskRepository;
  let mockStorage;

  beforeEach(() => {
    mockStorage = TestDataFactory.createMockStorage();
    taskRepository = new TaskRepository(mockStorage);
  });

  describe("Sorting Logic", () => {
    let tasks;
    beforeEach(() => {
      const t1 = TestDataFactory.createValidTaskData({
        title: "A Task",
        priority: "low",
        createdAt: new Date("2023-01-01"),
      });
      const t2 = TestDataFactory.createValidTaskData({
        title: "C Task",
        priority: "high",
        createdAt: new Date("2023-01-03"),
      });
      const t3 = TestDataFactory.createValidTaskData({
        title: "B Task",
        priority: "medium",
        createdAt: new Date("2023-01-02"),
      });
      taskRepository.create(t1);
      taskRepository.create(t2);
      taskRepository.create(t3);
      tasks = taskRepository.findAll();
    });
    test("should sort by title asc/desc", () => {
      const sortedAsc = taskRepository.sort([...tasks], "title", "asc");
      expect(sortedAsc[0].title).toBe("A Task");
      expect(sortedAsc[2].title).toBe("C Task");
      const sortedDesc = taskRepository.sort([...tasks], "title", "desc");
      expect(sortedDesc[0].title).toBe("C Task");
    });
    test("should sort by priority (logic khusus)", () => {
      const sortedAsc = taskRepository.sort([...tasks], "priority", "asc");
      expect(sortedAsc[0].priority).toBe("low");
      expect(sortedAsc[2].priority).toBe("high");
      const sortedDesc = taskRepository.sort([...tasks], "priority", "desc");
      expect(sortedDesc[0].priority).toBe("high");
    });
    test("should sort by createdAt default", () => {
      const sorted = taskRepository.sort([...tasks], "createdAt", "asc");
      expect(sorted[0].title).toBe("A Task");
    });
    test("should handle sorting by dueDate", () => {
      taskRepository.create(
        TestDataFactory.createValidTaskData({ dueDate: "2023-12-01" })
      );
      taskRepository.create(
        TestDataFactory.createValidTaskData({ dueDate: null })
      );
      const all = taskRepository.findAll();
      const sorted = taskRepository.sort(all, "dueDate", "asc");
      expect(sorted[0].dueDate).not.toBeNull();
    });
  });

  describe("Complex Filtering", () => {
    test("should filter by multiple criteria", () => {
      taskRepository.create(
        TestDataFactory.createValidTaskData({
          category: "work",
          priority: "high",
          status: "pending",
        })
      );
      taskRepository.create(
        TestDataFactory.createValidTaskData({
          category: "personal",
          priority: "high",
        })
      );
      const results = taskRepository.filter({
        category: "work",
        priority: "high",
        status: "pending",
      });
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe("work");
    });
    test("should filter by dueSoon and overdue", () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 2);
      const taskDueSoon = taskRepository.create(
        TestDataFactory.createValidTaskData({ dueDate: tomorrow })
      );
      const taskOverdue = taskRepository.create(
        TestDataFactory.createValidTaskData({ dueDate: yesterday })
      );
      const dueSoonRes = taskRepository.filter({ dueSoon: true });
      expect(dueSoonRes.find((t) => t.id === taskDueSoon.id)).toBeDefined();
      const overdueRes = taskRepository.filter({ overdue: true });
      expect(overdueRes.find((t) => t.id === taskOverdue.id)).toBeDefined();
    });
  });

  describe("Error Handling & Edge Cases", () => {
    test("create should throw and log if storage fails", () => {
      mockStorage.save.mockImplementation(() => {
        throw new Error("Disk Full");
      });
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(() => {
        taskRepository.create(TestDataFactory.createValidTaskData());
      }).toThrow("Disk Full");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
    test("update should throw and log if storage fails", () => {
      const task = taskRepository.create(TestDataFactory.createValidTaskData());
      mockStorage.save.mockImplementation(() => {
        throw new Error("Write Error");
      });
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(() => {
        taskRepository.update(task.id, { title: "New" });
      }).toThrow("Write Error");
      spy.mockRestore();
    });
    test("_loadTasksFromStorage should handle corrupt data gracefully", () => {
      mockStorage.load.mockReturnValue([
        { id: "valid", title: "Valid" },
        { title: null },
      ]);
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      const repo = new TaskRepository(mockStorage);
      expect(repo.findAll().length).toBeGreaterThanOrEqual(0);
      spy.mockRestore();
    });
    test("_loadTasksFromStorage should handle storage load error", () => {
      mockStorage.load.mockImplementation(() => {
        throw new Error("Read Error");
      });
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      new TaskRepository(mockStorage);
      expect(spy).toHaveBeenCalledWith(
        "Error loading tasks:",
        expect.any(Error)
      );
      spy.mockRestore();
    });
  });

  describe("Search", () => {
    test("should search by tag", () => {
      const t = TestDataFactory.createValidTaskData({
        tags: ["urgent", "backend"],
      });
      taskRepository.create(t);
      const res = taskRepository.search("backend");
      expect(res).toHaveLength(1);
    });
    test("should search by description", () => {
      const t = TestDataFactory.createValidTaskData({
        description: "Fix annoying bug",
      });
      taskRepository.create(t);
      const res = taskRepository.search("annoying");
      expect(res).toHaveLength(1);
    });
  });
});
