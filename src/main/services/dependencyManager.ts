import { join } from 'path';
import { existsSync, accessSync, constants } from 'fs';
import { execSync } from 'child_process';
import { app } from 'electron';
import ffmpegStatic from 'ffmpeg-static';
import YtDlpWrap from 'yt-dlp-wrap';
import { getSetting, setSetting } from './settingsManager';

// Define interfaces for dependency paths
export interface DependencyPaths {
  ffmpeg: string;
  ytDlp: string;
  python?: string;
  soundtouch?: string;
}

// Keys for storing paths in settings
const DEPENDENCY_SETTINGS = {
  PYTHON_PATH: 'dependencies.pythonPath',
  SOUNDTOUCH_PATH: 'dependencies.soundtouchPath',
};

// Initialize yt-dlp wrapper
const ytDlp = new YtDlpWrap();

/**
 * Get the paths to all external dependencies
 */
export function getDependencyPaths(): DependencyPaths {
  return {
    ffmpeg: ffmpegStatic as string,
    ytDlp: ytDlp.getBinaryPath(),
    python: getSetting<string>(DEPENDENCY_SETTINGS.PYTHON_PATH),
    soundtouch: getSetting<string>(DEPENDENCY_SETTINGS.SOUNDTOUCH_PATH),
  };
}

/**
 * Check if a file exists and is executable
 */
function isExecutable(path: string | undefined): boolean {
  if (!path) return false;
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Validate that all required dependencies are available
 */
export function validateDependencies(): { valid: boolean; missing: string[] } {
  const paths = getDependencyPaths();
  const missing: string[] = [];

  // Check FFmpeg
  if (!isExecutable(paths.ffmpeg)) {
    missing.push('FFmpeg');
  }

  // Check yt-dlp
  if (!isExecutable(paths.ytDlp)) {
    missing.push('yt-dlp');
  }

  // Optional: Check Python if path is set
  if (paths.python && !isExecutable(paths.python)) {
    missing.push('Python');
  }

  // Optional: Check Soundtouch if path is set
  if (paths.soundtouch && !isExecutable(paths.soundtouch)) {
    missing.push('Soundtouch');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Try to automatically find Python on the system
 */
export function findPythonPath(): string | null {
  try {
    // Try different commands based on platform
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'where python' : 'which python3 || which python';
    
    const output = execSync(command, { encoding: 'utf8' }).trim();
    const pythonPath = output.split('\n')[0]; // Take first result if multiple
    
    if (existsSync(pythonPath)) {
      // Save the found path
      setSetting(DEPENDENCY_SETTINGS.PYTHON_PATH, pythonPath);
      return pythonPath;
    }
  } catch (err) {
    console.error('Failed to find Python:', err);
  }
  
  return null;
}

/**
 * Check if required Python packages are installed
 */
export function checkPythonPackages(packages: string[]): Promise<{ installed: string[]; missing: string[] }> {
  return new Promise((resolve) => {
    const pythonPath = getDependencyPaths().python;
    if (!pythonPath) {
      resolve({ installed: [], missing: packages });
      return;
    }

    try {
      // Run pip list and parse output
      const output = execSync(`"${pythonPath}" -m pip list`, { encoding: 'utf8' });
      const installedPackages = output
        .split('\n')
        .slice(2) // Skip header rows
        .map(line => line.trim().split(/\s+/)[0]?.toLowerCase());
      
      const installed: string[] = [];
      const missing: string[] = [];
      
      packages.forEach(pkg => {
        if (installedPackages.includes(pkg.toLowerCase())) {
          installed.push(pkg);
        } else {
          missing.push(pkg);
        }
      });
      
      resolve({ installed, missing });
    } catch (err) {
      console.error('Failed to check Python packages:', err);
      resolve({ installed: [], missing: packages });
    }
  });
}

/**
 * Update the path to a dependency in settings
 */
export function setDependencyPath(dependency: 'python' | 'soundtouch', path: string): void {
  switch (dependency) {
    case 'python':
      setSetting(DEPENDENCY_SETTINGS.PYTHON_PATH, path);
      break;
    case 'soundtouch':
      setSetting(DEPENDENCY_SETTINGS.SOUNDTOUCH_PATH, path);
      break;
  }
}

/**
 * Initialize dependencies on app start
 */
export async function initializeDependencies(): Promise<void> {
  // Try to find Python if not already set
  const pythonPath = getDependencyPaths().python;
  if (!pythonPath) {
    findPythonPath();
  }
  
  // Validate that required dependencies are available
  const validation = validateDependencies();
  if (!validation.valid) {
    console.warn(`Missing dependencies: ${validation.missing.join(', ')}`);
  }
} 