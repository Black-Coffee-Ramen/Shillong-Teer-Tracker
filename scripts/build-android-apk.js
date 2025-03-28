/**
 * Shillong Teer India - Android APK Build Script
 * 
 * This script uses @bubblewrap/cli to build an Android APK from our PWA.
 * 
 * Prerequisites:
 * 1. Node.js (v14+)
 * 2. npm install -g @bubblewrap/cli
 * 3. Android SDK and NDK (can be installed via Android Studio)
 * 4. JDK 8+
 * 
 * Usage:
 * 1. npm run build (to build the web app)
 * 2. node scripts/build-android-apk.js
 * 
 * It will generate an APK file in the dist/ directory
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  name: 'Shillong Teer India',
  shortName: 'Teer India',
  packageName: 'com.shillongteerindia.app',
  backgroundColor: '#121212',
  themeColor: '#5D3FD3',
  display: 'standalone',
  orientation: 'portrait',
  iconUrl: path.resolve(__dirname, '../public/icons/icon-512x512.png'),
  publicUrl: 'https://shillongteerindia.app', // Change this to your production URL when deployed
  startUrl: '/',
  navigationColor: '#5D3FD3',
  navigationColorDark: '#5D3FD3',
  navigationDividerColor: '#333333',
  navigationDividerColorDark: '#333333',
  version: '1.0.0',
  versionCode: 1,
  webManifestUrl: path.resolve(__dirname, '../public/manifest.json'),
};

console.log('Starting Android APK build for Shillong Teer India...');

// Make sure dist directory exists
if (!fs.existsSync(path.resolve(__dirname, '../dist'))) {
  console.log('Building web app first...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Steps to build APK using Bubblewrap CLI
// Note: Bubblewrap needs to be installed globally

// 1. Initialize a new TWA project
console.log('Initializing TWA project...');
try {
  execSync(`bubblewrap init --directory twa-build \\
    --manifest ${config.webManifestUrl} \\
    --icon ${config.iconUrl} \\
    --name "${config.name}" \\
    --shortName "${config.shortName}" \\
    --packageName ${config.packageName} \\
    --startUrl ${config.startUrl} \\
    --display ${config.display} \\
    --orientation ${config.orientation} \\
    --themeColor ${config.themeColor} \\
    --backgroundColor ${config.backgroundColor} \\
    --navigationColor ${config.navigationColor} \\
    --navigationColorDark ${config.navigationColorDark} \\
    --navigationDividerColor ${config.navigationDividerColor} \\
    --navigationDividerColorDark ${config.navigationDividerColorDark} \\
    --appVersion ${config.version} \\
    --appVersionCode ${config.versionCode}`, 
    { stdio: 'inherit' });

  // 2. Build the APK
  console.log('Building APK...');
  execSync('cd twa-build && bubblewrap build', { stdio: 'inherit' });
  
  // 3. Copy the APK to the dist directory
  console.log('Copying APK to dist directory...');
  execSync('mkdir -p dist', { stdio: 'inherit' });
  execSync('cp twa-build/app-release-signed.apk dist/shillong-teer-india.apk', { stdio: 'inherit' });
  
  console.log('\n✅ APK build complete!');
  console.log('APK file is available at: dist/shillong-teer-india.apk');
  
} catch (error) {
  console.error('Error building APK:', error.message);
  console.log('\nPlease make sure you have installed all prerequisites:');
  console.log('1. Node.js (v14+)');
  console.log('2. npm install -g @bubblewrap/cli');
  console.log('3. Android SDK and NDK');
  console.log('4. JDK 8+');
  process.exit(1);
}