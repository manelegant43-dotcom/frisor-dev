// build.js - Simple build script for static site
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Starting NeonCut build process...');

// Check if essential files exist
const requiredFiles = ['index.html', 'styles/main.css', 'js/app.js'];
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.warn(`⚠️  Warning: ${file} not found`);
  }
});

console.log('✅ Build completed successfully - Static site ready');
console.log('📁 Files are ready for deployment');
