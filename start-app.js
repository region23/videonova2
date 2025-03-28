// Direct start script for debugging
const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

// Get the current NODE_ENV or default to development
const nodeEnv = process.env.NODE_ENV || 'development';

console.log('Starting Electron app...');
console.log('Current directory:', process.cwd());
console.log('Main file path:', path.resolve('./main.js'));
console.log('NODE_ENV:', nodeEnv);

// Start Electron with the main.js file
const proc = spawn(electron, ['.'], { 
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: nodeEnv,
    ELECTRON_ENABLE_LOGGING: 1
  }
});

proc.on('close', (code) => {
  console.log(`Electron exited with code ${code}`);
  process.exit(code);
}); 