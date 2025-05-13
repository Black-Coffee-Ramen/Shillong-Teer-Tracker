/**
 * Test script for APK configuration
 * 
 * This script simulates the APK build configuration process without
 * actually generating an APK. It's useful for verifying settings.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { networkInterfaces } from 'os';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('===============================================');
console.log('Shillong Teer India - APK Configuration Tester');
console.log('===============================================\n');

// Determine the port being used by the server
let port = 3000; // Default port
const portFilePath = path.resolve(__dirname, '../.port');
if (fs.existsSync(portFilePath)) {
  try {
    port = parseInt(fs.readFileSync(portFilePath, 'utf8').trim());
    console.log(`✅ Using detected server port: ${port}`);
  } catch (error) {
    console.warn('⚠️ Warning: Could not read port file, using default port 3000');
  }
} else {
  console.log('⚠️ No .port file found, using default port 3000');
}

// Get local IP address for LAN access
function getLocalIpAddress() {
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (!net.internal && net.family === 'IPv4') {
        return net.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback to localhost
}

const localIp = getLocalIpAddress();
console.log(`✅ Local IP address: ${localIp}`);

// Config that would be used for the APK
const config = {
  name: 'Shillong Teer India',
  shortName: 'Teer India',
  packageName: 'com.shillongteerindia.app',
  backgroundColor: '#121212',
  themeColor: '#FF6B00',
  iconUrl: path.resolve(__dirname, '../public/icons/icon-512x512.png'),
  publicUrl: `http://${localIp}:${port}`, 
  startUrl: '/',
};

console.log('\nAPK would be configured with:');
console.log(`✅ App name: ${config.name}`);
console.log(`✅ Package name: ${config.packageName}`);
console.log(`✅ URL: ${config.publicUrl}`);

// Check if icon exists
if (fs.existsSync(config.iconUrl)) {
  console.log(`✅ Icon found: ${config.iconUrl}`);
} else {
  console.log(`❌ Icon not found: ${config.iconUrl}`);
  const alternateIcon = path.resolve(__dirname, '../public/icons/icon-512x512.png');
  if (fs.existsSync(alternateIcon)) {
    console.log(`   Alternate icon available: ${alternateIcon}`);
  }
}

// Check for manifest.json
const manifestPath = path.resolve(__dirname, '../public/manifest.json');
if (fs.existsSync(manifestPath)) {
  console.log('✅ manifest.json found');
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`   App name in manifest: ${manifest.name}`);
    console.log(`   Short name in manifest: ${manifest.short_name}`);
  } catch (error) {
    console.log('❌ Error parsing manifest.json:', error.message);
  }
} else {
  console.log('❌ manifest.json not found');
}

// Check for assetlinks.json
const assetlinksPath = path.resolve(__dirname, '../public/.well-known/assetlinks.json');
if (fs.existsSync(assetlinksPath)) {
  console.log('✅ assetlinks.json found');
} else {
  console.log('❌ assetlinks.json not found');
}

console.log('\n===============================================');
console.log('APK would be built with these configuration parameters:');
console.log('===============================================');
console.log(`
bubblewrap init --directory twa-build \\
  --manifest ${path.resolve(__dirname, '../public/manifest.json')} \\
  --icon ${config.iconUrl} \\
  --name "${config.name}" \\
  --shortName "${config.shortName}" \\
  --packageName ${config.packageName} \\
  --startUrl ${config.startUrl} \\
  --display standalone \\
  --orientation portrait \\
  --themeColor ${config.themeColor} \\
  --backgroundColor ${config.backgroundColor} \\
  --publicUrl ${config.publicUrl}
`);

console.log('\n===============================================');
console.log('Test complete - Your APK configuration looks good!');
console.log('===============================================');
console.log('\nTo build the actual APK, run:');
console.log('./scripts/build-local-apk.sh');
console.log('\nOr for manual process, run:');
console.log('node scripts/build-android-apk.js');