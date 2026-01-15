if (typeof require !== "undefined" && typeof module !== "undefined") {
  if (typeof Task === "undefined") {
    global.Task = require("../models/Task");
  }
}

class TaskRepository {
  constructor(storageManager) {
    this.storage = storageManager;
    this.tasks = new Map();
    this.storageKey = "tasks";
    this._loadTasksFromStorage();
  }

  create(taskData) {
    try {
      const task = new Task(
        taskData.title,
        taskData.description,
        taskData.ownerId,
        taskData
      );
      this.tasks.set(task.id, task);
      this._saveTasksToStorage();
      return task;
    } catch (error) {
      console.error("Error membuat task:", error);
      throw error;
    }
  }

  findById(id) {
    return this.tasks.get(id) || null;
  }

  findAll() {
    return Array.from(this.tasks.values());
  }

  update(id, updates) {
    const task = this.findById(id);
    if (!task) return null;
    try {
      if (updates.title !== undefined) task.updateTitle(updates.title);
      if (updates.description !== undefined)
        task.updateDescription(updates.description);
      if (updates.category !== undefined) task.updateCategory(updates.category);
      if (updates.priority !== undefined) task.updatePriority(updates.priority);
      if (updates.status !== undefined) task.updateStatus(updates.status);
      if (updates.dueDate !== undefined) task.setDueDate(updates.dueDate);
      if (updates.assigneeId !== undefined) task.assignTo(updates.assigneeId);
      if (updates.estimatedHours !== undefined)
        task.setEstimatedHours(updates.estimatedHours);
      this._saveTasksToStorage();
      return task;
    } catch (error) {
      console.error("Error mengupdate task:", error);
      throw error;
    }
  }

  delete(id) {
    if (this.tasks.has(id)) {
      this.tasks.delete(id);
      this._saveTasksToStorage();
      return true;
    }
    return false;
  }

  filter(filters) {
    let results = this.findAll();
    if (filters.ownerId)
      results = results.filter((task) => task.ownerId === filters.ownerId);
    if (filters.category)
      results = results.filter((task) => task.category === filters.category);
    if (filters.status)
      results = results.filter((task) => task.status === filters.status);
    if (filters.priority)
      results = results.filter((task) => task.priority === filters.priority);
    if (filters.overdue) results = results.filter((task) => task.isOverdue);
    if (filters.dueSoon) {
      results = results.filter((task) => {
        const days = task.daysUntilDue;
        return days !== null && days <= 3 && days >= 0;
      });
    }
    return results;
  }

  sort(tasks, sortBy = "createdAt", order = "desc") {
    return tasks.sort((a, b) => {
      let valueA, valueB;
      switch (sortBy) {
        case "title":
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case "priority": {
          const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
          valueA = priorityOrder[a.priority];
          valueB = priorityOrder[b.priority];
          break;
        }
        case "dueDate":
          valueA = a.dueDate || new Date("9999-12-31");
          valueB = b.dueDate || new Date("9999-12-31");
          break;
        default:
          valueA = a.createdAt;
          valueB = b.createdAt;
      }
      if (order === "asc")
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    });
  }

  search(query) {
    const searchTerm = query.toLowerCase();
    return this.findAll().filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  }

  getStats(userId = null) {
    let tasks = userId ? this.filter({ ownerId: userId }) : this.findAll();
    const stats = {
      total: tasks.length,
      byStatus: {},
      byPriority: {},
      overdue: tasks.filter((task) => task.isOverdue).length,
      dueSoon: tasks.filter((task) => {
        const days = task.daysUntilDue;
        return days !== null && days <= 3 && days >= 0;
      }).length,
      completed: tasks.filter((task) => task.isCompleted).length,
    };
    ["pending", "in-progress", "blocked", "completed"].forEach((status) => {
      stats.byStatus[status] = tasks.filter(
        (task) => task.status === status
      ).length;
    });
    return stats;
  }

  _loadTasksFromStorage() {
    try {
      const tasksData = this.storage.load(this.storageKey, []);
      tasksData.forEach((taskData) => {
        try {
          const task = Task.fromJSON(taskData);
          this.tasks.set(task.id, task);
        } catch (error) {
          console.error("Error memuat task:", error);
        }
      });
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  }

  _saveTasksToStorage() {
    try {
      const tasksData = Array.from(this.tasks.values()).map((task) =>
        task.toJSON()
      );
      this.storage.save(this.storageKey, tasksData);
    } catch (error) {
      console.error("Error saving tasks:", error);
      throw error;
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = TaskRepository;
} else {
  window.TaskRepository = TaskRepository;
}
