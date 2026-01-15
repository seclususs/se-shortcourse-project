class User {
  /**
   * Membuat instance User baru.
   * @constructor
   * @param {string} username - Nama pengguna (wajib).
   * @param {string} email - Alamat email pengguna (wajib).
   * @param {string} fullName - Nama lengkap pengguna.
   * @throws {Error} Jika username kosong atau email tidak valid.
   */
  constructor(username, email, fullName) {
    if (!username || username.trim() === "") {
      throw new Error("Username wajib diisi");
    }
    if (!email || !this._isValidEmail(email)) {
      throw new Error("Email tidak valid");
    }
    this._id = this._generateId();
    this._username = username.trim().toLowerCase();
    this._email = email.trim().toLowerCase();
    this._fullName = fullName ? fullName.trim() : "";
    this._role = "user";
    this._isActive = true;
    this._createdAt = new Date();
    this._lastLoginAt = null;
    this._preferences = {
      theme: "light",
      defaultCategory: "personal",
      emailNotifications: true,
    };
  }

  /**
   * Mendapatkan ID pengguna.
   * @returns {string} ID pengguna.
   */
  get id() {
    return this._id;
  }

  /**
   * Mendapatkan username.
   * @returns {string} Username.
   */
  get username() {
    return this._username;
  }

  /**
   * Mendapatkan email.
   * @returns {string} Email.
   */
  get email() {
    return this._email;
  }

  /**
   * Mendapatkan nama lengkap.
   * @returns {string} Nama lengkap.
   */
  get fullName() {
    return this._fullName;
  }

  /**
   * Mendapatkan peran pengguna.
   * @returns {string} Peran (role).
   */
  get role() {
    return this._role;
  }

  /**
   * Mengecek apakah pengguna aktif.
   * @returns {boolean} Status aktif.
   */
  get isActive() {
    return this._isActive;
  }

  /**
   * Mendapatkan tanggal pembuatan akun.
   * @returns {Date} Tanggal pembuatan.
   */
  get createdAt() {
    return this._createdAt;
  }

  /**
   * Mendapatkan waktu login terakhir.
   * @returns {Date|null} Waktu login terakhir atau null jika belum pernah.
   */
  get lastLoginAt() {
    return this._lastLoginAt;
  }

  /**
   * Mendapatkan preferensi pengguna.
   * @returns {Object} Objek preferensi.
   */
  get preferences() {
    return { ...this._preferences };
  }

  /**
   * Memperbarui profil pengguna.
   * @param {string} [fullName] - Nama lengkap baru.
   * @param {string} [email] - Email baru.
   * @throws {Error} Jika format email tidak valid.
   */
  updateProfile(fullName, email) {
    if (email && !this._isValidEmail(email)) {
      throw new Error("Email tidak valid");
    }
    if (fullName) this._fullName = fullName.trim();
    if (email) this._email = email.trim().toLowerCase();
  }

  /**
   * Memperbarui preferensi pengguna.
   * @param {Object} newPreferences - Objek preferensi baru untuk digabungkan.
   */
  updatePreferences(newPreferences) {
    this._preferences = {
      ...this._preferences,
      ...newPreferences,
    };
  }

  /**
   * Mencatat waktu login saat ini.
   */
  recordLogin() {
    this._lastLoginAt = new Date();
  }

  /**
   * Menonaktifkan akun pengguna.
   */
  deactivate() {
    this._isActive = false;
  }

  /**
   * Mengaktifkan kembali akun pengguna.
   */
  activate() {
    this._isActive = true;
  }

  /**
   * Mengkonversi objek User ke format JSON.
   * @returns {Object} Representasi JSON dari pengguna.
   */
  toJSON() {
    return {
      id: this._id,
      username: this._username,
      email: this._email,
      fullName: this._fullName,
      role: this._role,
      isActive: this._isActive,
      createdAt: this._createdAt.toISOString(),
      lastLoginAt: this._lastLoginAt ? this._lastLoginAt.toISOString() : null,
      preferences: this._preferences,
    };
  }

  /**
   * Membuat instance User dari data JSON.
   * @static
   * @param {Object} data - Data JSON pengguna.
   * @returns {User} Instance User baru.
   */
  static fromJSON(data) {
    const user = new User(data.username, data.email, data.fullName);
    user._id = data.id;
    user._role = data.role;
    user._isActive = data.isActive;
    user._createdAt = new Date(data.createdAt);
    user._lastLoginAt = data.lastLoginAt ? new Date(data.lastLoginAt) : null;
    user._preferences = data.preferences || user._preferences;
    return user;
  }

  /**
   * Membuat ID unik untuk pengguna.
   * @private
   * @returns {string} ID unik.
   */
  _generateId() {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Memvalidasi format email.
   * @private
   * @param {string} email - Email yang akan divalidasi.
   * @returns {boolean} True jika valid, False jika tidak.
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = User;
} else {
  window.User = User;
}
