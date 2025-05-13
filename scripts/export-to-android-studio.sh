#!/bin/bash

# Shillong Teer India - Export to Android Studio
# This script prepares the project for Android Studio and creates a zip archive

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}Shillong Teer India - Export to Android Studio${NC}"
echo -e "${GREEN}=========================================================${NC}"
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

# Create a zip file with the Android project
echo
echo "Creating zip archive of the Android project..."
ZIP_FILE="shillong-teer-webview-android.zip"
zip -r "$ZIP_FILE" android-webview-wrapper
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create zip archive.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Zip archive created: $ZIP_FILE${NC}"

echo
echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}Export complete!${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo
echo "To build the APK:"
echo "1. Extract the '$ZIP_FILE' file"
echo "2. Open the android-webview-wrapper folder in Android Studio"
echo "3. Let Android Studio sync the project"
echo "4. Choose Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo "5. Find the APK in android-webview-wrapper/app/build/outputs/apk/debug/"
echo
echo "To distribute the APK:"
echo "1. Choose Build > Generate Signed Bundle/APK"
echo "2. Follow the steps to create a signing key (or use an existing one)"
echo "3. Select 'APK' as the type to generate"
echo "4. Choose 'release' as the build variant"
echo "5. The signed APK will be in android-webview-wrapper/app/release/"
echo
echo -e "${YELLOW}Note: To use Android Studio, make sure you have JDK and Android SDK installed${NC}"
echo -e "${GREEN}=========================================================${NC}"