const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'public', 'manifest.json');
const destinationPath = path.join(__dirname, '..', 'dist', 'manifest.json');

try {
  fs.copyFileSync(sourcePath, destinationPath);
  console.log(`Successfully copied ${sourcePath} to ${destinationPath}`);
} catch (error) {
  console.error(`Error copying manifest file: ${error.message}`);
  process.exit(1);
}
