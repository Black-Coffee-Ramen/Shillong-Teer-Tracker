#!/bin/bash

# Shillong Teer India - WebView APK Builder
# This script prepares and builds an Android APK with WebView that loads 
# web content directly from the APK's assets folder

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================================="
echo -e "Shillong Teer India - WebView APK Builder"
echo -e "=========================================================${NC}"
echo

# Check for required tools
echo "Checking required tools..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js and npm.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm is installed${NC}"
fi

# Check if javac is installed (indicator of JDK)
if ! command -v javac &> /dev/null; then
    echo -e "${YELLOW}⚠️ Java Development Kit (JDK) is not installed or not in PATH.${NC}"
    echo -e "${YELLOW}  You'll need JDK to build the APK in Android Studio.${NC}"
else
    echo -e "${GREEN}✅ JDK is installed${NC}"
fi

# Check for Android SDK (rough check)
ANDROID_HOME="$HOME/Android/Sdk"
if [ ! -d "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}⚠️ Android SDK not found at $ANDROID_HOME${NC}"
    echo -e "${YELLOW}  You'll need Android SDK to build the APK in Android Studio.${NC}"
else
    echo -e "${GREEN}✅ Android SDK found${NC}"
fi

# Build the web application
echo
echo "Building the web application..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build the web application.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Web application built successfully${NC}"

# Create the assets directory if it doesn't exist
mkdir -p android-webview-wrapper/app/src/main/assets
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create assets directory.${NC}"
    exit 1
fi

# Copy the built files to the assets directory
echo
echo "Copying web files to Android assets directory..."
cp -r dist/* android-webview-wrapper/app/src/main/assets/
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to copy web files to assets.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Web files copied to assets${NC}"

# Create index.html if it doesn't exist
if [ ! -f "android-webview-wrapper/app/src/main/assets/index.html" ]; then
    echo -e "${YELLOW}⚠️ index.html not found in dist directory. Creating a redirect...${NC}"
    # Find what might be the main HTML file
    MAIN_HTML=$(find android-webview-wrapper/app/src/main/assets -name "*.html" | head -n 1)
    if [ -n "$MAIN_HTML" ]; then
        FILENAME=$(basename "$MAIN_HTML")
        echo "<meta http-equiv=\"refresh\" content=\"0;URL='$FILENAME'\" />" > android-webview-wrapper/app/src/main/assets/index.html
        echo -e "${GREEN}✅ Created index.html with redirect to $FILENAME${NC}"
    else
        echo -e "${RED}❌ No HTML files found in the build directory.${NC}"
        exit 1
    fi
fi

# Create an empty .nomedia file in the assets directory to prevent media scanning
touch android-webview-wrapper/app/src/main/assets/.nomedia

# Check if pwa-bridge.js exists in assets, if not copy it
if [ ! -f "android-webview-wrapper/app/src/main/assets/pwa-bridge.js" ]; then
    echo
    echo "Adding PWA bridge JavaScript file..."
    # It should already be in the right place, but we'll check anyway
    cp -f android-webview-wrapper/app/src/main/assets/pwa-bridge.js android-webview-wrapper/app/src/main/assets/
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️ Could not copy pwa-bridge.js to assets.${NC}"
        echo -e "${YELLOW}  Make sure it exists in the project.${NC}"
    else
        echo -e "${GREEN}✅ PWA bridge added to assets${NC}"
    fi
fi

# Add script tag to include pwa-bridge.js in the HTML files
echo
echo "Injecting PWA bridge into HTML files..."
for HTML_FILE in $(find android-webview-wrapper/app/src/main/assets -name "*.html"); do
    # Check if the file already has the script tag
    if ! grep -q "pwa-bridge.js" "$HTML_FILE"; then
        # Add the script tag before the closing </head> tag
        sed -i 's/<\/head>/<script src="pwa-bridge.js"><\/script>\n<\/head>/' "$HTML_FILE"
        echo -e "${GREEN}✅ Injected PWA bridge into $(basename "$HTML_FILE")${NC}"
    else
        echo -e "${GREEN}✅ PWA bridge already in $(basename "$HTML_FILE")${NC}"
    fi
done

echo
echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}WebView APK preparation complete!${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo
echo "Next steps:"
echo "1. Open the android-webview-wrapper folder in Android Studio"
echo "2. Let Android Studio sync the project"
echo "3. Build the APK using Android Studio"
echo "4. The debug APK will be in app/build/outputs/apk/debug/"
echo
echo "For easier import to Android Studio, run:"
echo "  ./scripts/export-to-android-studio.sh"
echo
echo -e "${YELLOW}Note: Make sure you have JDK and Android SDK installed for building${NC}"
echo -e "${GREEN}=========================================================${NC}"