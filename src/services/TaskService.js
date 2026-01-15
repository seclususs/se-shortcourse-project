class TaskService {
  constructor(taskRepository, userRepository) {
    this.taskRepository = taskRepository;
    this.userRepository = userRepository;
  }

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

  getTaskStats(currentUser) {
    if (!currentUser) throw new Error("Login diperlukan");
    const stats = this.taskRepository.getStats(currentUser.id);
    return stats;
  }

  getTasksDueSoon(currentUser) {
    if (!currentUser) throw new Error("Login diperlukan");
    const tasks = this.taskRepository.filter({ dueSoon: true });
    const userTasks = tasks.filter((task) => task.ownerId === currentUser.id);
    return userTasks;
  }

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
