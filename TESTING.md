# Testing Guide for depmanager

## Overview

The depmanager project includes a comprehensive testing strategy that covers core functionality, CLI behavior, and real-world usage scenarios.

## Test Types

### 1. Unit Tests ✅
- **Location**: `tests/core.test.js`
- **Coverage**: Core functions like package manager detection and workspace parsing
- **Framework**: Jest
- **Run**: `npm test`
- **Status**: 12 tests passing, fast execution (<1s)

### 2. CLI Integration Tests ✅
- **Location**: `test-cli.js`
- **Coverage**: End-to-end CLI functionality
- **Framework**: Custom script using real CLI execution
- **Run**: `npm run test:cli`
- **Status**: All CLI commands tested and working

### 3. Coverage Reporting ✅
- **Tool**: Jest built-in coverage
- **Formats**: Text, LCOV, HTML
- **Run**: `npm run test:coverage`
- **Status**: Coverage tracking for core functions

## Testing Strategy

### What We Test

✅ **Package Manager Detection**
- Yarn version type detection (1.x vs 2+)
- Lock file presence detection
- Version parsing edge cases

✅ **Workspace Configuration**
- Array format workspaces
- Object format workspaces
- Complex workspace patterns
- Error handling for invalid configurations

✅ **CLI Commands**
- Command execution
- Output format verification
- Error handling
- Help text generation

### What We Mock

- File system operations (for isolation)
- External command execution (for reliability)
- Network requests (for speed)

### What We Don't Mock

- Core logic functions
- JSON parsing
- String manipulation
- Path operations

## Running Tests

```bash
# All tests (12 unit tests)
npm test                 # ✅ Fast execution ~0.1s

# With coverage report
npm run test:coverage    # ✅ Includes HTML coverage report

# CLI integration tests
npm run test:cli         # ✅ Tests real CLI commands

# Watch mode (for development)
npm run test:watch       # ✅ Auto-rerun on file changes
```

## Current Test Status

✅ **All tests passing**
- 12 unit tests in core functionality
- CLI integration tests working
- Coverage reporting enabled
- Fast execution (< 1 second)
- No flaky or timeout issues

## Test Data

Tests use realistic package.json configurations:
- Real project structures
- Common workspace patterns
- Edge cases from popular projects
- Invalid/corrupted configurations

## Coverage Goals

Current coverage focuses on:
- **Core Functions**: 100% for critical paths
- **Error Handling**: All error conditions tested
- **Edge Cases**: Unusual but valid configurations

## Adding New Tests

1. **For new functions**: Add to `tests/core.test.js`
2. **For CLI features**: Update `test-cli.js`
3. **For edge cases**: Add specific test cases
4. **For real-world scenarios**: Add integration tests

## CI/CD Integration

Tests are configured to run in GitHub Actions:
- Multiple Node.js versions (18.x, 20.x, 22.x)
- Coverage reporting
- Automatic test execution on PRs

## Performance

Tests are designed to be fast:
- Unit tests complete in <1 second
- CLI tests complete in <5 seconds
- No network dependencies
- Minimal file system operations

## Debugging Tests

```bash
# Run specific test file
npx jest tests/core.test.js

# Run with debug output
npx jest --verbose

# Run specific test
npx jest -t "should detect yarn2+"
```

## Best Practices

- **Isolation**: Each test is independent
- **Realistic Data**: Use real-world configurations
- **Clear Names**: Test names describe expected behavior
- **Fast Execution**: Tests run quickly for good developer experience
- **Comprehensive Coverage**: Test both happy path and error conditions
