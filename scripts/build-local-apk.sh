#!/bin/bash

# Shillong Teer India - Local APK Builder
# This script helps build an Android APK that works locally without requiring a web server

echo "==================================================================="
echo "Shillong Teer India - Local APK Builder"
echo "==================================================================="
echo "This script will help you build an Android APK that runs locally"
echo "without requiring a web server or internet connection."
echo

# Check for prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14 or higher."
    exit 1
else
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    echo "✅ Node.js $NODE_VERSION is installed."
fi

# Check JDK
if ! command -v java &> /dev/null; then
    echo "❌ Java Development Kit (JDK) is not installed. Please install JDK 8 or higher."
    echo "   You can download it from https://adoptium.net/"
    exit 1
else
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo "✅ Java $JAVA_VERSION is installed."
fi

# Check for Android SDK (via ANDROID_HOME or ANDROID_SDK_ROOT)
if [[ -z "$ANDROID_HOME" && -z "$ANDROID_SDK_ROOT" ]]; then
    echo "❌ Android SDK environment variables not found."
    echo "   Please install Android Studio and set ANDROID_HOME or ANDROID_SDK_ROOT."
    echo "   You can download Android Studio from https://developer.android.com/studio"
    exit 1
else
    SDK_PATH=${ANDROID_HOME:-$ANDROID_SDK_ROOT}
    echo "✅ Android SDK found at $SDK_PATH"
fi

# Check for Bubblewrap CLI
if ! command -v bubblewrap &> /dev/null; then
    echo "❓ Bubblewrap CLI is not installed. Would you like to install it now? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Installing Bubblewrap CLI..."
        npm install -g @bubblewrap/cli
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install Bubblewrap CLI. Please try manually with 'npm install -g @bubblewrap/cli'"
            exit 1
        fi
        echo "✅ Bubblewrap CLI installed successfully."
    else
        echo "❌ Bubblewrap CLI is required. Please install it manually with 'npm install -g @bubblewrap/cli'"
        exit 1
    fi
else
    BUBBLEWRAP_VERSION=$(bubblewrap --version)
    echo "✅ Bubblewrap CLI $BUBBLEWRAP_VERSION is installed."
fi

echo
echo "All prerequisites are satisfied. Ready to build the APK."
echo

# Ask user to confirm build
echo "This will build a local APK that can run without a web server."
echo "⚠️  Note: The APK will use a localhost address which means:"
echo "   1. The app will work when installed on the same device where the server runs"
echo "   2. You'll need to start the server (npm run dev) for the app to work"
echo
echo "Do you want to continue? (y/n)"
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Build cancelled."
    exit 0
fi

# Build the app
echo
echo "Building the web app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build the web app. Please check for errors and try again."
    exit 1
fi

# Build the APK
echo
echo "Building the APK..."
# Check if our scripts compiled correctly
echo "Running configuration test..."
node scripts/test-apk-config.js

if [ $? -ne 0 ]; then
    echo "❌ Configuration test failed. Please check for errors above."
    exit 1
fi

echo "Starting APK build process..."
node scripts/build-android-apk.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to build the APK. Please check for errors and try again."
    exit 1
fi

# Check if APK was generated
if [ ! -f "dist/shillong-teer-india.apk" ]; then
    echo "❌ APK file not found. Build may have failed."
    exit 1
fi

echo
echo "==================================================================="
echo "🎉 APK built successfully!"
echo "==================================================================="
echo
echo "Your APK file is located at: dist/shillong-teer-india.apk"
echo
echo "To use the app:"
echo "1. Start the local server with: npm run dev"
echo "2. Install the APK on your Android device"
echo "3. Make sure your Android device is on the same network as your server"
echo "4. The app will connect to your local server at http://localhost:3000"
echo
echo "⚠️  Remember: The server must be running for the app to work properly."
echo "==================================================================="