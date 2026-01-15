class Task {
  /**
   * Membuat instance Task baru.
   * @constructor
   * @param {string} title - Judul tugas.
   * @param {string} description - Deskripsi tugas.
   * @param {string} ownerId - ID pemilik tugas.
   * @param {Object} [options={}] - Opsi tambahan untuk tugas.
   * @throws {Error} Jika judul atau ownerId kosong.
   */
  constructor(title, description, ownerId, options = {}) {
    if (!title || title.trim() === "") {
      throw new Error("Judul task wajib diisi");
    }
    if (!ownerId) {
      throw new Error("Owner ID wajib diisi");
    }
    this._id = this._generateId();
    this._title = title.trim();
    this._description = description ? description.trim() : "";
    this._ownerId = ownerId;
    this._assigneeId = options.assigneeId || ownerId;
    this._category = this._validateCategory(options.category || "personal");
    this._tags = Array.isArray(options.tags) ? options.tags : [];
    this._priority = this._validatePriority(options.priority || "medium");
    this._status = this._validateStatus(options.status || "pending");
    this._dueDate = options.dueDate ? new Date(options.dueDate) : null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._completedAt = options.completedAt
      ? new Date(options.completedAt)
      : null;
    if (this._status === "completed" && !this._completedAt) {
      this._completedAt = new Date();
    }
    this._estimatedHours = options.estimatedHours || 0;
    this._actualHours = options.actualHours || 0;
    this._comments = options.comments || [];
    this._collaborators = options.collaborators || [];
    this._sharedWith = options.sharedWith || [];
    this._activityLog = options.activityLog || [];
    this._notes = options.notes || [];
    this._attachments = options.attachments || [];
    this._dependencies = options.dependencies || [];
  }

  // Getters

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
  get comments() {
    return [...this._comments];
  }
  get collaborators() {
    return [...this._collaborators];
  }
  get sharedWith() {
    return [...this._sharedWith];
  }
  get activityLog() {
    return [...this._activityLog];
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

  /**
   * Mengecek apakah tugas sudah selesai.
   * @returns {boolean} True jika status 'completed'.
   */
  get isCompleted() {
    return this._status === "completed";
  }

  get completed() {
    return this.isCompleted;
  }

  /**
   * Mengecek apakah tugas terlambat dari tanggal jatuh tempo.
   * @returns {boolean} True jika hari ini melewati due date dan belum selesai.
   */
  get isOverdue() {
    if (!this._dueDate || this.isCompleted) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(this._dueDate);
    due.setHours(0, 0, 0, 0);
    return today > due;
  }

  /**
   * Menghitung sisa hari hingga jatuh tempo.
   * @returns {number|null} Jumlah hari (bisa negatif jika lewat), atau null jika tidak ada due date.
   */
  get daysUntilDue() {
    if (!this._dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(this._dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Menghitung persentase progress berdasarkan jam aktual vs estimasi.
   * @returns {number} Persentase progress (0-100).
   */
  get progressPercentage() {
    if (this._estimatedHours === 0) return 0;
    return Math.min(100, (this._actualHours / this._estimatedHours) * 100);
  }

  /**
   * Mendapatkan nilai progress, 100 jika completed.
   * @returns {number} Nilai progress.
   */
  get progress() {
    return this.isCompleted ? 100 : this.progressPercentage;
  }

  /**
   * Mendapatkan daftar kategori yang tersedia.
   * @static
   * @returns {string[]} Array kategori.
   */
  static getAvailableCategories() {
    return [
      "work",
      "personal",
      "study",
      "health",
      "finance",
      "shopping",
      "other",
    ];
  }

  /**
   * Mendapatkan nama tampilan untuk kategori saat ini.
   * @returns {string} Nama tampilan kategori.
   */
  getCategoryDisplayName() {
    const categoryNames = {
      work: "Work & Business",
      personal: "Personal",
      study: "Study & Learning",
      health: "Health & Fitness",
      finance: "Finance & Money",
      shopping: "Shopping",
      other: "Other",
    };
    return categoryNames[this._category] || this._category;
  }

  /**
   * Mengatur kategori tugas.
   * @param {string} category - Kategori baru.
   * @returns {Task} Instance task (chainable).
   */
  setCategory(category) {
    this._category = this._validateCategory(category);
    this._updateTimestamp();
    return this;
  }

  /**
   * Alias untuk setCategory.
   * @param {string} category - Kategori baru.
   * @returns {Task} Instance task.
   */
  updateCategory(category) {
    return this.setCategory(category);
  }

  /**
   * Menambahkan komentar ke tugas.
   * @param {string} text - Isi komentar.
   * @param {string} authorId - ID penulis komentar.
   * @param {string} authorName - Nama penulis komentar.
   * @returns {Object} Objek komentar yang baru dibuat.
   */
  addComment(text, authorId, authorName) {
    const comment = {
      id: Date.now().toString(),
      text,
      authorId,
      authorName,
      createdAt: new Date(),
    };
    this._comments.push(comment);
    this._logActivity(`Komentar ditambahkan oleh ${authorName}`);
    this._updateTimestamp();
    return comment;
  }

  /**
   * Menambahkan kolaborator ke tugas.
   * @param {string} userId - ID pengguna.
   */
  addCollaborator(userId) {
    if (!this._collaborators.includes(userId)) {
      this._collaborators.push(userId);
      this._logActivity(`Kolaborator ditambahkan: ${userId}`);
      this._updateTimestamp();
    }
  }

  /**
   * Membagikan tugas dengan pengguna lain (view only/limited).
   * @param {string} userId - ID pengguna.
   */
  shareWith(userId) {
    if (!this._sharedWith.includes(userId)) {
      this._sharedWith.push(userId);
      this._logActivity(`Dibagikan kepada: ${userId}`);
      this._updateTimestamp();
    }
  }

  /**
   * Mengecek apakah pengguna memiliki akses ke tugas ini.
   * @param {string} userId - ID pengguna.
   * @returns {boolean} True jika punya akses.
   */
  canAccess(userId) {
    return (
      this._ownerId === userId ||
      this._assigneeId === userId ||
      this._collaborators.includes(userId) ||
      this._sharedWith.includes(userId)
    );
  }

  /**
   * Mengecek apakah pengguna bisa mengedit tugas ini.
   * @param {string} userId - ID pengguna.
   * @returns {boolean} True jika bisa edit.
   */
  canEdit(userId) {
    return (
      this._ownerId === userId ||
      this._assigneeId === userId ||
      this._collaborators.includes(userId)
    );
  }

  /**
   * Mencatat aktivitas ke dalam log.
   * @private
   * @param {string} message - Pesan aktivitas.
   */
  _logActivity(message) {
    this._activityLog.unshift({
      message,
      timestamp: new Date(),
    });
  }

  /**
   * Memperbarui judul tugas.
   * @param {string} newTitle - Judul baru.
   * @returns {Task} Instance task.
   * @throws {Error} Jika judul kosong.
   */
  updateTitle(newTitle) {
    if (!newTitle || newTitle.trim() === "")
      throw new Error("Judul task tidak boleh kosong");
    this._title = newTitle.trim();
    this._updateTimestamp();
    return this;
  }

  /**
   * Memperbarui deskripsi tugas.
   * @param {string} newDescription - Deskripsi baru.
   * @returns {Task} Instance task.
   */
  updateDescription(newDescription) {
    this._description = newDescription ? newDescription.trim() : "";
    this._updateTimestamp();
    return this;
  }

  /**
   * Memperbarui status tugas.
   * @param {string} newStatus - Status baru.
   * @returns {Task} Instance task.
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

  /**
   * Mengatur status tugas (alias updateStatus).
   * @param {string} status - Status baru.
   * @returns {Task} Instance task.
   */
  setStatus(status) {
    return this.updateStatus(status);
  }

  /**
   * Menandai tugas sebagai selesai.
   * @returns {Task} Instance task.
   */
  markComplete() {
    return this.updateStatus("completed");
  }

  /**
   * Menandai tugas sebagai belum selesai (pending).
   * @returns {Task} Instance task.
   */
  markIncomplete() {
    return this.updateStatus("pending");
  }

  /**
   * Mengubah status selesai/belum selesai (toggle).
   * @returns {Task} Instance task.
   */
  toggleComplete() {
    if (this.isCompleted) {
      this.markIncomplete();
    } else {
      this.markComplete();
    }
    return this;
  }

  /**
   * Memperbarui prioritas tugas.
   * @param {string} newPriority - Prioritas baru.
   * @returns {Task} Instance task.
   */
  updatePriority(newPriority) {
    this._priority = this._validatePriority(newPriority);
    this._updateTimestamp();
    return this;
  }

  /**
   * Mengatur tanggal jatuh tempo.
   * @param {string|Date} dueDate - Tanggal jatuh tempo.
   * @returns {Task} Instance task.
   * @throws {Error} Jika tanggal tidak valid.
   */
  setDueDate(dueDate) {
    if (dueDate === "invalid-date") throw new Error("Invalid due date");
    this._dueDate = dueDate ? new Date(dueDate) : null;
    this._updateTimestamp();
    return this;
  }

  /**
   * Menghapus tanggal jatuh tempo.
   * @returns {Task} Instance task.
   */
  clearDueDate() {
    this._dueDate = null;
    this._updateTimestamp();
    return this;
  }

  /**
   * Menugaskan tugas ke pengguna lain.
   * @param {string} userId - ID pengguna.
   * @returns {Task} Instance task.
   * @throws {Error} Jika userId kosong.
   */
  assignTo(userId) {
    if (!userId) throw new Error("Valid user ID is required");
    this._assigneeId = userId;
    this._updateTimestamp();
    return this;
  }

  /**
   * Mengembalikan penugasan ke pemilik.
   * @returns {Task} Instance task.
   */
  reassignToOwner() {
    this._assigneeId = this._ownerId;
    this._updateTimestamp();
    return this;
  }

  /**
   * Menambahkan tag ke tugas.
   * @param {string} tag - Nama tag.
   * @returns {Task} Instance task.
   */
  addTag(tag) {
    if (!tag || typeof tag !== "string") return this;
    const normalizedTag = tag.trim().toLowerCase();
    if (!this._tags.includes(normalizedTag)) {
      this._tags.push(normalizedTag);
      this._updateTimestamp();
    }
    return this;
  }

  /**
   * Menghapus tag dari tugas.
   * @param {string} tag - Nama tag.
   * @returns {Task} Instance task.
   */
  removeTag(tag) {
    if (!tag) return this;
    const normalizedTag = tag.trim().toLowerCase();
    this._tags = this._tags.filter((t) => t !== normalizedTag);
    this._updateTimestamp();
    return this;
  }

  /**
   * Menghapus semua tag.
   * @returns {Task} Instance task.
   */
  clearTags() {
    this._tags = [];
    this._updateTimestamp();
    return this;
  }

  /**
   * Mengecek apakah tugas memiliki tag tertentu.
   * @param {string} tag - Nama tag.
   * @returns {boolean} True jika ada.
   */
  hasTag(tag) {
    const normalizedTag = tag.trim().toLowerCase();
    return this._tags.includes(normalizedTag);
  }

  /**
   * Mengatur estimasi jam pengerjaan.
   * @param {number} hours - Jumlah jam.
   * @returns {Task} Instance task.
   * @throws {Error} Jika jam negatif.
   */
  setEstimatedHours(hours) {
    if (typeof hours !== "number" || hours < 0)
      throw new Error("Hours must be a positive number");
    this._estimatedHours = hours;
    this._updateTimestamp();
    return this;
  }

  /**
   * Mengatur jam aktual pengerjaan.
   * @param {number} hours - Jumlah jam.
   * @returns {Task} Instance task.
   * @throws {Error} Jika jam negatif.
   */
  setActualHours(hours) {
    if (typeof hours !== "number" || hours < 0)
      throw new Error("Hours must be a positive number");
    this._actualHours = hours;
    this._updateTimestamp();
    return this;
  }

  /**
   * Menambahkan waktu pengerjaan.
   * @param {number} hours - Jumlah jam yang ditambahkan.
   * @returns {Task} Instance task.
   * @throws {Error} Jika jam negatif.
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
   * @returns {Task} Instance task.
   * @throws {Error} Jika konten bukan string non-empty.
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

  /**
   * Menghapus catatan berdasarkan ID.
   * @param {string} noteId - ID catatan.
   * @returns {Task} Instance task.
   */
  removeNote(noteId) {
    this._notes = this._notes.filter((n) => n.id !== noteId);
    this._updateTimestamp();
    return this;
  }

  /**
   * Menambahkan dependensi tugas.
   * @param {string} taskId - ID tugas yang menjadi dependensi.
   * @returns {Task} Instance task.
   * @throws {Error} Jika dependensi ke diri sendiri.
   */
  addDependency(taskId) {
    if (taskId === this.id) throw new Error("Task cannot depend on itself");
    if (!this._dependencies.includes(taskId)) {
      this._dependencies.push(taskId);
      this._updateTimestamp();
    }
    return this;
  }

  /**
   * Menghapus dependensi tugas.
   * @param {string} taskId - ID tugas.
   * @returns {Task} Instance task.
   */
  removeDependency(taskId) {
    this._dependencies = this._dependencies.filter((id) => id !== taskId);
    this._updateTimestamp();
    return this;
  }

  /**
   * Mengecek apakah tugas memiliki dependensi tertentu.
   * @param {string} taskId - ID tugas.
   * @returns {boolean} True jika ada.
   */
  hasDependency(taskId) {
    return this._dependencies.includes(taskId);
  }

  /**
   * Membuat salinan (clone) dari tugas ini.
   * @returns {Task} Instance task baru yang identik.
   */
  clone() {
    const options = {
      assigneeId: this._assigneeId,
      category: this._category,
      tags: [...this._tags],
      priority: this._priority,
      status: this._status,
      dueDate: this._dueDate ? new Date(this._dueDate) : null,
      estimatedHours: this._estimatedHours,
      actualHours: this._actualHours,
      notes: this._notes.map((n) => ({ ...n })),
      attachments: [...this._attachments],
      dependencies: [...this._dependencies],
      comments: this._comments.map((c) => ({ ...c })),
      collaborators: [...this._collaborators],
      sharedWith: [...this._sharedWith],
      activityLog: [],
    };
    return new Task(this._title, this._description, this._ownerId, options);
  }

  /**
   * Mengkonversi objek Task ke format JSON.
   * @returns {Object} Representasi JSON dari tugas.
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
      comments: this._comments,
      collaborators: this._collaborators,
      sharedWith: this._sharedWith,
      activityLog: this._activityLog,
    };
  }

  /**
   * Membuat instance Task dari data JSON.
   * @static
   * @param {Object} data - Data JSON tugas.
   * @returns {Task} Instance Task baru.
   */
  static fromJSON(data) {
    const task = new Task(data.title, data.description, data.ownerId, {
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
      comments: data.comments,
      collaborators: data.collaborators,
      sharedWith: data.sharedWith,
      activityLog: data.activityLog,
    });
    task._id = data.id;
    task._createdAt = new Date(data.createdAt);
    task._updatedAt = new Date(data.updatedAt);
    return task;
  }

  /**
   * Membuat ID unik untuk tugas.
   * @private
   * @returns {string} ID unik.
   */
  _generateId() {
    return "task_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Memperbarui timestamp updatedAt.
   * @private
   */
  _updateTimestamp() {
    this._updatedAt = new Date();
  }

  /**
   * Memvalidasi kategori tugas.
   * @private
   * @param {string} category - Kategori yang dicek.
   * @returns {string} Kategori yang valid atau default.
   */
  _validateCategory(category) {
    const validCategories = [
      "work",
      "personal",
      "study",
      "health",
      "finance",
      "other",
      "shopping",
    ];
    const normalized = category ? category.toLowerCase().trim() : "personal";
    return validCategories.includes(normalized) ? normalized : "personal";
  }

  /**
   * Memvalidasi prioritas tugas.
   * @private
   * @param {string} priority - Prioritas yang dicek.
   * @returns {string} Prioritas yang valid atau default.
   */
  _validatePriority(priority) {
    const validPriorities = ["low", "medium", "high", "urgent"];
    return validPriorities.includes(priority) ? priority : "medium";
  }

  /**
   * Memvalidasi status tugas.
   * @private
   * @param {string} status - Status yang dicek.
   * @returns {string} Status yang valid atau default.
   */
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
  module.exports = Task;
} else {
  window.Task = Task;
}
