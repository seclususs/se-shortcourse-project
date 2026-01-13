/**
 * Task View - Mengelola representasi visual dan interaksi pengguna.
 * @class TaskView
 * @description Bertanggung jawab atas manipulasi DOM, rendering data tugas, dan menangani event antarmuka pengguna.
 */
class TaskView {
  /**
   * @param {TaskController} taskController - Pengendali tugas.
   * @param {UserController} userController - Pengendali pengguna.
   */
  constructor(taskController, userController) {
    this.taskController = taskController;
    this.userController = userController;

    // Referensi Elemen DOM
    this.taskForm = document.getElementById("taskForm");
    this.taskList = document.getElementById("taskList");
    this.taskStats = document.getElementById("taskStats");
    this.messagesContainer = document.getElementById("messages");

    // State Internal Tampilan
    this.currentFilter = "all";
    this.currentSort = "createdAt";
    this.currentSortOrder = "desc";
  }

  /**
   * Merender daftar tugas ke elemen DOM.
   * Mengambil data dari controller berdasarkan filter saat ini.
   */
  renderTasks() {
    if (!this.taskList) return;
    const response = this.taskController.getTasks({
      status: this.currentFilter === "all" ? undefined : this.currentFilter,
      sortBy: this.currentSort,
      sortOrder: this.currentSortOrder,
    });
    if (!response.success) {
      this.showMessage(response.error, "error");
      return;
    }
    const tasks = response.data;
    if (tasks.length === 0) {
      this.taskList.innerHTML = this._getEmptyStateHTML();
      return;
    }
    const tasksHTML = tasks.map((task) => this._createTaskHTML(task)).join("");
    this.taskList.innerHTML = tasksHTML;
    this._setupTaskEventListeners();
  }

  /**
   * Merender widget statistik tugas (Total, Pending, Selesai, Terlambat).
   */
  renderStats() {
    if (!this.taskStats) return;
    const response = this.taskController.getTaskStats();
    if (!response.success) return;
    const stats = response.data;
    this.taskStats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${stats.total}</span>
                    <span class="stat-label">Total</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${
                      stats.byStatus.pending || 0
                    }</span>
                    <span class="stat-label">Pending</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${stats.completed}</span>
                    <span class="stat-label">Selesai</span>
                </div>
                <div class="stat-item ${stats.overdue > 0 ? "overdue" : ""}">
                    <span class="stat-number">${stats.overdue}</span>
                    <span class="stat-label">Terlambat</span>
                </div>
            </div>
        `;
  }

  /**
   * Menampilkan pesan notifikasi sementara kepada pengguna.
   * @param {string} message - Isi pesan.
   * @param {string} type - Jenis pesan ('success', 'error', 'info', 'warning').
   */
  showMessage(message, type = "info") {
    if (!this.messagesContainer) return;
    const msgEl = document.createElement("div");
    msgEl.className = `message message-${type}`;
    msgEl.textContent = message;
    this.messagesContainer.appendChild(msgEl);
    setTimeout(() => {
      if (msgEl.parentNode) msgEl.parentNode.removeChild(msgEl);
    }, 5000);
  }

  /**
   * Memperbarui seluruh tampilan (Daftar Tugas dan Statistik).
   */
  refresh() {
    this.renderTasks();
    this.renderStats();
  }

  // ==============================================================
  // Private Methods & Helpers
  // ==============================================================

  /**
   * Mengatur event listener untuk item tugas (Toggle Status, Hapus).
   * @private
   */
  _setupTaskEventListeners() {
    document.querySelectorAll(".btn-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const taskId = e.target.closest(".task-item").dataset.taskId;
        const response = this.taskController.toggleTaskStatus(taskId);

        if (response.success) {
          this.showMessage(response.message, "success");
          this.refresh();
        } else {
          this.showMessage(response.error, "error");
        }
      });
    });
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (confirm("Yakin ingin menghapus tugas ini?")) {
          const taskId = e.target.closest(".task-item").dataset.taskId;
          const response = this.taskController.deleteTask(taskId);
          if (response.success) {
            this.showMessage(response.message, "success");
            this.refresh();
          } else {
            this.showMessage(response.error, "error");
          }
        }
      });
    });
  }

  /**
   * Menghasilkan string HTML untuk satu item tugas.
   * @private
   * @param {EnhancedTask} task - Objek tugas.
   * @returns {string} String HTML.
   */
  _createTaskHTML(task) {
    const priorityClass = `priority-${task.priority}`;
    const statusClass = `status-${task.status}`;
    const overdueClass = task.isOverdue ? "overdue" : "";
    const createdDate = new Date(task.createdAt).toLocaleDateString("id-ID");
    const dueDate = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString("id-ID")
      : "-";
    let assigneeName = "Saya";
    if (task.assigneeId && task.assigneeId !== task.ownerId) {
      const userRes = this.userController.getUserById(task.assigneeId);
      if (userRes.success)
        assigneeName = userRes.data.fullName || userRes.data.username;
    }
    return `
            <div class="task-item ${priorityClass} ${statusClass} ${overdueClass}" data-task-id="${
      task.id
    }">
                <div class="task-content">
                    <div class="task-header">
                        <h3 class="task-title">${this._escapeHtml(
                          task.title
                        )}</h3>
                        <div class="task-badges">
                            <span class="task-priority badge-${
                              task.priority
                            }">${task.priority}</span>
                            <span class="task-category badge-category">${
                              task.category
                            }</span>
                        </div>
                    </div>
                    
                    ${
                      task.description
                        ? `<p class="task-description">${this._escapeHtml(
                            task.description
                          )}</p>`
                        : ""
                    }
                    
                    <div class="task-meta">
                        <small>Dibuat: ${createdDate}</small>
                        <small class="${
                          task.isOverdue ? "overdue-text" : ""
                        }">Due: ${dueDate}</small>
                        <small>Assignee: ${assigneeName}</small>
                    </div>
                </div>
                
                <div class="task-actions">
                    <button class="btn btn-toggle" title="${
                      task.isCompleted
                        ? "Tandai belum selesai"
                        : "Tandai selesai"
                    }">
                        ${task.isCompleted ? "↩" : "✓"}
                    </button>
                    <button class="btn btn-delete" title="Hapus">🗑️</button>
                </div>
            </div>
        `;
  }

  /**
   * Menghasilkan HTML untuk kondisi kosong.
   * @private
   * @returns {string} String HTML.
   */
  _getEmptyStateHTML() {
    return `
            <div class="empty-state">
                <p>Belum ada tugas ditemukan.</p>
                <small>Buat tugas pertama Anda sekarang!</small>
            </div>
        `;
  }

  /**
   * Mencegah XSS dengan meng-escape string HTML.
   * @private
   * @param {string} text - Teks mentah.
   * @returns {string} Teks aman.
   */
  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = TaskView;
} else {
  window.TaskView = TaskView;
}
