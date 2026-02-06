const { spawn } = require('child_process');
const path = require('path');

// Build main process
const buildMain = spawn('npm', ['run', 'build:main'], {
  stdio: 'inherit',
  shell: true,
  windowsHide: true
});

buildMain.on('close', (code) => {
  if (code !== 0) {
    process.exit(1);
  }
  
  // Start Vite dev server
  const vite = spawn('npm', ['run', 'dev:renderer'], {
    stdio: 'inherit',
    shell: true,
    windowsHide: true,
    detached: true
  });
  
  vite.unref();
  
  // Wait a moment then start Electron
  setTimeout(() => {
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
  process.exit(0);
});
