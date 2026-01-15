class TaskView {
  /**
   * Membuat instance TaskView.
   * @constructor
   * @param {TaskController} taskController - Controller tugas.
   * @param {UserController} userController - Controller pengguna.
   */
  constructor(taskController, userController) {
    this.taskController = taskController;
    this.userController = userController;
    this.taskList = document.getElementById("taskList");
    this.taskStats = document.getElementById("taskStats");
    this.messagesContainer = document.getElementById("messages");
    this.categoryStatsContainer = document.getElementById(
      "categoryStatsContainer"
    );
    this.detailModal = document.getElementById("taskDetailModal");
    this.closeDetailModalBtn = document.getElementById("closeDetailModal");
    this.currentFilter = "all";
    this.currentCategoryFilter = null;
    this.currentSort = "createdAt";
    this.currentSortOrder = "desc";
    this.activeTaskId = null;
    this._initModalListeners();
  }

  /**
   * Menginisialisasi listener event untuk modal.
   * @private
   */
  _initModalListeners() {
    if (this.closeDetailModalBtn) {
      this.closeDetailModalBtn.addEventListener("click", () => {
        this.detailModal.style.display = "none";
        this.activeTaskId = null;
      });
    }
    window.addEventListener("click", (e) => {
      if (e.target === this.detailModal) {
        this.detailModal.style.display = "none";
        this.activeTaskId = null;
      }
    });
    const addCommentBtn = document.getElementById("addCommentBtn");
    if (addCommentBtn) {
      addCommentBtn.addEventListener("click", () => this._handleAddComment());
    }
    const shareTaskBtn = document.getElementById("shareTaskBtn");
    if (shareTaskBtn) {
      shareTaskBtn.addEventListener("click", () => this._handleShareTask());
    }
  }

  /**
   * Merender daftar tugas ke DOM.
   */
  renderTasks() {
    if (!this.taskList) return;
    const filters = {
      sortBy: this.currentSort,
      sortOrder: this.currentSortOrder,
    };
    filters.status =
      this.currentFilter !== "all" && this.currentFilter !== "category"
        ? this.currentFilter
        : undefined;
    if (this.currentCategoryFilter)
      filters.category = this.currentCategoryFilter;
    const response = this.taskController.getTasks(filters);
    if (!response.success) return this.showMessage(response.error, "error");
    const tasks = response.data;
    if (tasks.length === 0) {
      this.taskList.innerHTML = `<div class="empty-state"><p>Belum ada tugas.</p></div>`;
      return;
    }
    this.taskList.innerHTML = tasks
      .map((task) => this._createTaskHTML(task))
      .join("");
    this._setupTaskEventListeners();
  }

  /**
   * Merender statistik tugas.
   */
  renderStats() {
    if (!this.taskStats) return;
    const response = this.taskController.getTaskStats();
    if (response.success) {
      const stats = response.data;
      let html = `
            <div class="stats-grid">
                <div class="stat-item"><span class="stat-number">${
                  stats.total
                }</span><span class="stat-label">Total</span></div>
                <div class="stat-item"><span class="stat-number">${
                  stats.byStatus.pending || 0
                }</span><span class="stat-label">Pending</span></div>
                <div class="stat-item"><span class="stat-number">${
                  stats.completed
                }</span><span class="stat-label">Selesai</span></div>`;
      if (stats.overdue > 0) {
        html += `<div class="stat-item overdue"><span class="stat-number">${stats.overdue}</span><span class="stat-label">Overdue</span></div>`;
      }
      html += `</div>`;
      this.taskStats.innerHTML = html;
    }
    this.renderCategoryStats();
  }

  /**
   * Merender statistik berdasarkan kategori.
   */
  renderCategoryStats() {
    if (!this.categoryStatsContainer) return;
    const response = this.taskController.getCategoryStats();
    if (!response.success) return;
    const { byCategory } = response.data;
    const html = Object.entries(byCategory)
      .filter(([, s]) => s.total > 0)
      .map(
        ([cat, s]) =>
          `<div class="category-stat-item"><b>${cat.toUpperCase()}</b>: ${
            s.total
          }</div>`
      )
      .join("");
    this.categoryStatsContainer.innerHTML = html
      ? `<div class="category-stats-grid">${html}</div>`
      : "";
    this.categoryStatsContainer.style.display = html ? "block" : "none";
  }

  /**
   * Membuka modal detail tugas.
   * @param {string} taskId - ID tugas.
   */
  openTaskDetail(taskId) {
    const response = this.taskController.getTaskDetails(taskId);
    if (!response.success) return this.showMessage(response.error, "error");
    const task = response.data;
    this.activeTaskId = task.id;
    document.getElementById("modalTaskTitle").textContent = task.title;
    document.getElementById("modalTaskDesc").textContent =
      task.description || "Tidak ada deskripsi";
    document.getElementById("modalTaskStatus").textContent = task.status;
    document.getElementById("modalTaskPriority").textContent = task.priority;
    document.getElementById("modalTaskCategory").textContent = task.category;
    const statusBadge = document.getElementById("modalTaskStatus");
    statusBadge.className = `badge status-${task.status}`;
    this._renderComments(task);
    this._renderSharedList(task);
    this.detailModal.style.display = "flex";
  }

  /**
   * Merender daftar komentar di modal.
   * @private
   * @param {Object} task - Objek tugas.
   */
  _renderComments(task) {
    const list = document.getElementById("commentsList");
    if (!task.comments || task.comments.length === 0) {
      list.innerHTML =
        '<small class="text-muted" style="color:#888; font-style:italic;">Belum ada komentar.</small>';
      return;
    }
    const sortedComments = [...task.comments].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    list.innerHTML = sortedComments
      .map(
        (c) => `
          <div class="comment-item">
              <div style="display:flex; justify-content:space-between;">
                  <strong>${c.authorName}</strong> 
                  <small>${new Date(c.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</small>
              </div>
              <p>${this._escapeHtml(c.text)}</p>
          </div>
      `
      )
      .join("");
  }

  /**
   * Merender daftar pengguna yang dibagikan.
   * @private
   * @param {Object} task - Objek tugas.
   */
  _renderSharedList(task) {
    const listSpan = document.getElementById("sharedUserList");
    let sharedTextParts = [];
    if (task.collaborators && task.collaborators.length > 0) {
      const names = task.collaborators.map((uid) => {
        const userRes = this.userController.getUserById(uid);
        return userRes.success ? userRes.data.username : "Unknown";
      });
      sharedTextParts.push(...names);
    }
    if (task.sharedWith && task.sharedWith.length > 0) {
      const names = task.sharedWith.map((uid) => {
        const userRes = this.userController.getUserById(uid);
        return userRes.success ? userRes.data.username : "Unknown";
      });
      sharedTextParts.push(...names);
    }
    if (sharedTextParts.length === 0) {
      listSpan.textContent = "Hanya saya";
    } else {
      listSpan.textContent = sharedTextParts.join(", ");
    }
  }

  /**
   * Menangani event tambah komentar.
   * @private
   */
  _handleAddComment() {
    const input = document.getElementById("newCommentInput");
    const text = input.value.trim();
    if (!text) return;
    const res = this.taskController.addComment(this.activeTaskId, text);
    if (res.success) {
      input.value = "";
      const taskRes = this.taskController.getTaskDetails(this.activeTaskId);
      if (taskRes.success) this._renderComments(taskRes.data);
    } else {
      this.showMessage(res.error, "error");
    }
  }

  /**
   * Menangani event berbagi tugas.
   * @private
   */
  _handleShareTask() {
    const input = document.getElementById("shareUsernameInput");
    const username = input.value.trim();
    if (!username) return;
    const res = this.taskController.shareTask(this.activeTaskId, username);
    if (res.success) {
      this.showMessage(res.message, "success");
      input.value = "";
      const taskRes = this.taskController.getTaskDetails(this.activeTaskId);
      if (taskRes.success) this._renderSharedList(taskRes.data);
      this.renderTasks();
    } else {
      this.showMessage(res.error, "error");
    }
  }

  /**
   * Menampilkan pesan notifikasi (toast).
   * @param {string} message - Pesan.
   * @param {string} [type="info"] - Tipe pesan (info/success/error).
   */
  showMessage(message, type = "info") {
    if (!this.messagesContainer) return;
    const msgEl = document.createElement("div");
    msgEl.className = `message message-${type}`;
    msgEl.textContent = message;
    this.messagesContainer.appendChild(msgEl);
    setTimeout(() => {
      if (msgEl.parentNode) msgEl.parentNode.removeChild(msgEl);
    }, 3000);
  }

  /**
   * Menyegarkan tampilan tugas dan statistik.
   */
  refresh() {
    this.renderTasks();
    this.renderStats();
  }

  /**
   * Mengatur event listener untuk item tugas.
   * @private
   */
  _setupTaskEventListeners() {
    document.querySelectorAll(".btn-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
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
        e.stopPropagation();
        if (confirm("Hapus tugas?")) {
          const taskId = e.target.closest(".task-item").dataset.taskId;
          const response = this.taskController.deleteTask(taskId);
          if (response.success) this.refresh();
          else this.showMessage(response.error, "error");
        }
      });
    });
    document.querySelectorAll(".task-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") return;
        const taskId = item.dataset.taskId;
        this.openTaskDetail(taskId);
      });
    });
  }

  /**
   * Membuat HTML string untuk satu item tugas.
   * @private
   * @param {Object} task - Data tugas.
   * @returns {string} HTML string.
   */
  _createTaskHTML(task) {
    const priorityClass = `priority-${task.priority}`;
    const statusClass = `status-${task.status}`;
    const isShared =
      (task.collaborators && task.collaborators.length > 0) ||
      (task.sharedWith && task.sharedWith.length > 0);
    const sharedIcon = isShared ? '<span title="Dibagikan">👥</span>' : "";
    const categoryDisplayName = task.getCategoryDisplayName
      ? task.getCategoryDisplayName()
      : task.category;
    const categoryClass = `category-${task.category}`;
    const commentCount = task.comments ? task.comments.length : 0;
    let assigneeName = "Unknown";
    if (task.assigneeId === task.ownerId) {
      assigneeName = "Saya";
    } else if (this.userController) {
      const userRes = this.userController.getUserById(task.assigneeId);
      if (userRes.success && userRes.data) {
        assigneeName = userRes.data.fullName || userRes.data.username;
      }
    }
    return `
            <div class="task-item ${priorityClass} ${statusClass}" data-task-id="${
      task.id
    }" style="cursor:pointer;">
                <div class="task-content">
                    <div class="task-header">
                        <h3 class="task-title">${this._escapeHtml(
                          task.title
                        )} ${sharedIcon}</h3>
                        <div class="task-badges">
                            <span class="badge badge-${task.priority}">${
      task.priority
    }</span>
                            <span class="badge badge-category ${categoryClass}">${categoryDisplayName}</span>
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
                        <small>Due: ${
                          task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : "-"
                        }</small>
                        <small>Assignee: ${this._escapeHtml(
                          assigneeName
                        )}</small>
                        ${
                          commentCount > 0
                            ? `<small>💬 ${commentCount}</small>`
                            : ""
                        }
                    </div>
                </div>

                <div class="task-actions">
                    <button class="btn btn-toggle">${
                      task.isCompleted ? "↩" : "✓"
                    }</button>
                    <button class="btn btn-delete">🗑️</button>
                </div>
            </div>
        `;
  }

  /**
   * Mengamankan teks dari XSS.
   * @private
   * @param {string} text - Teks input.
   * @returns {string} Teks aman.
   */
  _escapeHtml(text) {
    if (!text) return "";
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
