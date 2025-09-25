// Jest setup file
const fs = require('fs');
const path = require('path');

// Mock external commands by default
jest.mock('child_process');

// Helper to create temporary test directories
global.createTempDir = (name = 'test-project') => {
  const tempDir = path.join(__dirname, 'temp', name);
  if (!fs.existsSync(path.dirname(tempDir))) {
    fs.mkdirSync(path.dirname(tempDir), { recursive: true });
  }
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

// Helper to clean up temp directories
global.cleanupTempDir = (tempDir) => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

// Helper to create package.json files
global.createPackageJson = (dir, content = {}) => {
  const defaultPackageJson = {
    name: 'test-project',
    version: '1.0.0',
    dependencies: {
      'react': '^18.0.0',
      'lodash': '^4.17.0'
    },
    devDependencies: {
      'jest': '^29.0.0'
    },
    ...content
  };
  
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(defaultPackageJson, null, 2)
  );
  return defaultPackageJson;
};

// Helper to create lock files
global.createLockFile = (dir, type = 'npm') => {
  if (type === 'npm') {
    fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}');
  } else if (type === 'yarn') {
    fs.writeFileSync(path.join(dir, 'yarn.lock'), '# yarn lockfile v1');
  }
};

// Cleanup after all tests
afterAll(() => {
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
