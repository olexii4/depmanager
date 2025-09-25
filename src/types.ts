/**
 * Type definitions for the depmanager CLI tool
 * 
 * Copyright (c) 2024, depmanager contributors
 * 
 * This source code is licensed under the ISC license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface PackageManagerInfo {
  manager: 'npm' | 'yarn';
  version: string | null;
  type: 'npm' | 'yarn1' | 'yarn2+';
  displayName: string;
}

export interface WorkspaceInfo {
  hasWorkspaces: boolean;
  packages: string[];
}

export interface PackageJson {
  name: string;
  version: string;
  description?: string;
  main?: string;
  types?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  workspaces?: string[] | {
    packages: string[];
    nohoist?: string[];
  };
  private?: boolean;
  engines?: Record<string, string>;
  keywords?: string[];
  author?: string;
  license?: string;
  [key: string]: any;
}

export interface NpmAuditResult {
  vulnerabilities: Record<string, NpmVulnerability>;
  metadata: {
    vulnerabilities: {
      total: number;
      critical: number;
      high: number;
      moderate: number;
      low: number;
      info: number;
    };
  };
}

export interface NpmVulnerability {
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'info';
  range: string;
  fixAvailable?: {
    version: string;
  };
  url?: string;
}

export interface YarnAuditResult {
  stdout: string;
  stderr: string;
}

export interface DependencyUpdateResult {
  [packageName: string]: string;
}

export interface CliCommand {
  name: string;
  description: string;
  action: () => Promise<void>;
}

export type YarnVersionType = 'yarn1' | 'yarn2+' | null;
