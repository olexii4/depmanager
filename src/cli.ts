#!/usr/bin/env node

/**
 * CLI interface for depmanager
 * 
 * Copyright (c) 2024, depmanager contributors
 * 
 * This source code is licensed under the ISC license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { program } from 'commander';
import * as ncu from 'npm-check-updates';
import * as path from 'path';
import { exec } from 'child_process';
import * as util from 'util';
import * as fs from 'fs';
import {
  getProjectInfo,
  getWorkspaceInfo,
  runNpmAudit,
  runYarnAudit,
  checkProjectValidity
} from './depmanager';
import {
  PackageManagerInfo,
  WorkspaceInfo,
  NpmAuditResult,
  DependencyUpdateResult
} from './types';

const execPromise = util.promisify(exec);

/**
 * Display npm audit results
 */
function displayNpmAuditResults(result: NpmAuditResult): void {
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
}

/**
 * Display yarn audit results
 */
function displayYarnAuditResults(stdout: string, stderr: string): void {
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
        vulnCount = parseInt(match[1]!, 10);
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
}

/**
 * Run security audit based on package manager
 */
async function runSecurityAudit(pmInfo: PackageManagerInfo): Promise<void> {
  const workspaceInfo = getWorkspaceInfo();
  
  if (workspaceInfo.hasWorkspaces) {
    console.log('📦 Detected workspace project\n');
    
    // Check root project
    console.log('Checking root project...');
    await runSecurityAuditForDirectory(process.cwd(), pmInfo);

    // Check workspace packages
    for (const pattern of workspaceInfo.packages) {
      const basePath = pattern.replace('/*', '');
      if (fs.existsSync(path.join(process.cwd(), basePath))) {
        const entries = fs.readdirSync(path.join(process.cwd(), basePath));
        for (const entry of entries) {
          const packagePath = path.join(process.cwd(), basePath, entry);
          if (fs.statSync(packagePath).isDirectory() && fs.existsSync(path.join(packagePath, 'package.json'))) {
            console.log(`\nChecking workspace: ${path.relative(process.cwd(), packagePath)}`);
            await runSecurityAuditForDirectory(packagePath, pmInfo);
          }
        }
      }
    }
  } else {
    await runSecurityAuditForDirectory(process.cwd(), pmInfo);
  }
}

/**
 * Run security audit for a specific directory
 */
async function runSecurityAuditForDirectory(directory: string, pmInfo: PackageManagerInfo): Promise<void> {
  if (pmInfo.manager === 'yarn') {
    try {
      if (!pmInfo.version) {
        console.log('⚠️  Yarn not found or not properly installed.');
        console.log('ℹ️  Falling back to npm audit...\n');
        const result = await runNpmAudit(directory);
        displayNpmAuditResults(result);
        return;
      }

      const result = await runYarnAudit(directory, pmInfo.type === 'npm' ? null : pmInfo.type);
      displayYarnAuditResults(result.stdout, result.stderr);
    } catch (error) {
      // If yarn audit completely fails, skip npm fallback for workspace root
      // since npm audit requires npm-style lock files
      if (directory !== process.cwd() || !getWorkspaceInfo().hasWorkspaces) {
        console.log('⚠️  Yarn audit failed. Falling back to npm audit...\n');
        try {
          const result = await runNpmAudit(directory);
          displayNpmAuditResults(result);
        } catch (npmError) {
          console.log('❌ Security audit could not be completed for this configuration.');
          console.log('💡 This may be due to workspace setup or missing lock files.');
          console.log('   Try running the security audit directly with your package manager.');
        }
      } else {
        console.log('⚠️  Security audit not available for this workspace configuration.');
        console.log('💡  Try running the audit directly with yarn or check individual workspace packages.');
      }
    }
  } else {
    try {
      const result = await runNpmAudit(directory);
      displayNpmAuditResults(result);
    } catch (error) {
      console.log('❌ Security audit could not be completed for this configuration.');
      console.log('💡 This may be due to workspace setup or missing lock files.');
      console.log('   Try running the security audit directly with your package manager.');
    }
  }
}

/**
 * Check command implementation
 */
async function checkCommand(): Promise<void> {
  try {
    checkProjectValidity();
    const pmInfo = (await getProjectInfo()).packageManager;
    
    console.log(`📦 Detected package manager: ${pmInfo.displayName}`);
    console.log('📦 Checking dependencies...\n');
    
    const result: DependencyUpdateResult = await ncu.run({
      packageFile: path.join(process.cwd(), 'package.json'),
      upgrade: false,
      jsonUpgraded: true
    }) as DependencyUpdateResult;
    
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
    console.error('Error checking dependencies:', (error as Error).message);
    process.exit(1);
  }
}

/**
 * Update command implementation
 */
async function updateCommand(): Promise<void> {
  try {
    checkProjectValidity();
    const pmInfo = (await getProjectInfo()).packageManager;
    
    console.log(`📦 Detected package manager: ${pmInfo.displayName}`);
    console.log('📦 Updating dependencies...\n');
    
    const result: DependencyUpdateResult = await ncu.run({
      packageFile: path.join(process.cwd(), 'package.json'),
      upgrade: true,
      jsonUpgraded: true
    }) as DependencyUpdateResult;
    
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
    console.error('Error updating dependencies:', (error as Error).message);
    process.exit(1);
  }
}

/**
 * Security command implementation
 */
async function securityCommand(): Promise<void> {
  try {
    checkProjectValidity();
    const pmInfo = (await getProjectInfo()).packageManager;
    
    console.log(`🔍 Detected package manager: ${pmInfo.displayName}`);
    console.log('🔍 Checking for vulnerabilities...\n');
    
    await runSecurityAudit(pmInfo);
  } catch (error) {
    console.error('Error running security check:', (error as Error).message);
    process.exit(1);
  }
}

/**
 * Info command implementation
 */
async function infoCommand(): Promise<void> {
  try {
    checkProjectValidity();
    const projectInfo = await getProjectInfo();
    
    console.log('📋 Project Information:');
    console.log(`Package Manager: ${projectInfo.packageManager.displayName}`);
    console.log(`Manager Type: ${projectInfo.packageManager.type}`);
    if (projectInfo.packageManager.version) {
      console.log(`Version: ${projectInfo.packageManager.version}`);
    }
    console.log(`Workspaces: ${projectInfo.workspace.hasWorkspaces ? 'Yes' : 'No'}`);
    
    if (projectInfo.workspace.hasWorkspaces) {
      console.log(`Workspace Packages: ${projectInfo.workspace.packages.join(', ')}`);
    }
  } catch (error) {
    console.error('Error getting project info:', (error as Error).message);
    process.exit(1);
  }
}

// CLI Setup
program
  .version('1.0.0')
  .description('A CLI tool for managing project dependencies (supports npm, yarn 1.x, yarn 2+)');

program
  .command('check')
  .description('Check if dependencies are up to date')
  .action(checkCommand);

program
  .command('update')
  .description('Update all dependencies to their latest versions')
  .action(updateCommand);

program
  .command('security')
  .description('Check dependencies for known vulnerabilities (CVEs)')
  .action(securityCommand);

program
  .command('info')
  .description('Show detected package manager information')
  .action(infoCommand);

// Handle unknown commands
program
  .on('command:*', () => {
    console.error('❌ Invalid command. Use --help to see available commands');
    process.exit(1);
  });

// Parse command line arguments
program.parse(process.argv);
