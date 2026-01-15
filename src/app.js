/**
 * Objek global aplikasi.
 * @type {Object}
 */
const app = {
  storage: null,
  userRepository: null,
  taskRepository: null,
  userService: null,
  taskService: null,
  userController: null,
  taskController: null,
  taskView: null,
  currentUser: null,
};

/**
 * Menginisialisasi aplikasi dan dependensinya.
 */
function initializeApp() {
  console.log("🚀 Memulai Aplikasi Manajemen Tugas...");
  try {
    app.storage = new StorageManager("taskApp", "2.0");
    app.userRepository = new UserRepository(app.storage);
    app.taskRepository = new TaskRepository(app.storage);
    app.userService = new UserService(app.userRepository);
    app.taskService = new TaskService(app.taskRepository, app.userRepository);
    app.userController = new UserController(app.userService);
    app.taskController = new TaskController(
      app.taskService,
      app.userController
    );
    app.taskView = new TaskView(app.taskController, app.userController);
    setupAuthEventListeners();
    createDemoDataIfNeeded();
    showLoginSection();
    console.log("✅ Aplikasi berhasil diinisialisasi!");
  } catch (error) {
    console.error("❌ Gagal inisialisasi:", error);
    alert("Gagal memulai aplikasi: " + error.message);
  }
}

/**
 * Mengatur event listener untuk autentikasi dan interaksi utama.
 */
function setupAuthEventListeners() {
  document.getElementById("loginBtn")?.addEventListener("click", handleLogin);

  document.getElementById("registerBtn")?.addEventListener("click", () => {
    document.getElementById("registerModal").style.display = "flex";
  });

  document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);

  document
    .getElementById("registerForm")
    ?.addEventListener("submit", handleRegister);

  document
    .getElementById("closeRegisterModal")
    ?.addEventListener("click", () => {
      document.getElementById("registerModal").style.display = "none";
    });

  document
    .getElementById("taskForm")
    ?.addEventListener("submit", handleCreateTask);

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".category-btn")
        .forEach((b) => b.classList.remove("active"));
      app.taskView.currentCategoryFilter = null;
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      app.taskView.currentFilter = e.target.dataset.filter;
      app.taskView.renderTasks();
    });
  });

  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const category = e.target.dataset.category;

      if (app.taskView.currentCategoryFilter === category) {
        e.target.classList.remove("active");
        app.taskView.currentCategoryFilter = null;
      } else {
        document
          .querySelectorAll(".category-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        app.taskView.currentCategoryFilter = category;
      }
      app.taskView.renderTasks();
    });
  });

  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    const query = e.target.value;
    const response = app.taskController.searchTasks(query);
    if (response.success) {
      const tasksHTML = response.data
        .map((t) => app.taskView._createTaskHTML(t))
        .join("");
      document.getElementById("taskList").innerHTML =
        tasksHTML || app.taskView._getEmptyStateHTML();
      app.taskView._setupTaskEventListeners();
    }
  });

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
 * Menangani proses login.
 */
function handleLogin() {
  const username = document.getElementById("usernameInput").value;
  const response = app.userController.login(username);
  if (response.success) {
    app.currentUser = response.data;
    showMainContent();
    loadAssignees();
    app.taskView.refresh();
    app.taskView.showMessage(response.message, "success");
  } else {
    app.taskView.showMessage(response.error, "error");
  }
}

/**
 * Menangani proses logout.
 */
function handleLogout() {
  app.userController.logout();
  app.currentUser = null;
  showLoginSection();
  app.taskView.showMessage("Berhasil logout", "info");
}

/**
 * Menangani proses registrasi.
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
 * Menangani pembuatan tugas baru.
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

/**
 * Menampilkan bagian login.
 */
function showLoginSection() {
  document.getElementById("loginSection").style.display = "flex";
  document.getElementById("userInfo").style.display = "none";
  document.getElementById("mainContent").style.display = "none";
  document.getElementById("usernameInput").value = "";
}

/**
 * Menampilkan konten utama setelah login.
 */
function showMainContent() {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("userInfo").style.display = "flex";
  document.getElementById("mainContent").style.display = "block";
  document.getElementById(
    "welcomeMessage"
  ).textContent = `Halo, ${app.currentUser.username}`;
}

/**
 * Memuat daftar user untuk dropdown assignee.
 */
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

/**
 * Membuat data demo jika belum ada user.
 */
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

document.addEventListener("DOMContentLoaded", initializeApp);
