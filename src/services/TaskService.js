/**
 * TaskService (Layanan Tugas)
 * Mengatur logika bisnis: menambah, mengubah, dan menghapus tugas.
 * Menghubungkan antara data (Task) dan penyimpanan (StorageManager).
 */
class TaskService {
    constructor(storageManager) {
        this.storage = storageManager;
        this.tasks = new Map(); // Daftar tugas sementara di memori
        this.listeners = new Set(); // Pendengar acara (event listeners)
        
        // Muat tugas yang tersimpan saat aplikasi dimulai
        this._loadTasksFromStorage();
    }
    
    /**
     * Membuat tugas baru
     */
    createTask(title, description, priority) {
        try {
            const task = new Task(title, description, priority);
            
            this.tasks.set(task.id, task);
            this._saveTasksToStorage();
            this._notifyListeners('taskCreated', task);
            
            return task;
        } catch (error) {
            console.error('Gagal membuat tugas:', error);
            throw error;
        }
    }
    
    /**
     * Mengambil semua tugas
     */
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    
    /**
     * Mengambil satu tugas berdasarkan ID
     */
    getTaskById(id) {
        return this.tasks.get(id) || null;
    }
    
    /**
     * Memperbarui tugas
     */
    updateTask(id, updates) {
        const task = this.tasks.get(id);
        if (!task) return null;
        
        try {
            if (updates.title !== undefined) task.updateTitle(updates.title);
            if (updates.description !== undefined) task.updateDescription(updates.description);
            if (updates.priority !== undefined) task.updatePriority(updates.priority);
            if (updates.completed !== undefined) {
                if (updates.completed) task.markComplete();
                else task.markIncomplete();
            }
            
            this._saveTasksToStorage();
            this._notifyListeners('taskUpdated', task);
            return task;
        } catch (error) {
            console.error('Gagal memperbarui tugas:', error);
            throw error;
        }
    }
    
    /**
     * Menghapus tugas
     */
    deleteTask(id) {
        const task = this.tasks.get(id);
        if (!task) return false;
        
        this.tasks.delete(id);
        this._saveTasksToStorage();
        this._notifyListeners('taskDeleted', task);
        return true;
    }
    
    /**
     * Menghapus SEMUA tugas
     */
    clearAllTasks() {
        this.tasks.clear();
        this._saveTasksToStorage();
        this._notifyListeners('allTasksCleared');
        return true;
    }
    
    /**
     * Statistik Tugas (Jumlah total, selesai, tertunda)
     */
    getTaskStats() {
        const allTasks = this.getAllTasks();
        const completed = allTasks.filter(task => task.completed);
        const pending = allTasks.filter(task => !task.completed);
        
        const byPriority = {
            high: allTasks.filter(task => task.priority === 'high').length,
            medium: allTasks.filter(task => task.priority === 'medium').length,
            low: allTasks.filter(task => task.priority === 'low').length
        };
        
        return {
            total: allTasks.length,
            completed: completed.length,
            pending: pending.length,
            byPriority
        };
    }
    
    // Menambah pendengar event (agar tampilan tahu kalau data berubah)
    addListener(listener) {
        this.listeners.add(listener);
    }
    
    // Fungsi internal untuk memuat dari penyimpanan
    _loadTasksFromStorage() {
        const tasksData = this.storage.load('tasks', []);
        tasksData.forEach(taskData => {
            try {
                const task = Task.fromJSON(taskData);
                this.tasks.set(task.id, task);
            } catch (error) {
                console.error('Gagal memuat tugas:', error);
            }
        });
    }
    
    // Fungsi internal untuk menyimpan ke penyimpanan
    _saveTasksToStorage() {
        const tasksData = this.getAllTasks().map(task => task.toJSON());
        this.storage.save('tasks', tasksData);
    }
    
    // Memberitahu pendengar bahwa ada perubahan
    _notifyListeners(eventType, data) {
        this.listeners.forEach(listener => {
            try {
                listener(eventType, data);
            } catch (error) {
                console.error('Error pada listener:', error);
            }
        });
    }
}

// Ekspor
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskService;
} else {
    window.TaskService = TaskService;
}