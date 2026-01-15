module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: [
        'eslint:recommended'
    ],
    globals: {
        // Day 1 Globals
        Task: 'readonly',
        TaskService: 'readonly',
        StorageManager: 'readonly',
        handleTaskToggle: 'writable',
        handleTaskDelete: 'writable',
        
        // Day 2 Globals
        User: 'readonly',
        UserService: 'readonly',
        UserRepository: 'readonly',
        TaskRepository: 'readonly',
        UserController: 'readonly',
        TaskController: 'readonly',
        TaskView: 'readonly'
    },
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    //rules: {
        // Basic rules for educational purposes
    //    'no-unused-vars': 'warn',
    //    'no-console': 'off', // Allow console.log for learning
    //    'indent': ['error', 4],
    //    'quotes': ['error', 'single'],
    //    'semi': ['error', 'always']
    //}
};