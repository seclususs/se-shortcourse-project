if (typeof require !== "undefined" && typeof module !== "undefined") {
  if (typeof User === "undefined") {
    global.User = require("../models/User");
  }
}

class UserRepository {
  /**
   * Membuat instance UserRepository.
   * @constructor
   * @param {StorageManager} storageManager - Instance StorageManager.
   */
  constructor(storageManager) {
    this.storage = storageManager;
    this.users = new Map();
    this.storageKey = "users";
    this._loadUsersFromStorage();
  }

  /**
   * Membuat user baru.
   * @param {Object} userData - Data user.
   * @returns {User} User yang baru dibuat.
   * @throws {Error} Jika username atau email sudah ada.
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
   * Mencari user berdasarkan ID.
   * @param {string} id - ID user.
   * @returns {User|null} User atau null.
   */
  findById(id) {
    return this.users.get(id) || null;
  }

  /**
   * Mencari user berdasarkan username.
   * @param {string} username - Username.
   * @returns {User|null} User atau null.
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
   * Mencari user berdasarkan email.
   * @param {string} email - Email.
   * @returns {User|null} User atau null.
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
   * Mendapatkan semua user.
   * @returns {User[]} Array user.
   */
  findAll() {
    return Array.from(this.users.values());
  }

  /**
   * Mendapatkan semua user yang aktif.
   * @returns {User[]} Array user aktif.
   */
  findActive() {
    return this.findAll().filter((user) => user.isActive);
  }

  /**
   * Mencatat login user.
   * @param {string} id - ID user.
   * @returns {User|null} User yang login atau null.
   */
  recordLogin(id) {
    const user = this.findById(id);
    if (user) {
      user.recordLogin();
      this._saveUsersToStorage();
    }
    return user;
  }

  /**
   * Memuat user dari storage ke memory.
   * @private
   */
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

  /**
   * Menyimpan semua user dari memory ke storage.
   * @private
   */
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
