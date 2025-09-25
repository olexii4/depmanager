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
function getWorkspaceInfo(projectDir = process.cwd()) {
  try {
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return { hasWorkspaces: false, packages: [] };
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
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
async function detectPackageManager(projectDir = process.cwd()) {
  const hasYarnLock = fs.existsSync(path.join(projectDir, 'yarn.lock'));
  const hasPackageLock = fs.existsSync(path.join(projectDir, 'package-lock.json'));
  
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
function checkProjectValidity(projectDir = process.cwd()) {
  const packageJsonPath = path.join(projectDir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('No package.json found in the current directory');
  }
  
  try {
    const packageJson = require(packageJsonPath);
    return packageJson;
  } catch (error) {
    throw new Error(`Error reading package.json: ${error.message}`);
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
    
    return result;
  } catch (error) {
    throw error;
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
    
    return { stdout, stderr };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getYarnVersion,
  getYarnVersionType,
  getWorkspaceInfo,
  detectPackageManager,
  checkProjectValidity,
  runNpmAudit,
  runYarnAudit
};
