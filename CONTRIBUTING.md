# Contributing to Task Management System

Thank you for your interest in contributing to our Task Management System! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## Getting Started

### Prerequisites
- Node.js 14+ installed
- Git installed and configured
- Text editor or IDE of your choice

### Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/seclususs/se-shortcourse-project.git
   cd se-shortcourse-project
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Run tests to ensure everything works:
   ```bash
   npm test
   ```

## Development Workflow

We use a feature branch workflow:

### 1. Create a Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes
- Write code following our coding standards
- Add tests for new functionality
- Update documentation as needed
- Test your changes thoroughly

### 3. Commit Your Changes
```bash
git add .
git commit -m "feat: add new task filtering functionality"
```

### 4. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```
Then create a pull request through GitHub.

## Coding Standards

### JavaScript Style Guide
- Use ES6+ features when appropriate
- Use meaningful variable and function names
- Keep functions small and focused (single responsibility)
- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Use JSDoc for function documentation

### Example:
```javascript
/**
 * Filters tasks based on the provided criteria
 * @param {Array} tasks - Array of task objects
 * @param {Object} filter - Filter criteria
 * @param {string} filter.status - Task status ('all', 'complete', 'incomplete')
 * @param {string} filter.priority - Task priority ('all', 'high', 'medium', 'low')
 * @returns {Array} Filtered array of tasks
 */
function filterTasks(tasks, filter) {
  return tasks.filter(task => {
    const statusMatch = filter.status === 'all' || 
      (filter.status === 'complete' && task.completed) ||
      (filter.status === 'incomplete' && !task.completed);
    
    const priorityMatch = filter.priority === 'all' || 
      task.priority === filter.priority;
    
    return statusMatch && priorityMatch;
  });
}
```

### CSS Style Guide
- Use meaningful class names
- Follow BEM methodology when appropriate
- Use CSS custom properties for theming
- Keep specificity low
- Group related properties together

### HTML Guidelines
- Use semantic HTML elements
- Include proper accessibility attributes
- Validate HTML markup
- Use meaningful alt text for images

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples
```bash
feat: add task search functionality
fix: resolve task deletion bug
docs: update API documentation
test: add unit tests for task validation
refactor: improve task sorting algorithm
style: fix code formatting issues
```

### Detailed Commit Message
```
feat(tasks): add advanced filtering options

- Add filter by due date range
- Add filter by creation date
- Add combined filter functionality
- Update UI to show active filters

Closes #123
```

## Pull Request Process

### Before Submitting
1. Ensure your code follows the coding standards
2. Run all tests and ensure they pass
3. Update documentation if needed
4. Rebase your branch on the latest main branch
5. Write a clear pull request description

### Pull Request Template
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review of code completed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Corresponding changes to documentation made
- [ ] No new warnings generated
```

### Review Process
1. At least one team member must review the PR
2. All automated checks must pass
3. Address all review comments
4. Maintain a clean commit history
5. Squash commits if necessary before merging

## Testing Guidelines

### Unit Tests
- Write tests for all new functions and classes
- Aim for at least 80% code coverage
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)

### Example Test
```javascript
describe('Task Creation', () => {
  test('should create a task with valid data', () => {
    // Arrange
    const taskData = {
      title: 'Test Task',
      description: 'Test Description',
      priority: 'high'
    };
    
    // Act
    const task = new Task(taskData.title, taskData.description, taskData.priority);
    
    // Assert
    expect(task.title).toBe(taskData.title);
    expect(task.description).toBe(taskData.description);
    expect(task.priority).toBe(taskData.priority);
    expect(task.completed).toBe(false);
  });
});
```

### Integration Tests
- Test component interactions
- Test API endpoints
- Test user workflows
- Use realistic test data

### Running Tests
```bash
npm test                # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

## Documentation

### Code Documentation
- Use JSDoc for function documentation
- Include parameter types and return values
- Provide usage examples for complex functions
- Document any side effects or assumptions

### README Updates
- Keep the README current with new features
- Include setup instructions
- Add usage examples
- Update screenshots if UI changes

### API Documentation
- Document all public APIs
- Include request/response examples
- Document error conditions
- Keep documentation in sync with code

## Issue Reporting

### Bug Reports
Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment information
- Screenshots if applicable

### Feature Requests
Include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation (if any)
- Acceptance criteria

## Questions and Support

- Check existing issues and documentation first
- Use GitHub Discussions for questions
- Tag maintainers for urgent issues
- Be respectful and patient

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Project documentation

Thank you for contributing to make this project better! 🚀