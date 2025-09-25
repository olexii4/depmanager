/**
 * Core functionality tests for depmanager
 * 
 * Copyright (c) 2024, depmanager contributors
 * 
 * This source code is licensed under the ISC license found in the
 * LICENSE file in the root directory of this source tree.
 */

/// <reference path="./setup.d.ts" />

import {
  getYarnVersionType,
  getWorkspaceInfo,
} from '../src/depmanager';
import { YarnVersionType, WorkspaceInfo } from '../src/types';

describe('Core Functionality', () => {
  describe('getYarnVersionType', () => {
    test('should return yarn2+ for version 2.x', () => {
      expect(getYarnVersionType('2.4.3')).toBe('yarn2+');
    });

    test('should return yarn2+ for version 3.x', () => {
      expect(getYarnVersionType('3.1.0')).toBe('yarn2+');
    });

    test('should return yarn1 for version 1.x', () => {
      expect(getYarnVersionType('1.22.19')).toBe('yarn1');
    });

    test('should return null for invalid version', () => {
      expect(getYarnVersionType(null)).toBe(null);
      expect(getYarnVersionType(undefined as any)).toBe(null);
    });

    test('should handle edge cases', () => {
      expect(getYarnVersionType('4.0.0')).toBe('yarn2+');
      expect(getYarnVersionType('0.27.5')).toBe('yarn1');
      expect(getYarnVersionType('2.0.0-beta.1')).toBe('yarn2+');
    });
  });

  describe('getWorkspaceInfo', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = createTempDir();
    });

    afterEach(() => {
      cleanupTempDir(tempDir);
    });

    test('should detect no workspaces for regular project', () => {
      createPackageJson(tempDir, {
        name: 'regular-project',
        version: '1.0.0',
        dependencies: { react: '^18.0.0' }
      });

      const result: WorkspaceInfo = getWorkspaceInfo(tempDir);
      expect(result).toEqual({
        hasWorkspaces: false,
        packages: []
      });
    });

    test('should detect workspaces with array format', () => {
      createPackageJson(tempDir, {
        name: 'workspace-project',
        version: '1.0.0',
        workspaces: ['packages/*', 'apps/*']
      });

      const result: WorkspaceInfo = getWorkspaceInfo(tempDir);
      expect(result).toEqual({
        hasWorkspaces: true,
        packages: ['packages/*', 'apps/*']
      });
    });

    test('should detect workspaces with object format', () => {
      createPackageJson(tempDir, {
        name: 'workspace-project',
        version: '1.0.0',
        workspaces: {
          packages: ['packages/*', 'tools/*']
        }
      });

      const result: WorkspaceInfo = getWorkspaceInfo(tempDir);
      expect(result).toEqual({
        hasWorkspaces: true,
        packages: ['packages/*', 'tools/*']
      });
    });

    test('should handle missing package.json', () => {
      const result: WorkspaceInfo = getWorkspaceInfo(tempDir);
      expect(result).toEqual({
        hasWorkspaces: false,
        packages: []
      });
    });

    test('should handle invalid package.json', () => {
      const fs = require('fs');
      const path = require('path');
      fs.writeFileSync(path.join(tempDir, 'package.json'), 'invalid json');
      
      const result: WorkspaceInfo = getWorkspaceInfo(tempDir);
      expect(result).toEqual({
        hasWorkspaces: false,
        packages: []
      });
    });

    test('should handle complex workspace patterns', () => {
      createPackageJson(tempDir, {
        name: 'complex-workspace',
        version: '1.0.0',
        private: true,
        workspaces: [
          'packages/*',
          'apps/web',
          'apps/mobile',
          'tools/build-scripts'
        ]
      });

      const result: WorkspaceInfo = getWorkspaceInfo(tempDir);
      expect(result.hasWorkspaces).toBe(true);
      expect(result.packages).toHaveLength(4);
      expect(result.packages).toContain('packages/*');
      expect(result.packages).toContain('apps/web');
    });

    test('should handle workspace with nohoist', () => {
      createPackageJson(tempDir, {
        name: 'workspace-nohoist',
        version: '1.0.0',
        private: true,
        workspaces: {
          packages: ['packages/*'],
          nohoist: ['**/react-native', '**/react-native/**']
        }
      });

      const result: WorkspaceInfo = getWorkspaceInfo(tempDir);
      expect(result).toEqual({
        hasWorkspaces: true,
        packages: ['packages/*']
      });
    });
  });
});
