if (typeof require !== "undefined" && typeof module !== "undefined") {
  if (typeof Task === "undefined") {
    global.Task = require("../models/Task");
  }
}

class TaskRepository {
  /**
   * Membuat instance TaskRepository.
   * @constructor
   * @param {StorageManager} storageManager - Instance StorageManager.
   */
  constructor(storageManager) {
    this.storage = storageManager;
    this.tasks = new Map();
    this.storageKey = "tasks";
    this._loadTasksFromStorage();
  }

  /**
   * Membuat task baru.
   * @param {Object} taskData - Data tugas.
   * @returns {Task} Tugas yang baru dibuat.
   */
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

  /**
   * Mencari task berdasarkan ID.
   * @param {string} id - ID tugas.
   * @returns {Task|null} Tugas atau null.
   */
  findById(id) {
    return this.tasks.get(id) || null;
  }

  /**
   * Mencari semua task berdasarkan owner ID.
   * @param {string} ownerId - ID pemilik.
   * @returns {Task[]} Array tugas.
   */
  findByOwner(ownerId) {
    return this.findAll().filter((task) => task.ownerId === ownerId);
  }

  /**
   * Mendapatkan semua task.
   * @returns {Task[]} Array tugas.
   */
  findAll() {
    return Array.from(this.tasks.values());
  }

  /**
   * Memperbarui task yang ada.
   * @param {string} id - ID tugas.
   * @param {Object} updates - Data perubahan.
   * @returns {Task|null} Tugas yang diperbarui atau null.
   */
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
      if (updates.tags !== undefined) {
        task.clearTags();
        if (Array.isArray(updates.tags)) {
          updates.tags.forEach((t) => task.addTag(t));
        }
      }
      this._saveTasksToStorage();
      return task;
    } catch (error) {
      console.error("Error mengupdate task:", error);
      throw error;
    }
  }

  /**
   * Menghapus task berdasarkan ID.
   * @param {string} id - ID tugas.
   * @returns {boolean} True jika berhasil dihapus.
   */
  delete(id) {
    if (this.tasks.has(id)) {
      this.tasks.delete(id);
      this._saveTasksToStorage();
      return true;
    }
    return false;
  }

  /**
   * Mencari task berdasarkan kategori.
   * @param {string} category - Nama kategori.
   * @returns {Task[]} Array tugas.
   */
  findByCategory(category) {
    return this.findAll().filter((task) => task.category === category);
  }

  /**
   * Mendapatkan statistik tugas berdasarkan kategori.
   * @param {string} [userId=null] - ID user untuk filter (opsional).
   * @returns {Object} Statistik kategori.
   */
  getCategoryStats(userId = null) {
    let tasks = userId ? this.findByOwner(userId) : this.findAll();
    const stats = {};
    const categories = Task.getAvailableCategories();
    categories.forEach((category) => {
      stats[category] = { total: 0, completed: 0, pending: 0, overdue: 0 };
    });
    tasks.forEach((task) => {
      const category = task.category;
      if (stats[category]) {
        stats[category].total++;
        if (task.isCompleted) {
          stats[category].completed++;
        } else {
          stats[category].pending++;
        }
        if (task.isOverdue) {
          stats[category].overdue++;
        }
      }
    });
    return stats;
  }

  /**
   * Mendapatkan kategori yang paling sering digunakan.
   * @param {string} [userId=null] - ID user (opsional).
   * @param {number} [limit=5] - Batas jumlah kategori.
   * @returns {Object[]} Array kategori terpopuler.
   */
  getMostUsedCategories(userId = null, limit = 5) {
    const stats = this.getCategoryStats(userId);
    return Object.entries(stats)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, limit)
      .map(([category, data]) => ({
        category,
        count: data.total,
        displayName: new Task("t", "t", "t", {
          category,
        }).getCategoryDisplayName(),
      }));
  }

  /**
   * Memfilter task berdasarkan berbagai kriteria.
   * @param {Object} filters - Kriteria filter.
   * @returns {Task[]} Array tugas hasil filter.
   */
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

  /**
   * Mengurutkan daftar task.
   * @param {Task[]} tasks - Array tugas.
   * @param {string} [sortBy="createdAt"] - Field pengurutan.
   * @param {string} [order="desc"] - Arah pengurutan (asc/desc).
   * @returns {Task[]} Array tugas terurut.
   */
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
          valueA = a.dueDate
            ? a.dueDate.getTime()
            : order === "asc"
            ? Number.MAX_SAFE_INTEGER
            : 0;
          valueB = b.dueDate
            ? b.dueDate.getTime()
            : order === "asc"
            ? Number.MAX_SAFE_INTEGER
            : 0;
          break;
        default:
          valueA = a.createdAt.getTime();
          valueB = b.createdAt.getTime();
      }
      if (order === "asc")
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    });
  }

  /**
   * Mencari task berdasarkan query string.
   * @param {string} query - Kata kunci pencarian.
   * @returns {Task[]} Array tugas yang cocok.
   */
  search(query) {
    const searchTerm = query.toLowerCase();
    return this.findAll().filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Mendapatkan statistik umum tugas.
   * @param {string} [userId=null] - ID user (opsional).
   * @returns {Object} Objek statistik.
   */
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

  /**
   * Memuat task dari storage ke memory.
   * @private
   */
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

  /**
   * Menyimpan task dari memory ke storage.
   * @private
   */
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
