/**
 * Aplikasi Utama Day 2 - Implementasi MVC.
 * * @description Orchestrator utama yang menginisialisasi semua komponen (Storage, Repository, Controller, View) dan menangani event global.
 */

const app = {
  storage: null,
  userRepository: null,
  taskRepository: null,
  userController: null,
  taskController: null,
  taskView: null,
  currentUser: null,
};

/**
 * Menginisialisasi seluruh aplikasi.
 * Dipanggil saat DOM siap.
 */
function initializeApp() {
  console.log("🚀 Memulai Aplikasi Manajemen Tugas Day 2...");

  try {
    // 1. Setup Layer Penyimpanan & Data
    app.storage = new EnhancedStorageManager("taskAppDay2", "2.0");
    app.userRepository = new UserRepository(app.storage);
    app.taskRepository = new TaskRepository(app.storage);

    // 2. Setup Layer Logika (Controllers)
    app.userController = new UserController(app.userRepository);
    app.taskController = new TaskController(
      app.taskRepository,
      app.userRepository
    );

    // 3. Setup Layer Tampilan (View)
    app.taskView = new TaskView(app.taskController, app.userController);

    // 4. Setup Event Listeners Global
    setupAuthEventListeners();

    // 5. Buat data demo jika penyimpanan masih kosong
    createDemoDataIfNeeded();

    // Tampilkan halaman login sebagai tampilan awal
    showLoginSection();

    console.log("✅ Aplikasi berhasil diinisialisasi!");
  } catch (error) {
    console.error("❌ Gagal inisialisasi:", error);
    alert("Gagal memulai aplikasi: " + error.message);
  }
}

/**
 * Mengatur semua event listener untuk tombol dan form.
 */
function setupAuthEventListeners() {
  // Tombol Login
  document.getElementById("loginBtn")?.addEventListener("click", handleLogin);

  // Tombol Register (Buka Modal)
  document.getElementById("registerBtn")?.addEventListener("click", () => {
    document.getElementById("registerModal").style.display = "flex";
  });

  // Tombol Logout
  document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);

  // Form Registrasi
  document
    .getElementById("registerForm")
    ?.addEventListener("submit", handleRegister);

  // Tutup Modal
  document
    .getElementById("closeRegisterModal")
    ?.addEventListener("click", () => {
      document.getElementById("registerModal").style.display = "none";
    });

  // Form Buat Task
  document
    .getElementById("taskForm")
    ?.addEventListener("submit", handleCreateTask);

  // Filter Kategori/Status
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      app.taskView.currentFilter = e.target.dataset.filter;
      app.taskView.renderTasks();
    });
  });

  // Pencarian
  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    const query = e.target.value;
    const response = app.taskController.searchTasks(query);
    if (response.success) {
      // Render hasil pencarian secara manual ke list
      const tasksHTML = response.data
        .map((t) => app.taskView._createTaskHTML(t))
        .join("");
      document.getElementById("taskList").innerHTML =
        tasksHTML || app.taskView._getEmptyStateHTML();
      app.taskView._setupTaskEventListeners();
    }
  });

  // Tombol Aksi Cepat: Overdue
  document.getElementById("showOverdueBtn")?.addEventListener("click", () => {
    const res = app.taskController.getOverdueTasks();
    if (res.success) {
      if (res.count === 0)
        app.taskView.showMessage(
          "Tidak ada tugas terlambat! Bagus.",
          "success"
        );
      else {
        app.taskView.showMessage(
          `Ada ${res.count} tugas terlambat.`,
          "warning"
        );
        const tasksHTML = res.data
          .map((t) => app.taskView._createTaskHTML(t))
          .join("");
        document.getElementById("taskList").innerHTML = tasksHTML;
        app.taskView._setupTaskEventListeners();
      }
    }
  });

  // Tombol Aksi Cepat: Due Soon
  document.getElementById("showDueSoonBtn")?.addEventListener("click", () => {
    const res = app.taskController.getTasksDueSoon(3);
    if (res.success && res.data.length > 0) {
      app.taskView.showMessage(
        `${res.count} tugas mendekati deadline.`,
        "info"
      );
      const tasksHTML = res.data
        .map((t) => app.taskView._createTaskHTML(t))
        .join("");
      document.getElementById("taskList").innerHTML = tasksHTML;
      app.taskView._setupTaskEventListeners();
    } else {
      app.taskView.showMessage(
        "Aman, tidak ada deadline dalam 3 hari ke depan.",
        "success"
      );
    }
  });

  // Tombol Export Data
  document.getElementById("exportDataBtn")?.addEventListener("click", () => {
    const data = app.storage.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "task-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    app.taskView.showMessage("Data berhasil diekspor!", "success");
  });
}

/**
 * Handler event login.
 */
function handleLogin() {
  const username = document.getElementById("usernameInput").value;
  const response = app.userController.login(username);
  if (response.success) {
    app.currentUser = response.data;
    app.taskController.setCurrentUser(app.currentUser.id);
    showMainContent();
    loadAssignees();
    app.taskView.refresh();
    app.taskView.showMessage(response.message, "success");
  } else {
    app.taskView.showMessage(response.error, "error");
  }
}

/**
 * Handler event logout.
 */
function handleLogout() {
  app.userController.logout();
  app.currentUser = null;
  showLoginSection();
  app.taskView.showMessage("Berhasil logout", "info");
}

/**
 * Handler event registrasi user.
 * @param {Event} e - Event submit form.
 */
function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const userData = {
    username: form.username.value,
    email: form.email.value,
    fullName: form.fullName.value,
  };
  const response = app.userController.register(userData);
  if (response.success) {
    app.taskView.showMessage(response.message, "success");
    document.getElementById("registerModal").style.display = "none";
    form.reset();
    document.getElementById("usernameInput").value = userData.username;
  } else {
    alert(response.error);
  }
}

/**
 * Handler event pembuatan task baru.
 * @param {Event} e - Event submit form.
 */
function handleCreateTask(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const taskData = {
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    estimatedHours: parseFloat(formData.get("estimatedHours")),
    assigneeId: formData.get("assigneeId"),
    tags: formData.get("tags")
      ? formData
          .get("tags")
          .split(",")
          .map((t) => t.trim())
      : [],
  };
  const response = app.taskController.createTask(taskData);
  if (response.success) {
    app.taskView.showMessage(response.message, "success");
    e.target.reset();
    app.taskView.refresh();
  } else {
    app.taskView.showMessage(response.error, "error");
  }
}

// ==============================================================
// Helper UI
// ==============================================================

function showLoginSection() {
  document.getElementById("loginSection").style.display = "flex";
  document.getElementById("userInfo").style.display = "none";
  document.getElementById("mainContent").style.display = "none";
  document.getElementById("usernameInput").value = "";
}

function showMainContent() {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("userInfo").style.display = "flex";
  document.getElementById("mainContent").style.display = "block";
  document.getElementById(
    "welcomeMessage"
  ).textContent = `Halo, ${app.currentUser.username}`;
}

function loadAssignees() {
  const res = app.userController.getAllUsers();
  if (res.success) {
    const select = document.getElementById("taskAssignee");
    select.innerHTML = "";
    const selfOpt = document.createElement("option");
    selfOpt.value = app.currentUser.id;
    selfOpt.textContent = "Diri Sendiri";
    select.appendChild(selfOpt);
    res.data.forEach((u) => {
      if (u.id !== app.currentUser.id) {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = u.fullName || u.username;
        select.appendChild(opt);
      }
    });
  }
}

function createDemoDataIfNeeded() {
  if (app.userRepository.findAll().length === 0) {
    app.userRepository.create({
      username: "demo",
      email: "demo@test.com",
      fullName: "Demo User",
    });
    app.userRepository.create({
      username: "budi",
      email: "budi@test.com",
      fullName: "Budi Santoso",
    });
  }
}

// Menjalankan inisialisasi saat DOM siap
document.addEventListener("DOMContentLoaded", initializeApp);
