/**
 * Shillong Teer India - Asset Links Update Script
 * 
 * This script updates the Digital Asset Links file with the correct SHA-256 certificate fingerprint
 * after generating the keystore for the Android APK.
 * 
 * Usage:
 * 1. Run the script after building the APK with the fingerprint as argument:
 *    node scripts/update-assetlinks.js "YOUR:CERTIFICATE:FINGERPRINT"
 * 
 * The fingerprint can be obtained using:
 *    keytool -list -v -keystore twa-build/android.keystore -alias android -storepass android
 */

const fs = require('fs');
const path = require('path');

// Path to the assetlinks.json file
const assetlinksPath = path.join(__dirname, '../public/.well-known/assetlinks.json');

// Get the certificate fingerprint from command line argument
const fingerprint = process.argv[2];

if (!fingerprint) {
  console.error('Error: No certificate fingerprint provided');
  console.log('Usage: node update-assetlinks.js "YOUR:CERTIFICATE:FINGERPRINT"');
  process.exit(1);
}

// Read the current assetlinks.json file
fs.readFile(assetlinksPath, 'utf8', (err, data) => {
  if (err) {
    if (err.code === 'ENOENT') {
      // If file doesn't exist, create the directory and a new file
      const dir = path.dirname(assetlinksPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create new assetlinks.json with the provided fingerprint
      const assetlinks = [{
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.shillongteerindia.app",
          sha256_cert_fingerprints: [fingerprint]
        }
      }];
      
      fs.writeFileSync(assetlinksPath, JSON.stringify(assetlinks, null, 2));
      console.log('Created new assetlinks.json file with fingerprint');
      return;
    }
    
    console.error('Error reading assetlinks.json:', err);
    process.exit(1);
  }
  
  try {
    // Parse the JSON
    const assetlinks = JSON.parse(data);
    
    // Update the fingerprint
    if (Array.isArray(assetlinks) && assetlinks.length > 0 && 
        assetlinks[0].target && assetlinks[0].target.sha256_cert_fingerprints) {
      assetlinks[0].target.sha256_cert_fingerprints = [fingerprint];
    } else {
      throw new Error('Invalid assetlinks.json structure');
    }
    
    // Write the updated JSON back to the file
    fs.writeFileSync(assetlinksPath, JSON.stringify(assetlinks, null, 2));
    console.log('Successfully updated assetlinks.json with fingerprint');
    
  } catch (error) {
    console.error('Error updating assetlinks.json:', error);
    process.exit(1);
  }
});