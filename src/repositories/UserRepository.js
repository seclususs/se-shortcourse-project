/**
 * User Repository - Lapisan abstraksi data untuk entitas User.
 * @class UserRepository
 * @description Mengelola operasi CRUD dan query untuk data pengguna, memisahkan logika bisnis dari detail penyimpanan.
 */
class UserRepository {
  /**
   * @param {EnhancedStorageManager} storageManager - Instance manajer penyimpanan.
   */
  constructor(storageManager) {
    this.storage = storageManager;
    this.users = new Map(); // Cache in-memory
    this.storageKey = "users";
    this._loadUsersFromStorage();
  }

  /**
   * Membuat pengguna baru dan menyimpannya.
   * @param {Object} userData - Data mentah pengguna (username, email, fullName).
   * @returns {User} Instance User yang berhasil dibuat.
   * @throws {Error} Jika username atau email sudah terdaftar.
   */
  create(userData) {
    try {
      if (this.findByUsername(userData.username)) {
        throw new Error(`Username '${userData.username}' sudah digunakan`);
      }
      if (this.findByEmail(userData.email)) {
        throw new Error(`Email '${userData.email}' sudah digunakan`);
      }
      const user = new User(
        userData.username,
        userData.email,
        userData.fullName
      );
      this.users.set(user.id, user);
      this._saveUsersToStorage();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Mencari pengguna berdasarkan ID.
   * @param {string} id - ID pengguna.
   * @returns {User|null} Objek User atau null jika tidak ditemukan.
   */
  findById(id) {
    return this.users.get(id) || null;
  }

  /**
   * Mencari pengguna berdasarkan username.
   * @param {string} username - Username yang dicari (case-insensitive).
   * @returns {User|null} Objek User atau null.
   */
  findByUsername(username) {
    const normalizedUsername = username.toLowerCase();
    for (const user of this.users.values()) {
      if (user.username === normalizedUsername) {
        return user;
      }
    }
    return null;
  }

  /**
   * Mencari pengguna berdasarkan email.
   * @param {string} email - Email yang dicari (case-insensitive).
   * @returns {User|null} Objek User atau null.
   */
  findByEmail(email) {
    const normalizedEmail = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        return user;
      }
    }
    return null;
  }

  /**
   * Mengambil daftar semua pengguna.
   * @returns {User[]} Array berisi semua objek User.
   */
  findAll() {
    return Array.from(this.users.values());
  }

  /**
   * Mengambil daftar pengguna yang statusnya aktif.
   * @returns {User[]} Array objek User aktif.
   */
  findActive() {
    return this.findAll().filter((user) => user.isActive);
  }

  /**
   * Mencatat aktivitas login pengguna dan menyimpan perubahan.
   * @param {string} id - ID pengguna.
   * @returns {User|null} Pengguna yang diperbarui atau null.
   */
  recordLogin(id) {
    const user = this.findById(id);
    if (user) {
      user.recordLogin();
      this._saveUsersToStorage();
    }
    return user;
  }

  // ==============================================================
  // Private Methods
  // ==============================================================

  _loadUsersFromStorage() {
    try {
      const usersData = this.storage.load(this.storageKey, []);
      usersData.forEach((userData) => {
        try {
          const user = User.fromJSON(userData);
          this.users.set(user.id, user);
        } catch (error) {
          console.error("Gagal memuat user:", userData, error);
        }
      });
    } catch (error) {
      console.error("Error memuat users dari storage:", error);
    }
  }

  _saveUsersToStorage() {
    try {
      const usersData = Array.from(this.users.values()).map((user) =>
        user.toJSON()
      );
      this.storage.save(this.storageKey, usersData);
    } catch (error) {
      console.error("Error menyimpan users ke storage:", error);
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = UserRepository;
} else {
  window.UserRepository = UserRepository;
}
