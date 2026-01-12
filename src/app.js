/**
 * Aplikasi Utama (App.js)
 * Menghubungkan semua komponen: Tampilan, Data, dan Logika.
 */

// Variabel Global
let taskService;
let storageManager;

/**
 * Memulai Aplikasi
 */
function initializeApp() {
    console.log('🚀 Memulai Sistem Manajemen Tugas...');
    
    // Siapkan penyimpanan
    storageManager = new StorageManager('aplikasiTugas');
    
    // Siapkan layanan tugas
    taskService = new TaskService(storageManager);
    
    // Siapkan pendengar tombol (klik, submit, dll)
    setupEventListeners();
    
    // Dengarkan perubahan data agar tampilan selalu update
    taskService.addListener(handleTaskServiceEvent);
    
    // Tampilkan data awal
    renderTaskList();
    renderTaskStats();
    
    console.log('✅ Aplikasi siap digunakan!');
}

/**
 * Menyiapkan Pendengar Tombol (Event Listeners)
 */
function setupEventListeners() {
    // Formulir pembuatan tugas
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskFormSubmit);
    }
    
    // Tombol hapus semua
    const clearAllBtn = document.getElementById('clearAllTasks');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', handleClearAllTasks);
    }
    
    // Tombol filter
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });
}

/**
 * Saat Formulir Tugas Dikirim
 */
function handleTaskFormSubmit(event) {
    event.preventDefault(); // Mencegah halaman refresh
    
    const formData = new FormData(event.target);
    const title = formData.get('title')?.trim();
    const description = formData.get('description')?.trim();
    const priority = formData.get('priority') || 'medium';
    
    if (!title) {
        showMessage('Harap masukkan judul tugas', 'error');
        return;
    }
    
    try {
        const task = taskService.createTask(title, description, priority);
        showMessage(`Tugas "${task.title}" berhasil dibuat!`, 'success');
        
        // Kosongkan formulir
        event.target.reset();
        
        // Fokuskan kursor kembali ke input judul
        const titleInput = document.getElementById('taskTitle');
        if (titleInput) titleInput.focus();
        
    } catch (error) {
        showMessage(`Gagal membuat tugas: ${error.message}`, 'error');
    }
}

/**
 * Saat Ada Perubahan Data
 */
function handleTaskServiceEvent(eventType, data) {
    // Render ulang tampilan jika ada data berubah
    renderTaskList();
    renderTaskStats();
}

/**
 * Saat Status Tugas Diubah (Selesai/Belum)
 */
function handleTaskToggle(taskId) {
    const task = taskService.getTaskById(taskId);
    if (!task) return;
    
    try {
        taskService.updateTask(taskId, { completed: !task.completed });
        const status = task.completed ? 'belum selesai' : 'selesai';
        showMessage(`Status tugas diubah menjadi ${status}`, 'info');
    } catch (error) {
        showMessage(`Gagal mengubah status: ${error.message}`, 'error');
    }
}

/**
 * Saat Tugas Dihapus
 */
function handleTaskDelete(taskId) {
    const task = taskService.getTaskById(taskId);
    if (!task) return;
    
    if (confirm(`Apakah Anda yakin ingin menghapus tugas "${task.title}"?`)) {
        if (taskService.deleteTask(taskId)) {
            showMessage('Tugas berhasil dihapus', 'info');
        } else {
            showMessage('Gagal menghapus tugas', 'error');
        }
    }
}

/**
 * Saat Menghapus Semua Tugas
 */
function handleClearAllTasks() {
    const taskCount = taskService.getAllTasks().length;
    
    if (taskCount === 0) {
        showMessage('Tidak ada tugas untuk dihapus', 'info');
        return;
    }
    
    if (confirm(`Yakin ingin menghapus SEMUA (${taskCount}) tugas? Tindakan ini tidak bisa dibatalkan.`)) {
        taskService.clearAllTasks();
        showMessage('Semua tugas berhasil dibersihkan', 'info');
    }
}

/**
 * Saat Filter Berubah
 */
function handleFilterChange(event) {
    const filterType = event.target.dataset.filter;
    
    // Ubah tombol yang aktif
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Tampilkan ulang daftar dengan filter
    renderTaskList(filterType);
}

/**
 * Menampilkan Daftar Tugas (Rendering)
 */
function renderTaskList(filter = 'all') {
    const taskListContainer = document.getElementById('taskList');
    if (!taskListContainer) return;
    
    let tasks = taskService.getAllTasks();
    
    // Terapkan filter
    switch (filter) {
        case 'pending': // Belum Selesai
            tasks = tasks.filter(task => !task.completed);
            break;
        case 'completed': // Selesai
            tasks = tasks.filter(task => task.completed);
            break;
        case 'high': // Tinggi
            tasks = tasks.filter(task => task.priority === 'high');
            break;
        case 'medium': // Sedang
            tasks = tasks.filter(task => task.priority === 'medium');
            break;
        case 'low': // Rendah
            tasks = tasks.filter(task => task.priority === 'low');
            break;
    }
    
    // Urutkan: Tugas terbaru paling atas
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (tasks.length === 0) {
        taskListContainer.innerHTML = `
            <div class="empty-state">
                <p>Tidak ada tugas ditemukan</p>
                <small>Silakan buat tugas baru menggunakan formulir di atas</small>
            </div>
        `;
        return;
    }
    
    const taskHTML = tasks.map(task => createTaskHTML(task)).join('');
    taskListContainer.innerHTML = taskHTML;
}

/**
 * Membuat Kode HTML untuk Satu Kotak Tugas
 */
function createTaskHTML(task) {
    const priorityClass = `priority-${task.priority}`;
    const completedClass = task.completed ? 'completed' : '';
    
    // Format tanggal ke Indonesia
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const createdDate = new Date(task.createdAt).toLocaleDateString('id-ID', dateOptions);
    
    // Terjemahkan prioritas untuk tampilan
    const priorityLabel = {
        'high': 'Tinggi',
        'medium': 'Sedang',
        'low': 'Rendah'
    }[task.priority] || task.priority;
    
    return `
        <div class="task-item ${priorityClass} ${completedClass}" data-task-id="${task.id}">
            <div class="task-content">
                <div class="task-header">
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <span class="task-priority">${priorityLabel}</span>
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <small>Dibuat: ${createdDate}</small>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn btn-toggle" onclick="handleTaskToggle('${task.id}')" title="${task.completed ? 'Tandai belum selesai' : 'Tandai selesai'}">
                    ${task.completed ? 'Batal Selesai' : 'Selesai'}
                </button>
                <button class="btn btn-delete" onclick="handleTaskDelete('${task.id}')" title="Hapus tugas">
                    Hapus
                </button>
            </div>
        </div>
    `;
}

/**
 * Menampilkan Statistik Tugas
 */
function renderTaskStats() {
    const statsContainer = document.getElementById('taskStats');
    if (!statsContainer) return;
    
    const stats = taskService.getTaskStats();
    
    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-number">${stats.total}</span>
                <span class="stat-label">Total Tugas</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${stats.pending}</span>
                <span class="stat-label">Belum Selesai</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${stats.completed}</span>
                <span class="stat-label">Selesai</span>
            </div>
            <div class="stat-item priority-high">
                <span class="stat-number">${stats.byPriority.high}</span>
                <span class="stat-label">Prioritas Tinggi</span>
            </div>
        </div>
    `;
}

/**
 * Menampilkan Pesan Notifikasi (Pojok Kanan Atas)
 */
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messages');
    if (!messageContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    messageContainer.appendChild(messageElement);
    
    // Hilang otomatis setelah 3 detik
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 3000);
}

/**
 * Mencegah kode berbahaya (XSS) saat menampilkan teks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Jalankan aplikasi saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', initializeApp);

// Ekspor fungsi agar bisa diakses global (oleh tombol di HTML)
window.handleTaskToggle = handleTaskToggle;
window.handleTaskDelete = handleTaskDelete;