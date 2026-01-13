/**
 * Model EnhancedTask - Representasi tugas dengan fitur lanjutan.
 * @class EnhancedTask
 * @description Mendukung multi-user, kategori, label, prioritas, status, dan pelacakan waktu.
 */
class EnhancedTask {
  /**
   * Membuat tugas baru.
   * @param {string} title - Judul tugas (wajib).
   * @param {string} description - Deskripsi tugas (opsional).
   * @param {string} ownerId - ID pengguna pemilik tugas (wajib).
   * @param {Object} options - Opsi tambahan: assigneeId, category, tags, priority, status, dueDate, estimatedHours.
   * @throws {Error} Jika judul atau ownerId kosong.
   */
  constructor(title, description, ownerId, options = {}) {
    // Validasi input wajib
    if (!title || title.trim() === "") {
      throw new Error("Judul task wajib diisi");
    }
    if (!ownerId) {
      throw new Error("Owner ID wajib diisi");
    }

    // Properti Dasar
    this._id = this._generateId();
    this._title = title.trim();
    this._description = description ? description.trim() : "";
    this._ownerId = ownerId;
    this._assigneeId = options.assigneeId || ownerId;

    // Properti Kategorisasi & Status
    this._category = this._validateCategory(options.category || "personal");
    this._tags = Array.isArray(options.tags) ? options.tags : [];
    this._priority = this._validatePriority(options.priority || "medium");
    this._status = this._validateStatus(options.status || "pending");

    // Properti Waktu
    this._dueDate = options.dueDate ? new Date(options.dueDate) : null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._completedAt = null;

    // Pelacakan
    this._estimatedHours = options.estimatedHours || 0;
    this._actualHours = 0;

    // Metadata
    this._notes = [];
    this._attachments = [];
  }

  // ==============================================================
  // Getters
  // ==============================================================
  get id() {
    return this._id;
  }
  get title() {
    return this._title;
  }
  get description() {
    return this._description;
  }
  get ownerId() {
    return this._ownerId;
  }
  get assigneeId() {
    return this._assigneeId;
  }
  get category() {
    return this._category;
  }
  get tags() {
    return [...this._tags];
  }
  get priority() {
    return this._priority;
  }
  get status() {
    return this._status;
  }
  get dueDate() {
    return this._dueDate;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }
  get completedAt() {
    return this._completedAt;
  }
  get estimatedHours() {
    return this._estimatedHours;
  }
  get actualHours() {
    return this._actualHours;
  }
  get notes() {
    return [...this._notes];
  }
  get attachments() {
    return [...this._attachments];
  }

  // ==============================================================
  // Computed Properties
  // ==============================================================

  /** @returns {boolean} True jika status tugas adalah 'completed'. */
  get isCompleted() {
    return this._status === "completed";
  }

  /** @returns {boolean} True jika tanggal sekarang melewati dueDate dan tugas belum selesai. */
  get isOverdue() {
    if (!this._dueDate || this.isCompleted) return false;
    return new Date() > this._dueDate;
  }

  /** @returns {number|null} Jumlah hari tersisa hingga deadline, atau null jika tidak ada deadline. */
  get daysUntilDue() {
    if (!this._dueDate) return null;
    const today = new Date();
    const diffTime = this._dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /** @returns {number} Persentase progres berdasarkan jam kerja (max 100). */
  get progressPercentage() {
    if (this._estimatedHours === 0) return 0;
    return Math.min(100, (this._actualHours / this._estimatedHours) * 100);
  }

  // ==============================================================
  // Public Methods
  // ==============================================================

  /**
   * Memperbarui judul tugas.
   * @param {string} newTitle - Judul baru.
   */
  updateTitle(newTitle) {
    if (!newTitle || newTitle.trim() === "") {
      throw new Error("Judul task tidak boleh kosong");
    }
    this._title = newTitle.trim();
    this._updateTimestamp();
  }

  /**
   * Memperbarui deskripsi tugas.
   * @param {string} newDescription - Deskripsi baru.
   */
  updateDescription(newDescription) {
    this._description = newDescription ? newDescription.trim() : "";
    this._updateTimestamp();
  }

  /**
   * Mengubah status tugas.
   * @param {string} newStatus - Status baru (pending/in-progress/completed/blocked/cancelled).
   */
  updateStatus(newStatus) {
    const oldStatus = this._status;
    this._status = this._validateStatus(newStatus);
    if (newStatus === "completed" && oldStatus !== "completed") {
      this._completedAt = new Date();
    } else if (newStatus !== "completed") {
      this._completedAt = null;
    }
    this._updateTimestamp();
  }

  /**
   * Menetapkan atau mengubah tenggat waktu.
   * @param {string|Date|null} dueDate - Tanggal deadline.
   */
  setDueDate(dueDate) {
    this._dueDate = dueDate ? new Date(dueDate) : null;
    this._updateTimestamp();
  }

  /**
   * Menugaskan tugas ke pengguna lain.
   * @param {string} userId - ID pengguna penerima tugas.
   */
  assignTo(userId) {
    this._assigneeId = userId;
    this._updateTimestamp();
  }

  /**
   * Menambah jam kerja aktual.
   * @param {number} hours - Jumlah jam yang ditambahkan.
   */
  addTimeSpent(hours) {
    if (hours > 0) {
      this._actualHours += hours;
      this._updateTimestamp();
    }
  }

  // ==============================================================
  // Serialization
  // ==============================================================

  /**
   * Serialisasi ke JSON.
   * @returns {Object} Representasi JSON.
   */
  toJSON() {
    return {
      id: this._id,
      title: this._title,
      description: this._description,
      ownerId: this._ownerId,
      assigneeId: this._assigneeId,
      category: this._category,
      tags: this._tags,
      priority: this._priority,
      status: this._status,
      dueDate: this._dueDate ? this._dueDate.toISOString() : null,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      completedAt: this._completedAt ? this._completedAt.toISOString() : null,
      estimatedHours: this._estimatedHours,
      actualHours: this._actualHours,
      notes: this._notes,
      attachments: this._attachments,
    };
  }

  /**
   * Factory method dari JSON.
   * @param {Object} data - Data JSON.
   * @returns {EnhancedTask} Instance task.
   */
  static fromJSON(data) {
    const task = new EnhancedTask(data.title, data.description, data.ownerId, {
      assigneeId: data.assigneeId,
      category: data.category,
      tags: data.tags,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours,
    });
    task._id = data.id;
    task._createdAt = new Date(data.createdAt);
    task._updatedAt = new Date(data.updatedAt);
    task._completedAt = data.completedAt ? new Date(data.completedAt) : null;
    task._actualHours = data.actualHours || 0;
    task._notes = data.notes || [];
    task._attachments = data.attachments || [];
    return task;
  }

  // ==============================================================
  // Private Validators & Helpers
  // ==============================================================

  _generateId() {
    return "task_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  _updateTimestamp() {
    this._updatedAt = new Date();
  }

  _validateCategory(category) {
    const validCategories = [
      "work",
      "personal",
      "study",
      "health",
      "finance",
      "other",
    ];
    if (!validCategories.includes(category)) {
      console.warn(
        `Kategori '${category}' tidak valid. Menggunakan 'personal'.`
      );
      return "personal";
    }
    return category;
  }

  _validatePriority(priority) {
    const validPriorities = ["low", "medium", "high", "urgent"];
    return validPriorities.includes(priority) ? priority : "medium";
  }

  _validateStatus(status) {
    const validStatuses = [
      "pending",
      "in-progress",
      "blocked",
      "completed",
      "cancelled",
    ];
    return validStatuses.includes(status) ? status : "pending";
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = EnhancedTask;
} else {
  window.EnhancedTask = EnhancedTask;
}
