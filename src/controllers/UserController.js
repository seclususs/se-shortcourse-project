/**
 * User Controller - Pengendali alur kerja manajemen pengguna.
 * @class UserController
 * @description Bertanggung jawab menerima input terkait pengguna, memvalidasi, dan berinteraksi dengan repository.
 */
class UserController {
  /**
   * @param {UserRepository} userRepository - Instance repository pengguna.
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
    this.currentUser = null;
  }

  /**
   * Mendaftarkan pengguna baru.
   * @param {Object} userData - Data registrasi (username, email, fullName).
   * @returns {Object} Objek respon { success: boolean, data?: User, error?: string, message?: string }.
   */
  register(userData) {
    try {
      if (!userData.username || userData.username.trim() === "") {
        return { success: false, error: "Username wajib diisi" };
      }
      if (!userData.email || userData.email.trim() === "") {
        return { success: false, error: "Email wajib diisi" };
      }
      const user = this.userRepository.create(userData);
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
   * Melakukan login pengguna (Simulasi).
   * @param {string} username - Username pengguna.
   * @returns {Object} Objek respon login { success, data, message/error }.
   */
  login(username) {
    try {
      if (!username || username.trim() === "") {
        return { success: false, error: "Username wajib diisi" };
      }
      const user = this.userRepository.findByUsername(username);
      if (!user) {
        return { success: false, error: "Pengguna tidak ditemukan" };
      }
      if (!user.isActive) {
        return { success: false, error: "Akun tidak aktif" };
      }
      this.userRepository.recordLogin(user.id);
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
   * Melakukan logout pengguna.
   * @returns {Object} Objek respon logout.
   */
  logout() {
    const username = this.currentUser ? this.currentUser.username : "User";
    this.currentUser = null;
    return { success: true, message: `${username} berhasil logout` };
  }

  /**
   * Mendapatkan data pengguna yang sedang login saat ini.
   * @returns {Object} Objek respon { success, data: User } atau error.
   */
  getCurrentUser() {
    if (!this.currentUser) {
      return { success: false, error: "Tidak ada pengguna yang login" };
    }
    return { success: true, data: this.currentUser };
  }

  /**
   * Mengambil semua pengguna aktif (untuk keperluan penugasan/assign).
   * @returns {Object} Objek respon berisi daftar pengguna ringkas (id, username, fullName).
   */
  getAllUsers() {
    try {
      if (!this.currentUser) {
        return { success: false, error: "Harap login terlebih dahulu" };
      }
      const users = this.userRepository.findActive();
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
   * Mengambil detail pengguna berdasarkan ID.
   * @param {string} userId - ID pengguna.
   * @returns {Object} Objek respon data pengguna atau error.
   */
  getUserById(userId) {
    const user = this.userRepository.findById(userId);
    if (!user) return { success: false, error: "User tidak ditemukan" };
    return {
      success: true,
      data: { id: user.id, username: user.username, fullName: user.fullName },
    };
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = UserController;
} else {
  window.UserController = UserController;
}
