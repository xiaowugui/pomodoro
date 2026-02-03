const { spawn } = require('child_process');
const path = require('path');

console.log('🍅 Starting Pomodoro App in development mode...\n');

// Build main process
console.log('Building main process...');
const buildMain = spawn('npm', ['run', 'build:main'], {
  stdio: 'inherit',
  shell: true,
  windowsHide: true
});

buildMain.on('close', (code) => {
  if (code !== 0) {
    console.error('Build failed');
    process.exit(1);
  }
  
  console.log('✓ Main process built\n');
  
  // Start Vite dev server
  console.log('Starting Vite dev server...');
  const vite = spawn('npm', ['run', 'dev:renderer'], {
    stdio: 'inherit',
    shell: true,
    windowsHide: true,
    detached: true
  });
  
  vite.unref();
  
  // Wait a moment then start Electron
  setTimeout(() => {
    console.log('Starting Electron...');
    const electron = spawn('npm', ['run', 'start:electron'], {
      stdio: 'inherit',
      shell: true,
      windowsHide: true
    });
    
    electron.on('close', () => {
      vite.kill();
      process.exit(0);
    });
  }, 3000);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});
