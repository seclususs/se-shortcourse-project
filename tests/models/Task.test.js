const Task = require("../../src/models/Task");
const TestDataFactory = require("../helpers/TestDataFactory");

describe("Task", () => {
  let task;
  const baseData = TestDataFactory.createValidTaskData();

  beforeEach(() => {
    task = new Task(baseData.title, baseData.description, baseData.ownerId);
  });

  describe("Time Management & Progress", () => {
    test("should handle estimated and actual hours", () => {
      task.setEstimatedHours(10);
      expect(task.estimatedHours).toBe(10);
      task.setActualHours(2);
      expect(task.actualHours).toBe(2);
      expect(task.progressPercentage).toBe(20);
      task.addTimeSpent(3);
      expect(task.actualHours).toBe(5);
      expect(task.progressPercentage).toBe(50);
    });
    test("should return 0 progress if estimated hours is 0", () => {
      task.setEstimatedHours(0);
      task.setActualHours(5);
      expect(task.progressPercentage).toBe(0);
    });
    test("should return 100% progress if completed", () => {
      task.setEstimatedHours(10);
      task.setActualHours(2);
      task.markComplete();
      expect(task.progress).toBe(100);
    });
    test("should throw error for negative hours", () => {
      expect(() => task.setEstimatedHours(-1)).toThrow();
      expect(() => task.setActualHours(-5)).toThrow();
      expect(() => task.addTimeSpent(-1)).toThrow();
    });
  });

  describe("Notes Management", () => {
    test("should add and remove notes", () => {
      expect(task.notes).toHaveLength(0);
      task.addNote("Catatan penting", "Budi");
      expect(task.notes).toHaveLength(1);
      expect(task.notes[0].content).toBe("Catatan penting");
      expect(task.notes[0].author).toBe("Budi");
      const noteId = task.notes[0].id;
      task.removeNote(noteId);
      expect(task.notes).toHaveLength(0);
    });
    test("should throw error for invalid note content", () => {
      expect(() => task.addNote("", "Author")).toThrow();
    });
  });

  describe("Dependency Management", () => {
    test("should manage dependencies", () => {
      const dependencyId = "task_999";
      task.addDependency(dependencyId);
      expect(task.dependencies).toContain(dependencyId);
      expect(task.hasDependency(dependencyId)).toBe(true);
      task.removeDependency(dependencyId);
      expect(task.hasDependency(dependencyId)).toBe(false);
    });
    test("should prevent self-dependency", () => {
      expect(() => task.addDependency(task.id)).toThrow(
        "Task cannot depend on itself"
      );
    });
  });

  describe("Category and Priority Updates", () => {
    test("should update category", () => {
      task.setCategory("work");
      expect(task.category).toBe("work");
      task.setCategory("invalid_category_name");
      expect(task.category).toBe("personal");
    });
    test("should update priority", () => {
      task.updatePriority("high");
      expect(task.priority).toBe("high");
      task.updatePriority("super_critical");
      expect(task.priority).toBe("medium");
    });
  });

  describe("Assignment and Due Dates", () => {
    test("should assign and reassign", () => {
      task.assignTo("user_456");
      expect(task.assigneeId).toBe("user_456");
      task.reassignToOwner();
      expect(task.assigneeId).toBe(baseData.ownerId);
    });
    test("should handle due dates", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      task.setDueDate(tomorrow);
      expect(task.daysUntilDue).toBeGreaterThan(0);
      task.clearDueDate();
      expect(task.dueDate).toBeNull();
      expect(task.daysUntilDue).toBeNull();
    });
    test("should throw on invalid assignTo", () => {
      expect(() => task.assignTo(null)).toThrow();
    });
  });

  describe("Toggling and Status", () => {
    test("should toggle complete status", () => {
      task.markIncomplete();
      expect(task.isCompleted).toBe(false);
      task.toggleComplete();
      expect(task.isCompleted).toBe(true);
      task.toggleComplete();
      expect(task.isCompleted).toBe(false);
    });
  });

  describe("Cloning", () => {
    test("should create an exact copy with different ID", () => {
      task.updateTitle("Original");
      task.setEstimatedHours(5);
      task.addTag("clone-me");
      const clone = task.clone();
      expect(clone.id).not.toBe(task.id);
      expect(clone.title).toBe(task.title);
      expect(clone.estimatedHours).toBe(task.estimatedHours);
      expect(clone.tags).toContain("clone-me");
      task.removeTag("clone-me");
      expect(clone.tags).toContain("clone-me");
    });
  });
});
