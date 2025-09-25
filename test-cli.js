#!/usr/bin/env node

/**
 * Simple script to test the CLI tool end-to-end
 * This is useful for manual testing and CI verification
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

async function createTestProject() {
  const testDir = path.join(__dirname, 'test-project');
  
  // Clean up if exists
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  // Create test project
  fs.mkdirSync(testDir);
  
  // Create package.json
  const packageJson = {
    name: 'test-project',
    version: '1.0.0',
    dependencies: {
      'lodash': '^4.17.0'
    },
    devDependencies: {
      'jest': '^28.0.0'
    }
  };
  
  fs.writeFileSync(
    path.join(testDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create package-lock.json
  fs.writeFileSync(path.join(testDir, 'package-lock.json'), '{}');
  
  return testDir;
}

async function testCLI() {
  console.log('🧪 Testing depmanager CLI...\n');
  
  try {
    const testDir = await createTestProject();
    const cliPath = path.join(__dirname, 'dist', 'cli.js');
    
    console.log('✅ Created test project');
    
    // Test info command
    console.log('\n📋 Testing info command...');
    const infoResult = await execPromise(`node ${cliPath} info`, { cwd: testDir });
    console.log(infoResult.stdout);
    
    // Test check command
    console.log('\n📦 Testing check command...');
    const checkResult = await execPromise(`node ${cliPath} check`, { cwd: testDir });
    console.log(checkResult.stdout);
    
    // Test help command
    console.log('\n❓ Testing help command...');
    const helpResult = await execPromise(`node ${cliPath} --help`, { cwd: testDir });
    console.log(helpResult.stdout);
    
    // Clean up
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('\n✅ All CLI tests passed!');
    
  } catch (error) {
    console.error('\n❌ CLI test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testCLI();
}

module.exports = { testCLI };
