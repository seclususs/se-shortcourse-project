const TestDataFactory = require("../helpers/TestDataFactory");
const TestAssertions = require("../helpers/TestAssertions");
const EnhancedTask = require("../../src/models/EnhancedTask");

describe("EnhancedTask Model", () => {
  describe("Task Creation", () => {
    test("should create task with required properties", () => {
      const taskData = TestDataFactory.createValidTaskData();

      const task = new EnhancedTask(
        taskData.title,
        taskData.description,
        taskData.ownerId,
        {
          category: taskData.category,
          priority: taskData.priority,
        }
      );

      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.ownerId).toBe(taskData.ownerId);
      expect(task.category).toBe(taskData.category);
      expect(task.priority).toBe(taskData.priority);
      TestAssertions.assertTaskHasRequiredProperties(task);
    });

    test("should throw error when title is empty", () => {
      const taskData = TestDataFactory.createValidTaskData({ title: "" });
      expect(() => {
        new EnhancedTask(
          taskData.title,
          taskData.description,
          taskData.ownerId
        );
      }).toThrow("Judul task wajib diisi");
    });

    test("should throw error when ownerId is missing", () => {
      const taskData = TestDataFactory.createValidTaskData();
      expect(() => {
        new EnhancedTask(taskData.title, taskData.description, null);
      }).toThrow("Owner ID wajib diisi");
    });
  });

  describe("Task Properties and Computed Values", () => {
    let task;

    beforeEach(() => {
      const taskData = TestDataFactory.createValidTaskData();
      task = new EnhancedTask(
        taskData.title,
        taskData.description,
        taskData.ownerId
      );
    });

    test("should calculate isCompleted correctly", () => {
      expect(task.isCompleted).toBe(false);
      task.updateStatus("completed");
      expect(task.isCompleted).toBe(true);
    });

    test("should calculate isOverdue correctly", () => {
      // Task without due date
      expect(task.isOverdue).toBe(false);

      // Future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      task.setDueDate(futureDate);
      expect(task.isOverdue).toBe(false);

      // Past date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      task.setDueDate(pastDate);
      expect(task.isOverdue).toBe(true);

      // Completed task should not be overdue
      task.updateStatus("completed");
      expect(task.isOverdue).toBe(false);
    });
  });

  describe("Task Updates", () => {
    let task;

    beforeEach(() => {
      const taskData = TestDataFactory.createValidTaskData();
      task = new EnhancedTask(
        taskData.title,
        taskData.description,
        taskData.ownerId
      );
    });

    test("should update title successfully", () => {
      const newTitle = "Updated Task Title";
      const oldUpdatedAt = task.updatedAt;

      // Artificial delay to ensure timestamp change
      setTimeout(() => {}, 1);

      task.updateTitle(newTitle);

      expect(task.title).toBe(newTitle);
      expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime()
      );
    });

    test("should add and remove tags", () => {
      task.addTag("urgent");
      task.addTag("important");
      expect(task.tags).toContain("urgent");
      expect(task.tags).toHaveLength(2);

      task.removeTag("urgent");
      expect(task.tags).not.toContain("urgent");
      expect(task.tags).toHaveLength(1);
    });
  });
});
