class User {
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

  get id() {
    return this._id;
  }

  get username() {
    return this._username;
  }

  get email() {
    return this._email;
  }

  get fullName() {
    return this._fullName;
  }

  get role() {
    return this._role;
  }

  get isActive() {
    return this._isActive;
  }

  get createdAt() {
    return this._createdAt;
  }

  get lastLoginAt() {
    return this._lastLoginAt;
  }

  get preferences() {
    return { ...this._preferences };
  }

  updateProfile(fullName, email) {
    if (email && !this._isValidEmail(email)) {
      throw new Error("Email tidak valid");
    }
    if (fullName) this._fullName = fullName.trim();
    if (email) this._email = email.trim().toLowerCase();
  }

  updatePreferences(newPreferences) {
    this._preferences = {
      ...this._preferences,
      ...newPreferences,
    };
  }

  recordLogin() {
    this._lastLoginAt = new Date();
  }

  deactivate() {
    this._isActive = false;
  }

  activate() {
    this._isActive = true;
  }

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

  _generateId() {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

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
