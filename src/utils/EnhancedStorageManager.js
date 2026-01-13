/**
 * Enhanced Storage Manager - Mengelola penyimpanan lokal dengan fitur lanjutan.
 * @class EnhancedStorageManager
 * @description Menyediakan antarmuka untuk menyimpan, memuat, dan mengelola data aplikasi di localStorage dengan dukungan multi-entitas.
 */
class EnhancedStorageManager {
  /**
   * @param {string} appName - Namespace aplikasi (default: 'taskManagementApp').
   * @param {string} version - Versi data (default: '2.0').
   */
  constructor(appName = "taskManagementApp", version = "2.0") {
    this.appName = appName;
    this.version = version;
    this.isAvailable = this._checkStorageAvailability();
    this._initializeApp();
  }

  /**
   * Menyimpan data untuk entitas tertentu.
   * @param {string} entity - Nama entitas (misal: 'users', 'tasks').
   * @param {any} data - Data yang akan disimpan (akan diserialisasi ke JSON).
   * @returns {boolean} True jika penyimpanan berhasil, False jika gagal.
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
      this._updateMetadata(entity, dataToSave.timestamp);
      return true;
    } catch (error) {
      console.error(`Gagal menyimpan ${entity}:`, error);
      return false;
    }
  }

  /**
   * Memuat data untuk entitas tertentu.
   * @param {string} entity - Nama entitas yang akan dimuat.
   * @param {any} defaultValue - Nilai yang dikembalikan jika data tidak ditemukan (default: null).
   * @returns {any} Data yang tersimpan atau defaultValue.
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
   * Menghapus data entitas tertentu dari penyimpanan.
   * @param {string} entity - Nama entitas yang akan dihapus.
   * @returns {boolean} True jika berhasil dihapus.
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
   * Mengekspor semua data aplikasi untuk keperluan backup.
   * @returns {Object|null} Objek berisi seluruh data aplikasi atau null jika gagal.
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

  // ==============================================================
  // Private Helpers
  // ==============================================================

  _getKey(entity) {
    return `${this.appName}_${entity}`;
  }

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

  _initializeApp() {
    if (!this.load("_metadata")) {
      this.save("_metadata", {
        version: this.version,
        createdAt: new Date().toISOString(),
        entities: {},
      });
    }
  }

  _updateMetadata(entity, timestamp) {
    const metadata = this.load("_metadata") || { entities: {} };
    if (!metadata.entities) metadata.entities = {};
    metadata.entities[entity] = {
      lastUpdated: timestamp,
      version: this.version,
    };
    this.save("_metadata", metadata);
  }

  _removeFromMetadata(entity) {
    const metadata = this.load("_metadata");
    if (metadata && metadata.entities) {
      delete metadata.entities[entity];
      this.save("_metadata", metadata);
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = EnhancedStorageManager;
} else {
  window.EnhancedStorageManager = EnhancedStorageManager;
}
