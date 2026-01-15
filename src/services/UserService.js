class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  register(userData) {
    if (!userData.username || userData.username.trim() === "") {
      throw new Error("Username wajib diisi");
    }
    if (!userData.email || userData.email.trim() === "") {
      throw new Error("Email wajib diisi");
    }
    return this.userRepository.create(userData);
  }

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

  getAllUsers() {
    return this.userRepository.findActive();
  }

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
