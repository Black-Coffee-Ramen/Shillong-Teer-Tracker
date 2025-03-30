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
  themeColor: '#FF6B00', // Updated to match your actual theme color
  display: 'standalone',
  orientation: 'portrait',
  iconUrl: path.resolve(__dirname, '../public/icons/app-icon-512.png'),
  publicUrl: 'https://shillongteerindia.app', // Change this to your production URL when deployed
  startUrl: '/',
  navigationColor: '#FF6B00',
  navigationColorDark: '#FF6B00',
  navigationDividerColor: '#333333',
  navigationDividerColorDark: '#333333',
  version: '1.0.0',
  versionCode: 1,
  webManifestUrl: path.resolve(__dirname, '../public/manifest.json'),
};

console.log('Starting Android APK build for Shillong Teer India...');

// Create build directory if it doesn't exist
const buildDir = path.resolve(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Make sure the production build exists
if (!fs.existsSync(path.resolve(__dirname, '../dist'))) {
  console.log('Building web app first...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Generate service worker if we have workbox
  try {
    console.log('Generating service worker...');
    execSync('npx workbox-cli generateSW workbox-config.js', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Warning: Could not generate service worker with workbox. Using default service worker.');
    // Continue with the process even if this fails
  }
}

// Steps to build APK using Bubblewrap CLI
try {
  // 1. Clean up previous build if it exists
  const twaDir = path.resolve(__dirname, '../twa-build');
  if (fs.existsSync(twaDir)) {
    console.log('Cleaning up previous TWA build...');
    try {
      execSync(`rm -rf ${twaDir}`, { stdio: 'inherit' });
    } catch (error) {
      console.warn('Warning: Could not clean up previous build directory');
      // Continue anyway
    }
  }
  
  // 2. Initialize a new TWA project
  console.log('Initializing TWA project...');
  const initCommand = `bubblewrap init --directory twa-build \\
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
    --appVersionCode ${config.versionCode}`;
    
  execSync(initCommand, { stdio: 'inherit' });

  // 3. Build the APK
  console.log('Building APK...');
  execSync('cd twa-build && bubblewrap build', { stdio: 'inherit' });
  
  // 4. Extract the fingerprint from the keystore
  console.log('Extracting certificate fingerprint...');
  const keystorePath = path.resolve(__dirname, '../twa-build/android.keystore');
  
  if (fs.existsSync(keystorePath)) {
    const fingerprint = execSync(
      'keytool -list -v -keystore twa-build/android.keystore -alias android -storepass android | grep "SHA256" | cut -d ":" -f 2- | tr -d " "',
      { encoding: 'utf8' }
    ).trim();
    
    console.log(`Certificate fingerprint: ${fingerprint}`);
    
    // 5. Update the assetlinks.json file
    console.log('Updating Digital Asset Links...');
    execSync(`node ${path.resolve(__dirname, './update-assetlinks.js')} "${fingerprint}"`, { stdio: 'inherit' });
    
    // 6. Copy the assetlinks.json to the dist directory
    const wellKnownDir = path.resolve(__dirname, '../dist/.well-known');
    if (!fs.existsSync(wellKnownDir)) {
      fs.mkdirSync(wellKnownDir, { recursive: true });
    }
    
    fs.copyFileSync(
      path.resolve(__dirname, '../public/.well-known/assetlinks.json'),
      path.resolve(__dirname, '../dist/.well-known/assetlinks.json')
    );
  } else {
    console.warn('Warning: Keystore not found, skipping certificate fingerprint extraction');
  }
  
  // 7. Copy the APK to the dist directory
  console.log('Copying APK to dist directory...');
  const apkPath = path.resolve(__dirname, '../twa-build/app-release-signed.apk');
  
  if (fs.existsSync(apkPath)) {
    fs.copyFileSync(
      apkPath,
      path.resolve(__dirname, '../dist/shillong-teer-india.apk')
    );
    
    console.log('\n✅ APK build complete!');
    console.log('APK file is available at: dist/shillong-teer-india.apk');
  } else {
    console.error('Error: APK file not found');
    console.log('Check the twa-build directory for any build output or errors');
  }
  
} catch (error) {
  console.error('Error building APK:', error.message);
  console.log('\nPlease make sure you have installed all prerequisites:');
  console.log('1. Node.js (v14+)');
  console.log('2. npm install -g @bubblewrap/cli');
  console.log('3. Android SDK and NDK');
  console.log('4. JDK 8+');
  
  // Additional diagnostic information
  try {
    console.log('\nEnvironment diagnostics:');
    console.log('Node version:', execSync('node --version', { encoding: 'utf8' }).trim());
    
    try {
      console.log('Bubblewrap version:', execSync('bubblewrap --version', { encoding: 'utf8' }).trim());
    } catch (e) {
      console.log('Bubblewrap: Not installed or not in path');
    }
    
    try {
      console.log('Java version:', execSync('java -version 2>&1 | grep version', { encoding: 'utf8' }).trim());
    } catch (e) {
      console.log('Java: Not installed or not in path');
    }
    
  } catch (e) {
    console.log('Could not run diagnostics');
  }
  
  process.exit(1);
}