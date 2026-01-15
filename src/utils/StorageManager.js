class StorageManager {
  /**
   * Membuat instance StorageManager.
   * @constructor
   * @param {string} [appName="taskManagementApp"] - Nama aplikasi untuk prefix key.
   * @param {string} [version="2.0"] - Versi aplikasi.
   */
  constructor(appName = "taskManagementApp", version = "2.0") {
    this.appName = appName;
    this.version = version;
    this.isAvailable = this._checkStorageAvailability();
    if (this.isAvailable) {
      this._initializeApp();
    }
  }

  /**
   * Menyimpan data ke localStorage.
   * @param {string} entity - Nama entitas (key suffix).
   * @param {any} data - Data yang akan disimpan.
   * @returns {boolean} True jika berhasil, False jika gagal.
   */
  save(entity, data) {
    if (!this.isAvailable) {
      console.warn("localStorage tidak tersedia.");
      return false;
    }
    try {
      const key = this._getKey(entity);
      const dataToSave = {
        data: data,
        timestamp: new Date().toISOString(),
        version: this.version,
      };
      localStorage.setItem(key, JSON.stringify(dataToSave));
      if (entity !== "_metadata") {
        this._updateMetadata(entity, dataToSave.timestamp);
      }
      return true;
    } catch (error) {
      console.error(`Gagal menyimpan ${entity}:`, error);
      return false;
    }
  }

  /**
   * Memuat data dari localStorage.
   * @param {string} entity - Nama entitas (key suffix).
   * @param {any} [defaultValue=null] - Nilai default jika data tidak ditemukan.
   * @returns {any} Data yang dimuat atau nilai default.
   */
  load(entity, defaultValue = null) {
    if (!this.isAvailable) return defaultValue;
    try {
      const key = this._getKey(entity);
      const storedData = localStorage.getItem(key);
      if (!storedData) return defaultValue;
      const parsedData = JSON.parse(storedData);
      return parsedData.data;
    } catch (error) {
      console.error(`Gagal memuat ${entity}:`, error);
      return defaultValue;
    }
  }

  /**
   * Menghapus data dari localStorage.
   * @param {string} entity - Nama entitas yang akan dihapus.
   * @returns {boolean} True jika berhasil.
   */
  remove(entity) {
    if (!this.isAvailable) return false;
    try {
      const key = this._getKey(entity);
      localStorage.removeItem(key);
      this._removeFromMetadata(entity);
      return true;
    } catch (error) {
      console.error(`Gagal menghapus ${entity}:`, error);
      return false;
    }
  }

  /**
   * Mengekspor semua data aplikasi dari localStorage.
   * @returns {Object|null} Objek berisi semua data atau null jika gagal.
   */
  exportData() {
    if (!this.isAvailable) return null;
    try {
      const exportData = {
        appName: this.appName,
        version: this.version,
        exportedAt: new Date().toISOString(),
        data: {},
      };
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.appName)) {
          const value = localStorage.getItem(key);
          exportData.data[key] = JSON.parse(value);
        }
      }
      return exportData;
    } catch (error) {
      console.error("Gagal mengekspor data:", error);
      return null;
    }
  }

  /**
   * Membuat key lengkap dengan prefix aplikasi.
   * @private
   * @param {string} entity - Nama entitas.
   * @returns {string} Key lengkap.
   */
  _getKey(entity) {
    return `${this.appName}_${entity}`;
  }

  /**
   * Memeriksa ketersediaan localStorage.
   * @private
   * @returns {boolean} True jika tersedia.
   */
  _checkStorageAvailability() {
    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Menginisialisasi struktur dasar penyimpanan jika belum ada.
   * @private
   */
  _initializeApp() {
    try {
      const metaKey = this._getKey("_metadata");
      if (!localStorage.getItem(metaKey)) {
        this.save("_metadata", {
          version: this.version,
          createdAt: new Date().toISOString(),
          entities: {},
        });
      }
    } catch (error) {
      console.warn("Gagal inisialisasi storage app:", error);
    }
  }

  /**
   * Memperbarui metadata untuk entitas tertentu.
   * @private
   * @param {string} entity - Nama entitas.
   * @param {string} timestamp - Timestamp update terakhir.
   */
  _updateMetadata(entity, timestamp) {
    const metadata = this.load("_metadata") || { entities: {} };
    if (!metadata.entities) metadata.entities = {};
    metadata.entities[entity] = {
      lastUpdated: timestamp,
      version: this.version,
    };
    this.save("_metadata", metadata);
  }

  /**
   * Menghapus entitas dari metadata.
   * @private
   * @param {string} entity - Nama entitas.
   */
  _removeFromMetadata(entity) {
    const metadata = this.load("_metadata");
    if (metadata && metadata.entities) {
      delete metadata.entities[entity];
      this.save("_metadata", metadata);
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = StorageManager;
} else {
  window.StorageManager = StorageManager;
}
