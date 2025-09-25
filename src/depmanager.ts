/**
 * Core depmanager functionality
 * 
 * Copyright (c) 2024, depmanager contributors
 * 
 * This source code is licensed under the ISC license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import { exec } from 'child_process';
import * as util from 'util';
import * as fs from 'fs';
import {
  PackageManagerInfo,
  WorkspaceInfo,
  PackageJson,
  NpmAuditResult,
  YarnAuditResult,
  YarnVersionType
} from './types';

const execPromise = util.promisify(exec);

/**
 * Get yarn version from the system
 */
export async function getYarnVersion(): Promise<string | null> {
  try {
    const { stdout } = await execPromise('yarn --version');
    return stdout.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Determine yarn version type (1.x or 2+)
 */
export function getYarnVersionType(version: string | null): YarnVersionType {
  if (!version) return null;
  const majorVersion = parseInt(version.split('.')[0]!, 10);
  return majorVersion >= 2 ? 'yarn2+' : 'yarn1';
}

/**
 * Check if project uses workspaces
 */
export function getWorkspaceInfo(projectDir: string = process.cwd()): WorkspaceInfo {
  try {
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return { hasWorkspaces: false, packages: [] };
    }
    
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson: PackageJson = JSON.parse(packageJsonContent);
    
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

/**
 * Detect package manager and version
 */
export async function detectPackageManager(projectDir: string = process.cwd()): Promise<PackageManagerInfo> {
  const hasYarnLock = fs.existsSync(path.join(projectDir, 'yarn.lock'));
  const hasPackageLock = fs.existsSync(path.join(projectDir, 'package-lock.json'));
  
  if (hasYarnLock) {
    const yarnVersion = await getYarnVersion();
    const yarnType = getYarnVersionType(yarnVersion);
    return { 
      manager: 'yarn', 
      version: yarnVersion, 
      type: yarnType!,
      displayName: yarnType === 'yarn2+' ? `yarn ${yarnVersion} (2+)` : `yarn ${yarnVersion} (1.x)`
    };
  }
  
  if (hasPackageLock) {
    return { manager: 'npm', version: null, type: 'npm', displayName: 'npm' };
  }
  
  // Default to npm if no lock file is found
  return { manager: 'npm', version: null, type: 'npm', displayName: 'npm (default)' };
}

/**
 * Check if we're in a JS/TS project
 */
export function checkProjectValidity(projectDir: string = process.cwd()): PackageJson {
  const packageJsonPath = path.join(projectDir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('No package.json found in the current directory');
  }
  
  try {
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson: PackageJson = JSON.parse(packageJsonContent);
    return packageJson;
  } catch (error) {
    throw new Error(`Error reading package.json: ${(error as Error).message}`);
  }
}

/**
 * Run npm audit
 */
export async function runNpmAudit(directory: string = process.cwd()): Promise<NpmAuditResult> {
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
    const result: NpmAuditResult = JSON.parse(stdout);
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Run yarn audit (works for both yarn 1.x and 2+)
 */
export async function runYarnAudit(directory: string = process.cwd(), yarnType: YarnVersionType): Promise<YarnAuditResult> {
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

/**
 * Parse package.json safely
 */
export function parsePackageJson(filePath: string): PackageJson {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as PackageJson;
  } catch (error) {
    throw new Error(`Failed to parse package.json at ${filePath}: ${(error as Error).message}`);
  }
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Get project information
 */
export async function getProjectInfo(projectDir: string = process.cwd()): Promise<{
  packageManager: PackageManagerInfo;
  workspace: WorkspaceInfo;
  packageJson: PackageJson;
}> {
  const packageJson = checkProjectValidity(projectDir);
  const packageManager = await detectPackageManager(projectDir);
  const workspace = getWorkspaceInfo(projectDir);
  
  return {
    packageManager,
    workspace,
    packageJson
  };
}
