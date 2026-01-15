class TaskService {
  /**
   * Membuat instance TaskService.
   * @constructor
   * @param {TaskRepository} taskRepository - Repository tugas.
   * @param {UserRepository} userRepository - Repository pengguna.
   */
  constructor(taskRepository, userRepository) {
    this.taskRepository = taskRepository;
    this.userRepository = userRepository;
  }

  /**
   * Membuat tugas baru.
   * @param {Object} taskData - Data tugas.
   * @param {User} currentUser - Pengguna yang sedang login.
   * @returns {Task} Tugas yang dibuat.
   * @throws {Error} Jika belum login atau validasi gagal.
   */
  createTask(taskData, currentUser) {
    if (!currentUser) {
      throw new Error("Silakan login terlebih dahulu");
    }
    if (!taskData.title || taskData.title.trim() === "") {
      throw new Error("Judul tugas wajib diisi");
    }
    const taskToCreate = {
      ...taskData,
      ownerId: currentUser.id,
      assigneeId: taskData.assigneeId || currentUser.id,
    };
    if (taskToCreate.assigneeId !== currentUser.id) {
      const assignee = this.userRepository.findById(taskToCreate.assigneeId);
      if (!assignee) {
        throw new Error("Pengguna yang ditugaskan tidak ditemukan");
      }
    }
    return this.taskRepository.create(taskToCreate);
  }

  /**
   * Mendapatkan daftar tugas berdasarkan filter.
   * @param {Object} filters - Filter pencarian.
   * @param {User} currentUser - Pengguna yang sedang login.
   * @returns {Object} Objek berisi array tasks dan count.
   * @throws {Error} Jika belum login.
   */
  getTasks(filters = {}, currentUser) {
    if (!currentUser) {
      throw new Error("Silakan login terlebih dahulu");
    }
    const userFilters = {
      ...filters,
      ownerId: currentUser.id,
    };
    let tasks = this.taskRepository.filter(userFilters);
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "desc";
    tasks = this.taskRepository.sort(tasks, sortBy, sortOrder);
    return { tasks, count: tasks.length };
  }

  /**
   * Mengubah status tugas (toggle completed/pending).
   * @param {string} taskId - ID tugas.
   * @param {User} currentUser - Pengguna yang sedang login.
   * @returns {Object} Objek berisi updatedTask dan newStatus.
   * @throws {Error} Jika tugas tidak ditemukan atau akses ditolak.
   */
  toggleTaskStatus(taskId, currentUser) {
    const task = this.taskRepository.findById(taskId);
    if (!task) throw new Error("Tugas tidak ditemukan");
    if (
      !currentUser ||
      (task.ownerId !== currentUser.id && task.assigneeId !== currentUser.id)
    ) {
      throw new Error("Anda tidak memiliki akses ke tugas ini");
    }
    const newStatus = task.isCompleted ? "pending" : "completed";
    const updatedTask = this.taskRepository.update(taskId, {
      status: newStatus,
    });
    return { updatedTask, newStatus };
  }

  /**
   * Menghapus tugas.
   * @param {string} taskId - ID tugas.
   * @param {User} currentUser - Pengguna yang sedang login.
   * @returns {boolean} True jika berhasil.
   * @throws {Error} Jika tugas tidak ditemukan atau bukan pemilik.
   */
  deleteTask(taskId, currentUser) {
    if (!currentUser) throw new Error("Login diperlukan");
    const task = this.taskRepository.findById(taskId);
    if (!task) throw new Error("Tugas tidak ditemukan");
    if (task.ownerId !== currentUser.id) {
      throw new Error("Hanya pemilik yang dapat menghapus tugas");
    }
    const deleted = this.taskRepository.delete(taskId);
    if (!deleted) {
      throw new Error("Gagal menghapus tugas");
    }
    return true;
  }

  /**
   * Mencari tugas berdasarkan query.
   * @param {string} query - Kata kunci pencarian.
   * @param {User} currentUser - Pengguna yang sedang login.
   * @returns {Task[]} Hasil pencarian yang relevan dengan user.
   * @throws {Error} Jika query kosong.
   */
  searchTasks(query, currentUser) {
    if (!currentUser) throw new Error("Login diperlukan");
    if (!query || query.trim() === "") throw new Error("Query kosong");
    const allResults = this.taskRepository.search(query);
    const userResults = allResults.filter(
      (task) =>
        task.ownerId === currentUser.id || task.assigneeId === currentUser.id
    );
    return userResults;
  }

  /**
   * Mendapatkan statistik tugas user.
   * @param {User} currentUser - Pengguna yang sedang login.
   * @returns {Object} Statistik tugas.
   */
  getTaskStats(currentUser) {
    if (!currentUser) throw new Error("Login diperlukan");
    const stats = this.taskRepository.getStats(currentUser.id);
    return stats;
  }

  /**
   * Mendapatkan tugas yang mendekati deadline (due soon).
   * @param {User} currentUser - Pengguna yang sedang login.
   * @returns {Task[]} Array tugas.
   */
  getTasksDueSoon(currentUser) {
    if (!currentUser) throw new Error("Login diperlukan");
    const tasks = this.taskRepository.filter({ dueSoon: true });
    const userTasks = tasks.filter((task) => task.ownerId === currentUser.id);
    return userTasks;
  }

  /**
   * Mendapatkan tugas yang terlambat (overdue).
   * @param {User} currentUser - Pengguna yang sedang login.
   * @returns {Task[]} Array tugas.
   */
  getOverdueTasks(currentUser) {
    if (!currentUser) throw new Error("Login diperlukan");
    const tasks = this.taskRepository.filter({ overdue: true });
    const userTasks = tasks.filter((task) => task.ownerId === currentUser.id);
    return userTasks;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = TaskService;
} else {
  window.TaskService = TaskService;
}
