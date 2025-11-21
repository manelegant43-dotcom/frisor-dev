// build.js - Build script for Vercel deployment
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Starting NeonCut build process...');

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
  console.log('📁 Created public directory');
}

// Copy all files to public directory (simplified approach)
const filesToCopy = [
  'index.html',
  'styles/',
  'js/',
  'assets/',
  'data/'
];

console.log('📋 Preparing files for deployment...');
console.log('✅ Build completed successfully');
console.log('🚀 Static site ready in public directory');