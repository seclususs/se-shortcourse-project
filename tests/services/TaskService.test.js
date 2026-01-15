const TaskService = require("../../src/services/TaskService");
const TestDataFactory = require("../helpers/TestDataFactory");

describe("TaskService", () => {
  let taskService;
  let mockTaskRepo;
  let mockUserRepo;
  let currentUser;

  beforeEach(() => {
    mockTaskRepo = {
      create: jest.fn(),
      filter: jest.fn(),
      sort: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      getStats: jest.fn(),
    };
    mockUserRepo = {
      findById: jest.fn(),
    };
    taskService = new TaskService(mockTaskRepo, mockUserRepo);
    currentUser = TestDataFactory.createValidUserData({
      id: "user1",
      username: "user1",
    });
  });

  describe("createTask", () => {
    test("should throw error if user not logged in", () => {
      expect(() => {
        taskService.createTask({}, null);
      }).toThrow("Silakan login terlebih dahulu");
    });
    test("should throw error if title is empty", () => {
      expect(() => {
        taskService.createTask({ title: "" }, currentUser);
      }).toThrow("Judul tugas wajib diisi");
    });
    test("should throw error if assignee not found", () => {
      const taskData = TestDataFactory.createValidTaskData({
        assigneeId: "missing_user",
      });
      mockUserRepo.findById.mockReturnValue(null);
      expect(() => {
        taskService.createTask(taskData, currentUser);
      }).toThrow("Pengguna yang ditugaskan tidak ditemukan");
    });
    test("should create task successfully", () => {
      const taskData = TestDataFactory.createValidTaskData({
        title: "Task Success",
      });
      const createdTask = { ...taskData, id: "t1" };
      mockTaskRepo.create.mockReturnValue(createdTask);
      const result = taskService.createTask(taskData, currentUser);
      expect(mockTaskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: currentUser.id,
          assigneeId: currentUser.id,
        })
      );
      expect(result.title).toBe("Task Success");
    });
  });

  describe("getTasks", () => {
    test("should throw error if not logged in", () => {
      expect(() => taskService.getTasks({}, null)).toThrow("Silakan login");
    });
    test("should filter and sort tasks", () => {
      const mockTasks = [
        TestDataFactory.createValidTaskData({ id: 1 }),
        TestDataFactory.createValidTaskData({ id: 2 }),
      ];
      mockTaskRepo.filter.mockReturnValue(mockTasks);
      mockTaskRepo.sort.mockReturnValue(mockTasks);
      const result = taskService.getTasks({ sortBy: "title" }, currentUser);
      expect(mockTaskRepo.filter).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: currentUser.id,
        })
      );
      expect(mockTaskRepo.sort).toHaveBeenCalledWith(
        mockTasks,
        "title",
        "desc"
      );
      expect(result.tasks).toHaveLength(2);
    });
  });

  describe("toggleTaskStatus", () => {
    test("should throw if task not found", () => {
      mockTaskRepo.findById.mockReturnValue(null);
      expect(() => taskService.toggleTaskStatus("inv", currentUser)).toThrow(
        "Tugas tidak ditemukan"
      );
    });
    test("should throw if user unauthorized", () => {
      const task = TestDataFactory.createValidTaskData({
        ownerId: "other",
        assigneeId: "other",
      });
      mockTaskRepo.findById.mockReturnValue(task);
      expect(() => taskService.toggleTaskStatus("t1", currentUser)).toThrow(
        "Anda tidak memiliki akses"
      );
    });
    test("should toggle status successfully", () => {
      const task = TestDataFactory.createValidTaskData({
        id: "t1",
        ownerId: currentUser.id,
        isCompleted: false,
      });
      mockTaskRepo.findById.mockReturnValue(task);
      mockTaskRepo.update.mockReturnValue({ ...task, status: "completed" });
      const result = taskService.toggleTaskStatus("t1", currentUser);
      expect(mockTaskRepo.update).toHaveBeenCalledWith("t1", {
        status: "completed",
      });
      expect(result.newStatus).toBe("completed");
    });
  });

  describe("deleteTask", () => {
    test("should throw if not owner", () => {
      const task = TestDataFactory.createValidTaskData({
        id: "t1",
        ownerId: "other",
      });
      mockTaskRepo.findById.mockReturnValue(task);
      expect(() => taskService.deleteTask("t1", currentUser)).toThrow(
        "Hanya pemilik yang dapat menghapus tugas"
      );
    });
    test("should throw if delete fails", () => {
      const task = TestDataFactory.createValidTaskData({
        id: "t1",
        ownerId: currentUser.id,
      });
      mockTaskRepo.findById.mockReturnValue(task);
      mockTaskRepo.delete.mockReturnValue(false);
      expect(() => taskService.deleteTask("t1", currentUser)).toThrow(
        "Gagal menghapus tugas"
      );
    });
  });

  describe("Other methods", () => {
    test("searchTasks should filter by user access", () => {
      mockTaskRepo.search.mockReturnValue([
        TestDataFactory.createValidTaskData({ id: 1, ownerId: currentUser.id }),
        TestDataFactory.createValidTaskData({ id: 2, ownerId: "other" }),
      ]);
      const result = taskService.searchTasks("query", currentUser);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
    test("searchTasks validation", () => {
      expect(() => taskService.searchTasks("", currentUser)).toThrow();
    });
    test("getTaskStats should delegate to repo", () => {
      taskService.getTaskStats(currentUser);
      expect(mockTaskRepo.getStats).toHaveBeenCalledWith(currentUser.id);
    });
    test("getTasksDueSoon should filter by user", () => {
      mockTaskRepo.filter.mockReturnValue([
        TestDataFactory.createValidTaskData({ id: 1, ownerId: currentUser.id }),
        TestDataFactory.createValidTaskData({ id: 2, ownerId: "other" }),
      ]);
      const res = taskService.getTasksDueSoon(currentUser);
      expect(res).toHaveLength(1);
    });
    test("getOverdueTasks should filter by user", () => {
      mockTaskRepo.filter.mockReturnValue([
        TestDataFactory.createValidTaskData({ id: 1, ownerId: currentUser.id }),
        TestDataFactory.createValidTaskData({ id: 2, ownerId: "other" }),
      ]);
      const res = taskService.getOverdueTasks(currentUser);
      expect(res).toHaveLength(1);
    });
  });
});
