/**
 * Model Task (Tugas)
 * File ini mengatur bentuk data tugas, seperti judul, prioritas, dan statusnya.
 */
class Task {
    constructor(title, description, priority = 'medium') {
        // Cek apakah judul diisi
        if (!title || title.trim() === '') {
            throw new Error('Judul tugas wajib diisi');
        }
        
        // Data Pribadi Tugas (Disimpan dalam sistem)
        this._id = this._generateId();
        this._title = title.trim();
        this._description = description ? description.trim() : '';
        this._priority = this._validatePriority(priority);
        this._completed = false; // Awalnya tugas belum selesai
        this._createdAt = new Date(); // Waktu dibuat
        this._updatedAt = new Date(); // Waktu terakhir diubah
    }
    
    // --- Pengambil Data (Getters) ---
    get id() { return this._id; }
    get title() { return this._title; }
    get description() { return this._description; }
    get priority() { return this._priority; }
    get completed() { return this._completed; }
    get createdAt() { return this._createdAt; }
    get updatedAt() { return this._updatedAt; }
    
    // --- Tindakan pada Tugas ---
    
    // Tandai tugas selesai
    markComplete() {
        this._completed = true;
        this._updatedAt = new Date();
    }
    
    // Tandai tugas belum selesai
    markIncomplete() {
        this._completed = false;
        this._updatedAt = new Date();
    }
    
    // Ubah judul
    updateTitle(newTitle) {
        if (!newTitle || newTitle.trim() === '') {
            throw new Error('Judul tugas tidak boleh kosong');
        }
        this._title = newTitle.trim();
        this._updatedAt = new Date();
    }
    
    // Ubah deskripsi
    updateDescription(newDescription) {
        this._description = newDescription ? newDescription.trim() : '';
        this._updatedAt = new Date();
    }
    
    // Ubah prioritas
    updatePriority(newPriority) {
        this._priority = this._validatePriority(newPriority);
        this._updatedAt = new Date();
    }
    
    // Mengubah data tugas menjadi format yang bisa disimpan (JSON)
    toJSON() {
        return {
            id: this._id,
            title: this._title,
            description: this._description,
            priority: this._priority,
            completed: this._completed,
            createdAt: this._createdAt.toISOString(),
            updatedAt: this._updatedAt.toISOString()
        };
    }
    
    // Membuat Tugas baru dari data yang tersimpan
    static fromJSON(data) {
        const task = new Task(data.title, data.description, data.priority);
        task._id = data.id;
        task._completed = data.completed;
        task._createdAt = new Date(data.createdAt);
        task._updatedAt = new Date(data.updatedAt);
        return task;
    }
    
    // --- Fungsi Pembantu (Private) ---
    
    // Membuat ID unik secara acak
    _generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Memastikan prioritas valid (rendah/sedang/tinggi)
    _validatePriority(priority) {
        const validPriorities = ['low', 'medium', 'high'];
        if (!validPriorities.includes(priority)) {
            // Jika prioritas tidak dikenal, anggap saja medium
            return 'medium'; 
        }
        return priority;
    }
}

// Ekspor agar bisa dipakai file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Task;
} else {
    window.Task = Task;
}