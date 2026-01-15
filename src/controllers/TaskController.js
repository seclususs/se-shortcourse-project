class TaskController {
  /**
   * Membuat instance TaskController.
   * @constructor
   * @param {TaskService} taskService - Service tugas.
   * @param {UserController} userController - Controller pengguna.
   */
  constructor(taskService, userController) {
    this.taskService = taskService;
    this.userController = userController;
  }

  /**
   * Mendapatkan pengguna yang sedang login dari UserController.
   * @returns {User|null} User objek atau null.
   */
  get currentUser() {
    const res = this.userController.getCurrentUser();
    return res.success ? res.data : null;
  }

  /**
   * Membuat tugas baru.
   * @param {Object} taskData - Data tugas.
   * @returns {Object} Response success/error.
   */
  createTask(taskData) {
    try {
      const task = this.taskService.createTask(taskData, this.currentUser);
      return { success: true, data: task, message: "Tugas berhasil dibuat" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan daftar tugas.
   * @param {Object} filters - Filter.
   * @returns {Object} Response dengan data tasks.
   */
  getTasks(filters = {}) {
    try {
      const result = this.taskService.getTasks(filters, this.currentUser);
      return { success: true, data: result.tasks, count: result.count };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Menambahkan komentar pada tugas.
   * @param {string} taskId - ID tugas.
   * @param {string} text - Isi komentar.
   * @returns {Object} Response success/error.
   */
  addComment(taskId, text) {
    try {
      const task = this.taskService.addComment(taskId, text, this.currentUser);
      return {
        success: true,
        data: task.comments,
        message: "Komentar ditambahkan",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Membagikan tugas dengan user lain.
   * @param {string} taskId - ID tugas.
   * @param {string} targetUsername - Username tujuan.
   * @returns {Object} Response success/error.
   */
  shareTask(taskId, targetUsername) {
    try {
      const result = this.taskService.shareTask(
        taskId,
        targetUsername,
        this.currentUser
      );
      return {
        success: true,
        message: `Tugas dibagikan ke ${result.targetUser.username}`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan detail tugas.
   * @param {string} taskId - ID tugas.
   * @returns {Object} Response dengan data task.
   */
  getTaskDetails(taskId) {
    try {
      const task = this.taskService.getTaskDetails(taskId, this.currentUser);
      return { success: true, data: task };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan tugas berdasarkan kategori.
   * @param {string} category - Kategori.
   * @returns {Object} Response dengan data tasks.
   */
  getTasksByCategory(category) {
    try {
      if (!this.currentUser)
        return { success: false, error: "User harus login" };
      const result = this.taskService.getTasks({ category }, this.currentUser);
      return {
        success: true,
        data: result.tasks,
        count: result.count,
        category: category,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan statistik kategori.
   * @returns {Object} Response statistik.
   */
  getCategoryStats() {
    try {
      if (!this.currentUser)
        return { success: false, error: "User harus login" };
      const stats = this.taskService.taskRepository.getCategoryStats(
        this.currentUser.id
      );
      return { success: true, data: { byCategory: stats } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mengubah status tugas.
   * @param {string} taskId - ID tugas.
   * @returns {Object} Response success/error.
   */
  toggleTaskStatus(taskId) {
    try {
      const result = this.taskService.toggleTaskStatus(
        taskId,
        this.currentUser
      );
      return {
        success: true,
        data: result.updatedTask,
        message: `Status diperbarui: ${result.newStatus}`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Menghapus tugas.
   * @param {string} taskId - ID tugas.
   * @returns {Object} Response success/error.
   */
  deleteTask(taskId) {
    try {
      this.taskService.deleteTask(taskId, this.currentUser);
      return { success: true, message: "Tugas berhasil dihapus" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mencari tugas.
   * @param {string} query - Kata kunci.
   * @returns {Object} Response hasil pencarian.
   */
  searchTasks(query) {
    try {
      const userResults = this.taskService.searchTasks(query, this.currentUser);
      return { success: true, data: userResults };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan statistik tugas.
   * @returns {Object} Response statistik.
   */
  getTaskStats() {
    try {
      const stats = this.taskService.getTaskStats(this.currentUser);
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan tugas yang segera jatuh tempo.
   * @returns {Object} Response tugas due soon.
   */
  getTasksDueSoon() {
    try {
      const tasks = this.taskService.getTasksDueSoon(this.currentUser);
      return { success: true, data: tasks, count: tasks.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan tugas yang terlambat.
   * @returns {Object} Response tugas overdue.
   */
  getOverdueTasks() {
    try {
      const tasks = this.taskService.getOverdueTasks(this.currentUser);
      return { success: true, data: tasks, count: tasks.length };
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
