/**
 * Model User - Merepresentasikan pengguna dalam sistem.
 * @class User
 * @description Menangani data pengguna, validasi input, dan logika bisnis terkait profil.
 */
class User {
  /**
   * Membuat instance User baru.
   * @param {string} username - Nama pengguna (wajib, unik, tanpa spasi).
   * @param {string} email - Alamat email (wajib, format valid).
   * @param {string} fullName - Nama lengkap pengguna (opsional).
   * @throws {Error} Jika username atau email tidak valid.
   */
  constructor(username, email, fullName) {
    // Validasi input
    if (!username || username.trim() === "") {
      throw new Error("Username wajib diisi");
    }
    if (!email || !this._isValidEmail(email)) {
      throw new Error("Email tidak valid");
    }

    // Properti privat
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

  // ==============================================================
  // Getters
  // ==============================================================

  /** @returns {string} ID unik pengguna. */
  get id() {
    return this._id;
  }

  /** @returns {string} Username pengguna. */
  get username() {
    return this._username;
  }

  /** @returns {string} Email pengguna. */
  get email() {
    return this._email;
  }

  /** @returns {string} Nama lengkap pengguna. */
  get fullName() {
    return this._fullName;
  }

  /** @returns {string} Peran pengguna (user/admin). */
  get role() {
    return this._role;
  }

  /** @returns {boolean} Status aktif akun. */
  get isActive() {
    return this._isActive;
  }

  /** @returns {Date} Tanggal pembuatan akun. */
  get createdAt() {
    return this._createdAt;
  }

  /** @returns {Date|null} Waktu login terakhir. */
  get lastLoginAt() {
    return this._lastLoginAt;
  }

  /** @returns {Object} Salinan objek preferensi pengguna. */
  get preferences() {
    return { ...this._preferences };
  }

  // ==============================================================
  // Public Methods
  // ==============================================================

  /**
   * Memperbarui profil pengguna.
   * @param {string} fullName - Nama lengkap baru.
   * @param {string} email - Email baru (akan divalidasi).
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
   * Menonaktifkan akun pengguna (Soft delete).
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
   * Serialisasi objek User ke format JSON.
   * @returns {Object} Objek JSON polos.
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
   * Factory method untuk membuat User dari data JSON.
   * @param {Object} data - Data JSON mentah dari penyimpanan.
   * @returns {User} Instance User baru yang terhidrasi.
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

  // ==============================================================
  // Private Methods
  // ==============================================================

  /**
   * Menghasilkan ID unik sederhana.
   * @private
   * @returns {string} ID unik (format: user_timestamp_random).
   */
  _generateId() {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Memvalidasi format email menggunakan Regex.
   * @private
   * @param {string} email - Email yang akan dicek.
   * @returns {boolean} True jika format valid.
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
