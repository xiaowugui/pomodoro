const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning temporary files...\n');

const filesToDelete = [
  // Log files
  'electron.log',
  'electron-err.log',
  'electron-out.log',
  'electron-err-new.log',
  'electron-out-new.log',
  
  // Test scripts
  'test-launcher.ps1',
  'test-launch.ps1',
  'test-launch-detailed.ps1',
  'test-launch-check.ps1',
  'extended-test.ps1',
  'final-test.ps1',
  'rebuild.ps1',
  
  // Reports
  'FIX_VERIFICATION_REPORT.md',
  'TEST-REPORT.md',
  
  // Other temp files
  'nul',
];

let deletedCount = 0;
let errorCount = 0;

filesToDelete.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✓ Deleted: ${file}`);
      deletedCount++;
    }
  } catch (err) {
    console.error(`✗ Failed to delete ${file}: ${err.message}`);
    errorCount++;
  }
});

console.log(`\n✓ Cleaned ${deletedCount} files${errorCount > 0 ? `, ${errorCount} errors` : ''}`);
console.log('🎉 Done!\n');
