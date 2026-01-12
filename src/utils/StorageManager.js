/**
 * StorageManager (Pengelola Penyimpanan)
 * Bertugas menyimpan dan mengambil data dari memori browser.
 */
class StorageManager {
    constructor(storageKey = 'aplikasiTugas') {
        this.storageKey = storageKey;
        this.isAvailable = this._checkStorageAvailability();
    }
    
    /**
     * Menyimpan data
     */
    save(key, data) {
        if (!this.isAvailable) return false;
        
        try {
            const fullKey = `${this.storageKey}_${key}`;
            const jsonData = JSON.stringify(data);
            localStorage.setItem(fullKey, jsonData);
            return true;
        } catch (error) {
            console.error('Gagal menyimpan data:', error);
            return false;
        }
    }
    
    /**
     * Mengambil data
     */
    load(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;
        
        try {
            const fullKey = `${this.storageKey}_${key}`;
            const jsonData = localStorage.getItem(fullKey);
            
            if (jsonData === null) {
                return defaultValue;
            }
            
            return JSON.parse(jsonData);
        } catch (error) {
            console.error('Gagal memuat data:', error);
            return defaultValue;
        }
    }
    
    /**
     * Menghapus satu data
     */
    remove(key) {
        if (!this.isAvailable) return false;
        
        try {
            const fullKey = `${this.storageKey}_${key}`;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Gagal menghapus data:', error);
            return false;
        }
    }
    
    /**
     * Menghapus SEMUA data aplikasi
     */
    clear() {
        if (!this.isAvailable) return false;
        
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storageKey)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Gagal membersihkan data:', error);
            return false;
        }
    }
    
    // Cek apakah memori browser tersedia
    _checkStorageAvailability() {
        try {
            const testKey = '__tes_penyimpanan__';
            localStorage.setItem(testKey, 'tes');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Ekspor agar bisa dipakai file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
} else {
    window.StorageManager = StorageManager;
}