class TaskController {
  constructor(taskService, userController) {
    this.taskService = taskService;
    this.userController = userController;
  }

  get currentUser() {
    const res = this.userController.getCurrentUser();
    return res.success ? res.data : null;
  }

  setCurrentUser(userId) {
    console.warn(
      `setCurrentUser(${userId}) deprecated in MVC+S, state managed by UserController`
    );
  }

  createTask(taskData) {
    try {
      const task = this.taskService.createTask(taskData, this.currentUser);
      return {
        success: true,
        data: task,
        message: `Tugas "${task.title}" berhasil dibuat`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getTasks(filters = {}) {
    try {
      const result = this.taskService.getTasks(filters, this.currentUser);
      return { success: true, data: result.tasks, count: result.count };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  toggleTaskStatus(taskId) {
    try {
      const result = this.taskService.toggleTaskStatus(
        taskId,
        this.currentUser
      );
      return {
        success: true,
        data: result.updatedTask,
        message: `Status tugas diperbarui menjadi: ${result.newStatus}`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  deleteTask(taskId) {
    try {
      this.taskService.deleteTask(taskId, this.currentUser);
      return { success: true, message: "Tugas berhasil dihapus" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  searchTasks(query) {
    try {
      const userResults = this.taskService.searchTasks(query, this.currentUser);
      return { success: true, data: userResults };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getTaskStats() {
    try {
      const stats = this.taskService.getTaskStats(this.currentUser);
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getTasksDueSoon() {
    try {
      const userTasks = this.taskService.getTasksDueSoon(this.currentUser);
      return { success: true, data: userTasks, count: userTasks.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getOverdueTasks() {
    try {
      const userTasks = this.taskService.getOverdueTasks(this.currentUser);
      return { success: true, data: userTasks, count: userTasks.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = TaskController;
} else {
  window.TaskController = TaskController;
}
