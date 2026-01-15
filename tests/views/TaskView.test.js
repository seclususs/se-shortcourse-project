const TaskView = require("../../src/views/TaskView");
const TestDataFactory = require("../helpers/TestDataFactory");

const mockTaskController = {
  getTasks: jest.fn(),
  getTaskStats: jest.fn(),
  toggleTaskStatus: jest.fn(),
  deleteTask: jest.fn(),
};

const mockUserController = {
  getUserById: jest.fn(),
};

describe("TaskView", () => {
  let taskView;
  const setupDOM = () => {
    document.body.innerHTML = `
      <div id="messages"></div>
      <div id="taskStats"></div>
      <div id="taskList"></div>
      <form id="taskForm"></form>
    `;
  };

  beforeEach(() => {
    setupDOM();
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(window, "confirm").mockImplementation(() => true);
    mockTaskController.getTaskStats.mockReturnValue({
      success: true,
      data: {
        total: 0,
        byStatus: { pending: 0, completed: 0 },
        completed: 0,
        overdue: 0,
      },
    });
    taskView = new TaskView(mockTaskController, mockUserController);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("Initialization & DOM Guards", () => {
    test("should handle missing taskList", () => {
      document.body.innerHTML = "";
      const view = new TaskView(mockTaskController, mockUserController);
      view.renderTasks();
      expect(mockTaskController.getTasks).not.toHaveBeenCalled();
    });
    test("should handle missing taskStats", () => {
      document.body.innerHTML = "";
      const view = new TaskView(mockTaskController, mockUserController);
      view.renderStats();
      expect(mockTaskController.getTaskStats).not.toHaveBeenCalled();
    });
    test("should handle missing messages container", () => {
      document.body.innerHTML = "";
      const view = new TaskView(mockTaskController, mockUserController);
      view.showMessage("Test", "info");
    });
  });

  describe("Rendering Logic & Branches", () => {
    test("should handle controller error", () => {
      mockTaskController.getTasks.mockReturnValue({
        success: false,
        error: "Fetch Error",
      });
      taskView.renderTasks();
      const msg = document.getElementById("messages");
      expect(msg.textContent).toContain("Fetch Error");
    });
    test("should render empty state", () => {
      mockTaskController.getTasks.mockReturnValue({ success: true, data: [] });
      taskView.renderTasks();
      const list = document.getElementById("taskList");
      expect(list.innerHTML).toContain("Belum ada tugas");
    });
    test("should pass correct filter params to controller", () => {
      taskView.currentFilter = "completed";
      taskView.renderTasks();
      expect(mockTaskController.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" })
      );
      taskView.currentFilter = "all";
      taskView.renderTasks();
      expect(mockTaskController.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ status: undefined })
      );
    });
    test("should render task details", () => {
      const taskFull = TestDataFactory.createValidTaskData({
        id: "t1",
        title: "Full Task",
        description: "Desc Present",
        ownerId: "u1",
        assigneeId: "u2",
      });
      const taskMinimal = TestDataFactory.createValidTaskData({
        id: "t2",
        title: "Min Task",
        description: "",
        ownerId: "u1",
        assigneeId: "u1",
      });
      mockTaskController.getTasks.mockReturnValue({
        success: true,
        data: [taskFull, taskMinimal],
      });
      mockUserController.getUserById.mockReturnValue({
        success: true,
        data: { fullName: "Budi" },
      });
      taskView.renderTasks();
      const listHTML = document.getElementById("taskList").innerHTML;
      expect(listHTML).toContain("Desc Present");
      expect(listHTML).not.toContain('class="task-description">Min Task');
      expect(listHTML).toContain("Assignee: Budi");
      expect(listHTML).toContain("Assignee: Saya");
    });
    test("should escape HTML in title", () => {
      const maliciousTask = TestDataFactory.createValidTaskData({
        title: "<script>alert('xss')</script>",
      });
      mockTaskController.getTasks.mockReturnValue({
        success: true,
        data: [maliciousTask],
      });
      taskView.renderTasks();
      const list = document.getElementById("taskList").innerHTML;
      expect(list).toContain("&lt;script&gt;");
    });
  });

  describe("Stats Rendering Branches", () => {
    test("should render stats with overdue > 0", () => {
      mockTaskController.getTaskStats.mockReturnValue({
        success: true,
        data: {
          total: 10,
          byStatus: { pending: 5 },
          completed: 2,
          overdue: 3,
        },
      });
      taskView.renderStats();
      const statsEl = document.getElementById("taskStats");
      expect(statsEl.innerHTML).toContain('class="stat-item overdue"');
      expect(statsEl.textContent).toContain("3");
    });
    test("should render stats with overdue === 0", () => {
      mockTaskController.getTaskStats.mockReturnValue({
        success: true,
        data: {
          total: 5,
          byStatus: { pending: 5 },
          completed: 0,
          overdue: 0,
        },
      });
      taskView.renderStats();
      const statsEl = document.getElementById("taskStats");
      expect(statsEl.innerHTML).not.toContain('class="stat-item overdue"');
    });
  });

  describe("ShowMessage Logic", () => {
    test("should add and remove message after timeout", () => {
      taskView.showMessage("Hello", "success");
      const msgs = document.getElementById("messages");
      expect(msgs.children.length).toBe(1);
      jest.runAllTimers();
      expect(msgs.children.length).toBe(0);
    });
    test("should handle message element already removed before timeout", () => {
      taskView.showMessage("Ghost Message", "info");
      const msgs = document.getElementById("messages");
      const msgEl = msgs.children[0];
      msgEl.parentNode.removeChild(msgEl);
      jest.runAllTimers();
    });
  });

  describe("User Interactions", () => {
    const renderOneTask = () => {
      const task = TestDataFactory.createValidTaskData({ id: "t1" });
      mockTaskController.getTasks.mockReturnValue({
        success: true,
        data: [task],
      });
      taskView.renderTasks();
    };
    test("Toggle Status: Success", () => {
      renderOneTask();
      mockTaskController.toggleTaskStatus.mockReturnValue({
        success: true,
        message: "OK",
      });
      const btn = document.querySelector(".btn-toggle");
      btn.click();
      expect(mockTaskController.toggleTaskStatus).toHaveBeenCalledWith("t1");
      expect(mockTaskController.getTasks).toHaveBeenCalledTimes(2);
    });
    test("Toggle Status: Failure", () => {
      renderOneTask();
      mockTaskController.toggleTaskStatus.mockReturnValue({
        success: false,
        error: "Fail",
      });
      const btn = document.querySelector(".btn-toggle");
      btn.click();
      const msg = document.getElementById("messages");
      expect(msg.textContent).toContain("Fail");
    });
    test("Delete Task: User Cancel", () => {
      renderOneTask();
      window.confirm.mockReturnValue(false);
      const btn = document.querySelector(".btn-delete");
      btn.click();
      expect(mockTaskController.deleteTask).not.toHaveBeenCalled();
    });
    test("Delete Task: Success", () => {
      renderOneTask();
      window.confirm.mockReturnValue(true);
      mockTaskController.deleteTask.mockReturnValue({
        success: true,
        message: "Deleted",
      });
      const btn = document.querySelector(".btn-delete");
      btn.click();
      expect(mockTaskController.deleteTask).toHaveBeenCalledWith("t1");
    });
    test("Delete Task: Failure", () => {
      renderOneTask();
      window.confirm.mockReturnValue(true);
      mockTaskController.deleteTask.mockReturnValue({
        success: false,
        error: "Delete Error",
      });
      const btn = document.querySelector(".btn-delete");
      btn.click();
      const msg = document.getElementById("messages");
      expect(msg.textContent).toContain("Delete Error");
    });
  });
});
