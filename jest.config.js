module.exports = {
    // Environment untuk testing (browser-like)
    testEnvironment: 'jsdom',
    
    // Pattern file test yang akan dijalankan
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    
    // Setup coverage (laporan seberapa banyak kode yang di-test)
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'html'],
    
    // File mana saja yang akan di-cover
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!**/node_modules/**'
    ],
    
    // Output yang detail untuk pembelajaran
    verbose: true,
    
    // Clear mocks antar test
    clearMocks: true
};