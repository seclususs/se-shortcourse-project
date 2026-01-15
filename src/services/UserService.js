class UserService {
  /**
   * Membuat instance UserService.
   * @constructor
   * @param {UserRepository} userRepository - Repository pengguna.
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Mendaftarkan pengguna baru.
   * @param {Object} userData - Data pengguna.
   * @returns {User} Pengguna yang berhasil didaftarkan.
   * @throws {Error} Jika validasi gagal.
   */
  register(userData) {
    if (!userData.username || userData.username.trim() === "") {
      throw new Error("Username wajib diisi");
    }
    if (!userData.email || userData.email.trim() === "") {
      throw new Error("Email wajib diisi");
    }
    return this.userRepository.create(userData);
  }

  /**
   * Melakukan login pengguna.
   * @param {string} username - Username pengguna.
   * @returns {User} Pengguna yang berhasil login.
   * @throws {Error} Jika pengguna tidak ditemukan atau tidak aktif.
   */
  login(username) {
    if (!username || username.trim() === "") {
      throw new Error("Username wajib diisi");
    }
    const user = this.userRepository.findByUsername(username);
    if (!user) {
      throw new Error("Pengguna tidak ditemukan");
    }
    if (!user.isActive) {
      throw new Error("Akun tidak aktif");
    }
    this.userRepository.recordLogin(user.id);
    return user;
  }

  /**
   * Mendapatkan semua pengguna aktif.
   * @returns {User[]} Daftar pengguna aktif.
   */
  getAllUsers() {
    return this.userRepository.findActive();
  }

  /**
   * Mendapatkan pengguna berdasarkan ID.
   * @param {string} userId - ID pengguna.
   * @returns {User} Instance pengguna.
   * @throws {Error} Jika pengguna tidak ditemukan.
   */
  getUserById(userId) {
    const user = this.userRepository.findById(userId);
    if (!user) throw new Error("User tidak ditemukan");
    return user;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = UserService;
} else {
  window.UserService = UserService;
}
