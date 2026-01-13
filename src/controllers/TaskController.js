/**
 * Task Controller - Pengendali alur kerja manajemen tugas.
 * @class TaskController
 * @description Menghubungkan input pengguna dengan logika bisnis tugas, memastikan otentikasi, dan memvalidasi izin akses.
 */
class TaskController {
  /**
   * @param {TaskRepository} taskRepository - Repository tugas.
   * @param {UserRepository} userRepository - Repository pengguna.
   */
  constructor(taskRepository, userRepository) {
    this.taskRepository = taskRepository;
    this.userRepository = userRepository;
    this.currentUser = null;
  }

  /**
   * Mengatur konteks pengguna saat ini.
   * @param {string} userId - ID pengguna yang login.
   * @throws {Error} Jika pengguna tidak ditemukan.
   */
  setCurrentUser(userId) {
    this.currentUser = this.userRepository.findById(userId);
    if (!this.currentUser) {
      throw new Error("User konteks tidak ditemukan");
    }
  }

  /**
   * Membuat tugas baru.
   * @param {Object} taskData - Data tugas (judul, deskripsi, dll).
   * @returns {Object} Respon { success, data: Task, message } atau error.
   */
  createTask(taskData) {
    try {
      if (!this.currentUser) {
        return { success: false, error: "Silakan login terlebih dahulu" };
      }
      if (!taskData.title || taskData.title.trim() === "") {
        return { success: false, error: "Judul tugas wajib diisi" };
      }
      const taskToCreate = {
        ...taskData,
        ownerId: this.currentUser.id,
        assigneeId: taskData.assigneeId || this.currentUser.id,
      };
      if (taskToCreate.assigneeId !== this.currentUser.id) {
        const assignee = this.userRepository.findById(taskToCreate.assigneeId);
        if (!assignee) {
          return {
            success: false,
            error: "Pengguna yang ditugaskan tidak ditemukan",
          };
        }
      }
      const task = this.taskRepository.create(taskToCreate);
      return {
        success: true,
        data: task,
        message: `Tugas "${task.title}" berhasil dibuat`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mengambil daftar tugas berdasarkan filter.
   * @param {Object} filters - Kriteria penyaringan.
   * @returns {Object} Respon berisi daftar tugas dan jumlahnya.
   */
  getTasks(filters = {}) {
    try {
      if (!this.currentUser) {
        return { success: false, error: "Silakan login terlebih dahulu" };
      }
      const userFilters = {
        ...filters,
        ownerId: this.currentUser.id,
      };
      let tasks = this.taskRepository.filter(userFilters);
      const sortBy = filters.sortBy || "createdAt";
      const sortOrder = filters.sortOrder || "desc";
      tasks = this.taskRepository.sort(tasks, sortBy, sortOrder);
      return { success: true, data: tasks, count: tasks.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mengubah status penyelesaian tugas (toggle).
   * @param {string} taskId - ID tugas.
   * @returns {Object} Respon dengan tugas yang diperbarui.
   */
  toggleTaskStatus(taskId) {
    try {
      const task = this.taskRepository.findById(taskId);
      if (!task) return { success: false, error: "Tugas tidak ditemukan" };
      if (
        task.ownerId !== this.currentUser.id &&
        task.assigneeId !== this.currentUser.id
      ) {
        return {
          success: false,
          error: "Anda tidak memiliki akses ke tugas ini",
        };
      }
      const newStatus = task.isCompleted ? "pending" : "completed";
      const updatedTask = this.taskRepository.update(taskId, {
        status: newStatus,
      });
      return {
        success: true,
        data: updatedTask,
        message: `Status tugas diperbarui menjadi: ${newStatus}`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Menghapus tugas secara permanen.
   * @param {string} taskId - ID tugas.
   * @returns {Object} Respon status penghapusan.
   */
  deleteTask(taskId) {
    try {
      if (!this.currentUser)
        return { success: false, error: "Login diperlukan" };
      const task = this.taskRepository.findById(taskId);
      if (!task) return { success: false, error: "Tugas tidak ditemukan" };
      if (task.ownerId !== this.currentUser.id) {
        return {
          success: false,
          error: "Hanya pemilik yang dapat menghapus tugas",
        };
      }
      const deleted = this.taskRepository.delete(taskId);
      if (deleted) {
        return { success: true, message: "Tugas berhasil dihapus" };
      } else {
        return { success: false, error: "Gagal menghapus tugas" };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mencari tugas berdasarkan kata kunci.
   * @param {string} query - Kata kunci pencarian.
   * @returns {Object} Respon berisi hasil pencarian.
   */
  searchTasks(query) {
    try {
      if (!this.currentUser)
        return { success: false, error: "Login diperlukan" };
      if (!query || query.trim() === "")
        return { success: false, error: "Query kosong" };
      const allResults = this.taskRepository.search(query);
      const userResults = allResults.filter(
        (task) =>
          task.ownerId === this.currentUser.id ||
          task.assigneeId === this.currentUser.id
      );
      return { success: true, data: userResults };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan statistik tugas untuk pengguna saat ini.
   * @returns {Object} Respon data statistik.
   */
  getTaskStats() {
    try {
      if (!this.currentUser)
        return { success: false, error: "Login diperlukan" };
      const stats = this.taskRepository.getStats(this.currentUser.id);
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan tugas yang akan segera jatuh tempo (dalam 3 hari).
   * @returns {Object} Respon daftar tugas.
   */
  getTasksDueSoon() {
    try {
      if (!this.currentUser)
        return { success: false, error: "Login diperlukan" };

      // Logika 3 hari sudah ditangani oleh repository.filter({ dueSoon: true })
      const tasks = this.taskRepository.filter({ dueSoon: true });
      const userTasks = tasks.filter(
        (task) => task.ownerId === this.currentUser.id
      );
      return { success: true, data: userTasks, count: userTasks.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan tugas yang sudah melewati batas waktu.
   * @returns {Object} Respon daftar tugas terlambat.
   */
  getOverdueTasks() {
    try {
      if (!this.currentUser)
        return { success: false, error: "Login diperlukan" };
      const tasks = this.taskRepository.filter({ overdue: true });
      const userTasks = tasks.filter(
        (task) => task.ownerId === this.currentUser.id
      );
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
