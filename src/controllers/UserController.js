class UserController {
  /**
   * Membuat instance UserController.
   * @constructor
   * @param {UserService} userService - Service pengguna.
   */
  constructor(userService) {
    this.userService = userService;
    this.currentUser = null;
  }

  /**
   * Mendaftarkan pengguna baru.
   * @param {Object} userData - Data pendaftaran.
   * @returns {Object} Response success/error.
   */
  register(userData) {
    try {
      const user = this.userService.register(userData);
      return {
        success: true,
        data: user,
        message: `Pengguna ${user.username} berhasil didaftarkan`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Login pengguna.
   * @param {string} username - Username.
   * @returns {Object} Response success/error.
   */
  login(username) {
    try {
      const user = this.userService.login(username);
      this.currentUser = user;
      return {
        success: true,
        data: user,
        message: `Selamat datang, ${user.fullName || user.username}!`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout pengguna saat ini.
   * @returns {Object} Response success.
   */
  logout() {
    const username = this.currentUser ? this.currentUser.username : "User";
    this.currentUser = null;
    return { success: true, message: `${username} berhasil logout` };
  }

  /**
   * Mendapatkan pengguna yang sedang login.
   * @returns {Object} Response dengan data user.
   */
  getCurrentUser() {
    if (!this.currentUser) {
      return { success: false, error: "Tidak ada pengguna yang login" };
    }
    return { success: true, data: this.currentUser };
  }

  /**
   * Mendapatkan semua pengguna.
   * @returns {Object} Response dengan data list user.
   */
  getAllUsers() {
    try {
      if (!this.currentUser) {
        return { success: false, error: "Harap login terlebih dahulu" };
      }
      const users = this.userService.getAllUsers();
      const userData = users.map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
      }));
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan pengguna berdasarkan ID.
   * @param {string} userId - ID pengguna.
   * @returns {Object} Response dengan data user.
   */
  getUserById(userId) {
    try {
      const user = this.userService.getUserById(userId);
      return {
        success: true,
        data: { id: user.id, username: user.username, fullName: user.fullName },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mendapatkan profil lengkap dan statistik pengguna saat ini.
   * @returns {Object} Response dengan data profil dan statistik.
   */
  getUserProfile() {
    try {
      if (!this.currentUser) return { success: false, error: "Login required" };
      let stats = {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        tasksByCategory: {},
      };
      if (window.app && window.app.taskRepository) {
        const userTasks = window.app.taskRepository.findByOwner(
          this.currentUser.id
        );
        stats.totalTasks = userTasks.length;
        stats.completedTasks = userTasks.filter((t) => t.isCompleted).length;
        stats.completionRate =
          stats.totalTasks > 0
            ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
            : 0;
        userTasks.forEach((task) => {
          const cat = task.category;
          stats.tasksByCategory[cat] = (stats.tasksByCategory[cat] || 0) + 1;
        });
      }
      return {
        success: true,
        data: {
          user: this.currentUser.toJSON(),
          statistics: stats,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Memperbarui preferensi pengguna saat ini.
   * @param {Object} newPreferences - Preferensi baru.
   * @returns {Object} Response success/error.
   */
  updateUserPreferences(newPreferences) {
    try {
      if (!this.currentUser) return { success: false, error: "Login required" };
      const validKeys = [
        "theme",
        "defaultCategory",
        "emailNotifications",
        "language",
      ];
      const filtered = {};
      Object.keys(newPreferences).forEach((key) => {
        if (validKeys.includes(key)) filtered[key] = newPreferences[key];
      });
      this.currentUser.updatePreferences(filtered);
      this.userService.userRepository._saveUsersToStorage();
      return {
        success: true,
        data: this.currentUser.preferences,
        message: "Preferensi diupdate",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = UserController;
} else {
  window.UserController = UserController;
}
