class UserController {
  constructor(userService) {
    this.userService = userService;
    this.currentUser = null;
  }

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

  logout() {
    const username = this.currentUser ? this.currentUser.username : "User";
    this.currentUser = null;
    return { success: true, message: `${username} berhasil logout` };
  }

  getCurrentUser() {
    if (!this.currentUser) {
      return { success: false, error: "Tidak ada pengguna yang login" };
    }
    return { success: true, data: this.currentUser };
  }

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
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = UserController;
} else {
  window.UserController = UserController;
}
