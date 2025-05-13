/**
 * Utility script to display the local network IP addresses
 * This helps users identify which IP to use for local APK configuration
 */

import { networkInterfaces } from 'os';

console.log('=================================================');
console.log('Shillong Teer India - Local Network IP Addresses');
console.log('=================================================');
console.log('\nYour device has the following network interfaces:');

const nets = networkInterfaces();
let foundAtLeastOneIPv4 = false;

// Display all network interfaces and their IPv4 addresses
Object.keys(nets).forEach((name) => {
  const interfaces = nets[name];
  
  if (!interfaces || interfaces.length === 0) return;
  
  console.log(`\n📡 ${name}:`);
  
  interfaces.forEach((net) => {
    // Only show IPv4 addresses
    if (net.family === 'IPv4') {
      foundAtLeastOneIPv4 = true;
      
      // Determine if it's a local network IP or internal loopback
      let description = net.internal 
        ? 'Internal - not usable for network connections' 
        : 'External - can be used for local network connections';
        
      console.log(`   ✅ ${net.address.padEnd(15)} (${description})`);
    }
  });
});

if (!foundAtLeastOneIPv4) {
  console.log('\n❌ No IPv4 addresses found on your device.');
  console.log('   Make sure you are connected to a network.');
} else {
  // Find the best candidate for local network IP
  let bestCandidate = null;
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (!net.internal && net.family === 'IPv4') {
        // Skip link-local addresses (169.254.x.x) as they're usually not useful
        if (!net.address.startsWith('169.254.')) {
          bestCandidate = net.address;
          break;
        }
      }
    }
    if (bestCandidate) break;
  }
  
  console.log('\n=================================================');
  if (bestCandidate) {
    console.log(`Recommended IP address for local network usage: ${bestCandidate}`);
    console.log('This is the IP address that the APK will use to connect to your server.');
    console.log('\nWhen using the APK:');
    console.log('1. Make sure your phone is on the same network as this computer');
    console.log('2. Keep the server running with "npm run dev"');
    console.log('3. Install and open the APK on your phone');
  } else {
    console.log('No suitable external network IP found.');
    console.log('Make sure you are connected to a network that your phone can also connect to.');
  }
  console.log('=================================================');
}