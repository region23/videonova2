// IPC API type definitions for secure main/renderer process communication

// Import types from dependency manager
import { DependencyPaths } from '../main/services/dependencyManager';

export interface IElectronAPI {
  getAppVersion: () => Promise<string>;
  // Settings methods
  getSetting: <T>(key: string) => Promise<T | undefined>;
  setSetting: <T>(key: string, value: T) => Promise<void>;
  getSettings: () => Promise<Record<string, any>>;
  
  // Dependency management methods
  getDependencyPaths: () => Promise<DependencyPaths>;
  validateDependencies: () => Promise<{ valid: boolean; missing: string[] }>;
  findPythonPath: () => Promise<string | null>;
  checkPythonPackages: (packages: string[]) => Promise<{ installed: string[]; missing: string[] }>;
  setDependencyPath: (dependency: 'python' | 'soundtouch', path: string) => Promise<{ valid: boolean; missing: string[] }>;
}

export const Channels = {
  GET_APP_VERSION: 'ipc:get-app-version',
  // Settings channels
  GET_SETTING: 'ipc:get-setting',
  SET_SETTING: 'ipc:set-setting',
  GET_SETTINGS: 'ipc:get-settings',
  
  // Dependency management channels
  GET_DEPENDENCY_PATHS: 'ipc:get-dependency-paths',
  VALIDATE_DEPENDENCIES: 'ipc:validate-dependencies',
  FIND_PYTHON_PATH: 'ipc:find-python-path',
  CHECK_PYTHON_PACKAGES: 'ipc:check-python-packages',
  SET_DEPENDENCY_PATH: 'ipc:set-dependency-path',
} as const; // Use const assertion for type safety

// Type for channel names to ensure type safety when using channels
export type ChannelNames = keyof typeof Channels; 