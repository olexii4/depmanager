#!/usr/bin/env node

const { program } = require('commander');
const ncu = require('npm-check-updates');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const execPromise = util.promisify(exec);

// Function to get yarn version
async function getYarnVersion() {
  try {
    const { stdout } = await execPromise('yarn --version');
    return stdout.trim();
  } catch (error) {
    return null;
  }
}

// Function to determine yarn version type (1.x or 2+)
function getYarnVersionType(version) {
  if (!version) return null;
  const majorVersion = parseInt(version.split('.')[0]);
  return majorVersion >= 2 ? 'yarn2+' : 'yarn1';
}

// Function to check if project uses workspaces
function getWorkspaceInfo() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    if (packageJson.workspaces) {
      if (Array.isArray(packageJson.workspaces)) {
        return { hasWorkspaces: true, packages: packageJson.workspaces };
      } else if (packageJson.workspaces.packages) {
        return { hasWorkspaces: true, packages: packageJson.workspaces.packages };
      }
    }
    return { hasWorkspaces: false, packages: [] };
  } catch (error) {
    return { hasWorkspaces: false, packages: [] };
  }
}

// Function to detect package manager and version
async function detectPackageManager() {
  const cwd = process.cwd();
  const hasYarnLock = fs.existsSync(path.join(cwd, 'yarn.lock'));
  const hasPackageLock = fs.existsSync(path.join(cwd, 'package-lock.json'));
  
  if (hasYarnLock) {
    const yarnVersion = await getYarnVersion();
    const yarnType = getYarnVersionType(yarnVersion);
    return { 
      manager: 'yarn', 
      version: yarnVersion, 
      type: yarnType,
      displayName: yarnType === 'yarn2+' ? `yarn ${yarnVersion} (2+)` : `yarn ${yarnVersion} (1.x)`
    };
  }
  
  if (hasPackageLock) {
    return { manager: 'npm', version: null, type: 'npm', displayName: 'npm' };
  }
  
  // Default to npm if no lock file is found
  return { manager: 'npm', version: null, type: 'npm', displayName: 'npm (default)' };
}

// Function to check if we're in a JS/TS project
function checkProjectValidity() {
  const cwd = process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ No package.json found in the current directory.');
    console.error('Please run this command in a JavaScript/TypeScript project directory.');
    process.exit(1);
  }
  
  try {
    const packageJson = require(packageJsonPath);
    return packageJson;
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
    process.exit(1);
  }
}

// Function to run npm audit
async function runNpmAudit(directory = process.cwd()) {
  try {
    // Create package-lock.json if it doesn't exist
    if (!fs.existsSync(path.join(directory, 'package-lock.json'))) {
      console.log('📦 Creating package-lock.json for security audit...');
      try {
        await execPromise('npm i --package-lock-only --ignore-scripts', { cwd: directory });
      } catch (installError) {
        console.log('⚠️  Could not create package-lock.json. Audit may not work properly.');
      }
    }
    
    const { stdout } = await execPromise('npm audit --json', { cwd: directory });
    const result = JSON.parse(stdout);
    
    if (result.vulnerabilities && Object.keys(result.vulnerabilities).length === 0) {
      console.log('✅ No vulnerabilities found!');
      return;
    }

    console.log('⚠️  Vulnerabilities found:\n');
    
    Object.entries(result.vulnerabilities).forEach(([pkg, info]) => {
      console.log(`Package: ${pkg}`);
      console.log(`Severity: ${info.severity}`);
      console.log(`Vulnerable versions: ${info.range}`);
      if (info.fixAvailable) {
        console.log(`Fix available: Update to ${info.fixAvailable.version}`);
      }
      console.log(`More info: ${info.url || 'No URL provided'}`);
      console.log('');
    });
    
    console.log(`Found ${result.metadata.vulnerabilities.total} vulnerabilities:`);
    Object.entries(result.metadata.vulnerabilities).forEach(([severity, count]) => {
      if (severity !== 'total' && count > 0) {
        console.log(`  ${severity}: ${count}`);
      }
    });
    
    if (result.metadata.vulnerabilities.critical > 0 || result.metadata.vulnerabilities.high > 0) {
      console.log('\n💡 Run npm audit fix to automatically fix vulnerabilities');
    }
  } catch (error) {
    if (error.message.includes('No issues found')) {
      console.log('✅ No vulnerabilities found!');
    } else {
      console.log('❌ Security audit could not be completed for this configuration.');
      console.log('💡 This may be due to workspace setup or missing lock files.');
      console.log('   Try running the security audit directly with your package manager.');
    }
  }
}

// Function to run yarn audit (works for both yarn 1.x and 2+)
async function runYarnAudit(directory = process.cwd(), yarnType) {
  try {
    let auditCommand = 'yarn audit';
    
    // Yarn 2+ uses different syntax
    if (yarnType === 'yarn2+') {
      auditCommand = 'yarn npm audit';
    }
    
    const { stdout, stderr } = await execPromise(auditCommand, { cwd: directory });
    
    // Check if no vulnerabilities found
    if (stdout.includes('No known vulnerabilities found') || 
        stderr.includes('No known vulnerabilities found') ||
        stdout.includes('0 vulnerabilities found')) {
      console.log('✅ No vulnerabilities found!');
      return;
    }
    
    // Parse and display vulnerabilities
    console.log('⚠️  Vulnerabilities found:\n');
    
    // Simple parsing for yarn output
    const lines = stdout.split('\n');
    let vulnCount = 0;
    
    lines.forEach(line => {
      if (line.includes('vulnerabilities found') || line.includes('vulnerability found')) {
        const match = line.match(/(\d+)\s+vulnerabilit/);
        if (match) {
          vulnCount = parseInt(match[1]);
        }
      }
    });
    
    if (vulnCount > 0) {
      console.log(stdout);
      console.log(`\nFound ${vulnCount} vulnerabilities`);
      console.log('\n💡 Run yarn upgrade to update vulnerable dependencies');
    } else {
      console.log('✅ No vulnerabilities found!');
    }
  } catch (error) {
    // If yarn audit completely fails, skip npm fallback for workspace root
    // since npm audit requires npm-style lock files
    if (directory !== process.cwd() || !getWorkspaceInfo().hasWorkspaces) {
      console.log('⚠️  Yarn audit failed or not supported. Falling back to npm audit...\n');
      await runNpmAudit(directory);
    } else {
      console.log('⚠️  Security audit not available for this workspace configuration.');
      console.log('💡  Try running the audit directly with yarn or check individual workspace packages.');
    }
  }
}

// Function to run security audit based on package manager
async function runSecurityAudit(pmInfo) {
  const workspaceInfo = getWorkspaceInfo();
  
  if (workspaceInfo.hasWorkspaces) {
    console.log('📦 Detected workspace project\n');
    
    // Check root project
    console.log('Checking root project...');
    if (pmInfo.manager === 'yarn') {
      await runYarnAudit(process.cwd(), pmInfo.type);
    } else {
      await runNpmAudit(process.cwd());
    }
    
    // Check workspace packages
    for (const pattern of workspaceInfo.packages) {
      const basePath = pattern.replace('/*', '');
      if (fs.existsSync(path.join(process.cwd(), basePath))) {
        const entries = fs.readdirSync(path.join(process.cwd(), basePath));
        for (const entry of entries) {
          const packagePath = path.join(process.cwd(), basePath, entry);
          if (fs.statSync(packagePath).isDirectory() && fs.existsSync(path.join(packagePath, 'package.json'))) {
            console.log(`\nChecking workspace: ${path.relative(process.cwd(), packagePath)}`);
            if (pmInfo.manager === 'yarn') {
              await runYarnAudit(packagePath, pmInfo.type);
            } else {
              await runNpmAudit(packagePath);
            }
          }
        }
      }
    }
  } else {
    if (pmInfo.manager === 'yarn') {
      await runYarnAudit(process.cwd(), pmInfo.type);
    } else {
      await runNpmAudit(process.cwd());
    }
  }
}

program
  .version('1.0.0')
  .description('A CLI tool for managing project dependencies (supports npm, yarn 1.x, yarn 2+)');

program
  .command('check')
  .description('Check if dependencies are up to date')
  .action(async () => {
    try {
      checkProjectValidity();
      const pmInfo = await detectPackageManager();
      
      console.log(`📦 Detected package manager: ${pmInfo.displayName}`);
      console.log('📦 Checking dependencies...\n');
      
      const result = await ncu.run({
        packageFile: path.join(process.cwd(), 'package.json'),
        upgrade: false,
        jsonUpgraded: true
      });
      
      if (Object.keys(result).length === 0) {
        console.log('✅ All dependencies are up to date!');
      } else {
        console.log('📦 Updates available for:');
        Object.entries(result).forEach(([pkg, version]) => {
          console.log(`  ${pkg}: ${version}`);
        });
        console.log('\n💡 Run depmanager update to update these dependencies');
      }
    } catch (error) {
      console.error('Error checking dependencies:', error.message);
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Update all dependencies to their latest versions')
  .action(async () => {
    try {
      checkProjectValidity();
      const pmInfo = await detectPackageManager();
      
      console.log(`📦 Detected package manager: ${pmInfo.displayName}`);
      console.log('📦 Updating dependencies...\n');
      
      const result = await ncu.run({
        packageFile: path.join(process.cwd(), 'package.json'),
        upgrade: true,
        jsonUpgraded: true
      });
      
      if (Object.keys(result).length === 0) {
        console.log('✅ All dependencies are already up to date!');
      } else {
        console.log('📦 Updated dependencies in package.json:');
        Object.entries(result).forEach(([pkg, version]) => {
          console.log(`  ${pkg}: ${version}`);
        });
        
        const installCommand = pmInfo.manager === 'yarn' ? 'yarn install' : 'npm install';
        console.log(`\n💡 Run ${installCommand} to install the new versions`);
      }
    } catch (error) {
      console.error('Error updating dependencies:', error.message);
      process.exit(1);
    }
  });

program
  .command('security')
  .description('Check dependencies for known vulnerabilities (CVEs)')
  .action(async () => {
    try {
      checkProjectValidity();
      const pmInfo = await detectPackageManager();
      
      console.log(`🔍 Detected package manager: ${pmInfo.displayName}`);
      console.log('🔍 Checking for vulnerabilities...\n');
      
      await runSecurityAudit(pmInfo);
    } catch (error) {
      console.error('Error running security check:', error.message);
      process.exit(1);
    }
  });

program
  .command('info')
  .description('Show detected package manager information')
  .action(async () => {
    try {
      checkProjectValidity();
      const pmInfo = await detectPackageManager();
      const workspaceInfo = getWorkspaceInfo();
      
      console.log('📋 Project Information:');
      console.log(`Package Manager: ${pmInfo.displayName}`);
      console.log(`Manager Type: ${pmInfo.type}`);
      if (pmInfo.version) {
        console.log(`Version: ${pmInfo.version}`);
      }
      console.log(`Workspaces: ${workspaceInfo.hasWorkspaces ? 'Yes' : 'No'}`);
      
      if (workspaceInfo.hasWorkspaces) {
        console.log(`Workspace Packages: ${workspaceInfo.packages.join(', ')}`);
      }
    } catch (error) {
      console.error('Error getting project info:', error.message);
      process.exit(1);
    }
  });

// Handle unknown commands
program
  .on('command:*', () => {
    console.error('❌ Invalid command. Use --help to see available commands');
    process.exit(1);
  });

program.parse(process.argv);
