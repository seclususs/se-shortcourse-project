if (typeof require !== "undefined" && typeof module !== "undefined") {
  if (typeof User === "undefined") {
    global.User = require("../models/User");
  }
}

class UserRepository {
  constructor(storageManager) {
    this.storage = storageManager;
    this.users = new Map();
    this.storageKey = "users";
    this._loadUsersFromStorage();
  }

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

  findById(id) {
    return this.users.get(id) || null;
  }

  findByUsername(username) {
    const normalizedUsername = username.toLowerCase();
    for (const user of this.users.values()) {
      if (user.username === normalizedUsername) {
        return user;
      }
    }
    return null;
  }

  findByEmail(email) {
    const normalizedEmail = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        return user;
      }
    }
    return null;
  }

  findAll() {
    return Array.from(this.users.values());
  }

  findActive() {
    return this.findAll().filter((user) => user.isActive);
  }

  recordLogin(id) {
    const user = this.findById(id);
    if (user) {
      user.recordLogin();
      this._saveUsersToStorage();
    }
    return user;
  }

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
