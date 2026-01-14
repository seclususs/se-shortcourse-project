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
    this._assigneeId = options.assigneeId || ownerId; // Default ke owner jika kosong

    // Properti Kategorisasi & Status
    this._category = this._validateCategory(options.category || "personal");
    this._tags = Array.isArray(options.tags) ? options.tags : [];
    this._priority = this._validatePriority(options.priority || "medium");
    this._status = this._validateStatus(options.status || "pending");

    // Properti Waktu
    this._dueDate = options.dueDate ? new Date(options.dueDate) : null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._completedAt = options.completedAt
      ? new Date(options.completedAt)
      : null;

    // Sinkronisasi status completed jika di-pass dari options
    if (this._status === "completed" && !this._completedAt) {
      this._completedAt = new Date();
    }

    // Pelacakan
    this._estimatedHours = options.estimatedHours || 0;
    this._actualHours = options.actualHours || 0;

    // Metadata
    this._notes = options.notes || [];
    this._attachments = options.attachments || [];
    this._dependencies = options.dependencies || [];
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
  get assignedTo() {
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
  get dependencies() {
    return [...this._dependencies];
  }

  // ==============================================================
  // Computed Properties
  // ==============================================================

  /** @returns {boolean} True jika status tugas adalah 'completed'. */
  get isCompleted() {
    return this._status === "completed";
  }

  /** @returns {boolean} True jika status tugas adalah 'completed' (alias). */
  get completed() {
    return this.isCompleted;
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

  /** @returns {number} Alias untuk progressPercentage, 100 jika completed. */
  get progress() {
    return this.isCompleted ? 100 : this.progressPercentage;
  }

  // ==============================================================
  // Public Methods (Setters & Actions)
  // ==============================================================

  /**
   * Memperbarui judul tugas.
   * @param {string} newTitle - Judul baru.
   * @returns {EnhancedTask} Instance task untuk chaining.
   */
  updateTitle(newTitle) {
    if (!newTitle || newTitle.trim() === "") {
      throw new Error("Judul task tidak boleh kosong");
    }
    this._title = newTitle.trim();
    this._updateTimestamp();
    return this;
  }

  /**
   * Memperbarui deskripsi tugas.
   * @param {string} newDescription - Deskripsi baru.
   * @returns {EnhancedTask} Instance task untuk chaining.
   */
  updateDescription(newDescription) {
    this._description = newDescription ? newDescription.trim() : "";
    this._updateTimestamp();
    return this;
  }

  /**
   * Mengubah status tugas.
   * @param {string} newStatus - Status baru (pending/in-progress/completed/blocked/cancelled).
   * @returns {EnhancedTask} Instance task untuk chaining.
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
    return this;
  }

  /** Alias untuk updateStatus agar kompatibel dengan berbagai gaya pemanggilan. */
  setStatus(status) {
    return this.updateStatus(status);
  }

  /**
   * Mengubah prioritas tugas.
   * @param {string} newPriority - Prioritas baru (low/medium/high/urgent).
   * @returns {EnhancedTask} Instance task untuk chaining.
   */
  updatePriority(newPriority) {
    this._priority = this._validatePriority(newPriority);
    this._updateTimestamp();
    return this;
  }

  /**
   * Mengubah kategori tugas.
   * @param {string} category - Kategori baru.
   * @returns {EnhancedTask} Instance task untuk chaining.
   */
  setCategory(category) {
    this._category = this._validateCategory(category);
    this._updateTimestamp();
    return this;
  }

  /** Alias untuk setCategory. */
  updateCategory(category) {
    return this.setCategory(category);
  }

  /**
   * Menetapkan atau mengubah tenggat waktu.
   * @param {string|Date|null} dueDate - Tanggal deadline.
   * @returns {EnhancedTask} Instance task untuk chaining.
   */
  setDueDate(dueDate) {
    if (dueDate === "invalid-date") throw new Error("Invalid due date");
    this._dueDate = dueDate ? new Date(dueDate) : null;
    this._updateTimestamp();
    return this;
  }

  /** Menghapus tenggat waktu. */
  clearDueDate() {
    this._dueDate = null;
    this._updateTimestamp();
    return this;
  }

  /**
   * Menugaskan tugas ke pengguna lain.
   * @param {string} userId - ID pengguna penerima tugas.
   * @returns {EnhancedTask} Instance task untuk chaining.
   */
  assignTo(userId) {
    if (!userId || typeof userId !== "string") {
      throw new Error("Valid user ID is required");
    }
    this._assigneeId = userId;
    this._updateTimestamp();
    return this;
  }

  /** Mengembalikan tugas ke pemilik asli. */
  reassignToOwner() {
    this._assigneeId = this._ownerId;
    this._updateTimestamp();
    return this;
  }

  /**
   * Menambahkan tag ke tugas.
   * @param {string} tag - Tag yang akan ditambahkan.
   * @returns {EnhancedTask} Instance task untuk chaining.
   */
  addTag(tag) {
    if (!tag || typeof tag !== "string") {
      return this;
    }
    const normalizedTag = tag.trim().toLowerCase();
    if (!this._tags.includes(normalizedTag)) {
      this._tags.push(normalizedTag);
      this._updateTimestamp();
    }
    return this;
  }

  /**
   * Menghapus tag dari tugas.
   * @param {string} tag - Tag yang akan dihapus.
   * @returns {EnhancedTask} Instance task untuk chaining.
   */
  removeTag(tag) {
    if (!tag) return this;
    const normalizedTag = tag.trim().toLowerCase();
    this._tags = this._tags.filter((t) => t !== normalizedTag);
    this._updateTimestamp();
    return this;
  }

  /** Menghapus semua tag. */
  clearTags() {
    this._tags = [];
    this._updateTimestamp();
    return this;
  }

  /**
   * Mengecek apakah tugas memiliki tag tertentu.
   * @param {string} tag - Tag yang dicari.
   * @returns {boolean} True jika tag ada.
   */
  hasTag(tag) {
    const normalizedTag = tag.trim().toLowerCase();
    return this._tags.includes(normalizedTag);
  }

  /** Menandai tugas sebagai selesai. */
  markComplete() {
    return this.updateStatus("completed");
  }

  /** Menandai tugas sebagai belum selesai. */
  markIncomplete() {
    return this.updateStatus("pending");
  }

  /** Mengganti status selesai/belum selesai. */
  toggleComplete() {
    if (this.isCompleted) return this.markIncomplete();
    return this.markComplete();
  }

  /**
   * Mengatur estimasi jam kerja.
   * @param {number} hours - Jam.
   */
  setEstimatedHours(hours) {
    if (typeof hours !== "number" || hours < 0)
      throw new Error("Hours must be a positive number");
    this._estimatedHours = hours;
    this._updateTimestamp();
    return this;
  }

  /**
   * Mengatur jam kerja aktual.
   * @param {number} hours - Jam.
   */
  setActualHours(hours) {
    if (typeof hours !== "number" || hours < 0)
      throw new Error("Hours must be a positive number");
    this._actualHours = hours;
    this._updateTimestamp();
    return this;
  }

  /**
   * Menambah jam kerja aktual.
   * @param {number} hours - Jumlah jam yang ditambahkan.
   * @returns {EnhancedTask} Instance task untuk chaining.
   */
  addTimeSpent(hours) {
    if (typeof hours !== "number" || hours < 0)
      throw new Error("Hours must be a positive number");
    if (hours > 0) {
      this._actualHours += hours;
      this._updateTimestamp();
    }
    return this;
  }

  /**
   * Menambahkan catatan ke tugas.
   * @param {string} content - Isi catatan.
   * @param {string} author - Penulis catatan.
   */
  addNote(content, author) {
    if (!content || typeof content !== "string")
      throw new Error("Note must be a non-empty string");
    this._notes.push({
      id: Date.now().toString(),
      content,
      author,
      createdAt: new Date(),
    });
    this._updateTimestamp();
    return this;
  }

  /** Menghapus catatan berdasarkan ID. */
  removeNote(noteId) {
    this._notes = this._notes.filter((n) => n.id !== noteId);
    this._updateTimestamp();
    return this;
  }

  /** Menambahkan ketergantungan tugas lain. */
  addDependency(taskId) {
    if (taskId === this.id) throw new Error("Task cannot depend on itself");
    if (!this._dependencies.includes(taskId)) {
      this._dependencies.push(taskId);
      this._updateTimestamp();
    }
    return this;
  }

  /** Menghapus ketergantungan. */
  removeDependency(taskId) {
    this._dependencies = this._dependencies.filter((id) => id !== taskId);
    this._updateTimestamp();
    return this;
  }

  /** Mengecek apakah memiliki dependency tertentu. */
  hasDependency(taskId) {
    return this._dependencies.includes(taskId);
  }

  /**
   * Membuat salinan (clone) dari tugas ini.
   * @returns {EnhancedTask} Instance baru yang identik.
   */
  clone() {
    const cloned = new EnhancedTask(
      this.title,
      this.description,
      this.ownerId,
      {
        assigneeId: this.assigneeId,
        category: this.category,
        tags: [...this.tags],
        priority: this.priority,
        status: this.status,
        dueDate: this.dueDate,
        estimatedHours: this.estimatedHours,
        actualHours: this.actualHours,
        dependencies: [...this.dependencies],
      }
    );
    return cloned;
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
      dependencies: this._dependencies,
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
      actualHours: data.actualHours,
      notes: data.notes,
      attachments: data.attachments,
      dependencies: data.dependencies,
      completedAt: data.completedAt,
    });
    task._id = data.id;
    task._createdAt = new Date(data.createdAt);
    task._updatedAt = new Date(data.updatedAt);
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
      "general",
      "shopping",
      "testing",
    ];
    const normalized = category.toLowerCase().trim();
    if (!validCategories.includes(normalized)) {
      return "personal";
    }
    return normalized;
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
