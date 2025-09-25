# Test Suite for depmanager

This directory contains the test suite for the depmanager CLI tool.

## Setup

Tests are configured with Jest and include:
- Unit tests for core functionality
- Test helpers for creating temporary projects
- Coverage reporting

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Structure

### Core Tests (`core.test.js`)
- Tests for `getYarnVersionType()` function
- Tests for `getWorkspaceInfo()` function
- Covers edge cases and error handling

### Test Helpers (`setup.js`)
Global test utilities:
- `createTempDir()` - Creates temporary test directories
- `cleanupTempDir()` - Cleans up test directories
- `createPackageJson()` - Creates test package.json files
- `createLockFile()` - Creates test lock files

## Test Coverage

Current test coverage focuses on core functionality:
- Package manager version detection
- Workspace configuration parsing
- Error handling for invalid configurations

## Adding Tests

To add new tests:
1. Create a new `.test.js` file in this directory
2. Add it to the `testMatch` pattern in `jest.config.js`
3. Use the helper functions from `setup.js`
4. Follow the existing test patterns

## Mock Strategy

Tests use Jest mocks for:
- File system operations
- External command execution
- Network requests

This ensures tests are fast, reliable, and don't depend on external systems.

## Future Improvements

Areas for expanded test coverage:
- CLI command integration tests
- Security audit functionality
- Error recovery scenarios
- Cross-platform compatibility
- Performance testing with large workspaces
