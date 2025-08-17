#!/bin/bash

# Kanban App Backup Script
# Creates a backup zip file in the parent directory excluding build artifacts

# Get current date and time for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PROJECT_NAME="kanban-app"
BACKUP_NAME="${PROJECT_NAME}_backup_${TIMESTAMP}.zip"

# Get the project directory (current directory)
PROJECT_DIR=$(pwd)
PROJECT_FOLDER_NAME=$(basename "$PROJECT_DIR")

# Get the parent directory where backup will be saved
PARENT_DIR=$(dirname "$PROJECT_DIR")
BACKUP_PATH="${PARENT_DIR}/${BACKUP_NAME}"

echo "🗂️  Creating backup of ${PROJECT_NAME}..."
echo "📁 Project directory: ${PROJECT_DIR}"
echo "💾 Backup will be saved to: ${BACKUP_PATH}"

# Create temporary directory for organizing files
TEMP_DIR=$(mktemp -d)
TEMP_PROJECT_DIR="${TEMP_DIR}/${PROJECT_FOLDER_NAME}"

echo "📋 Copying source files..."

# Copy the entire project to temp directory
cp -r "$PROJECT_DIR" "$TEMP_PROJECT_DIR"

# Remove excluded directories and files from the temporary copy
echo "🧹 Excluding build artifacts and dependencies..."

# Build and dependency directories
rm -rf "${TEMP_PROJECT_DIR}/node_modules"
rm -rf "${TEMP_PROJECT_DIR}/.next"
rm -rf "${TEMP_PROJECT_DIR}/dist"
rm -rf "${TEMP_PROJECT_DIR}/build"
rm -rf "${TEMP_PROJECT_DIR}/out"

# Cache directories
rm -rf "${TEMP_PROJECT_DIR}/.npm"
rm -rf "${TEMP_PROJECT_DIR}/.cache"
rm -rf "${TEMP_PROJECT_DIR}/.vercel"
rm -rf "${TEMP_PROJECT_DIR}/.turbo"

# OS and editor files
rm -rf "${TEMP_PROJECT_DIR}/.DS_Store"
rm -rf "${TEMP_PROJECT_DIR}/Thumbs.db"
rm -rf "${TEMP_PROJECT_DIR}/.vscode"
rm -rf "${TEMP_PROJECT_DIR}/.idea"

# Log files
rm -rf "${TEMP_PROJECT_DIR}/*.log"
rm -rf "${TEMP_PROJECT_DIR}/logs"

# Temporary files
rm -rf "${TEMP_PROJECT_DIR}/tmp"
rm -rf "${TEMP_PROJECT_DIR}/temp"

# Remove any existing backup files
rm -f "${TEMP_PROJECT_DIR}"/*.zip

echo "📦 Creating zip archive..."

# Create the zip file
cd "$TEMP_DIR"
zip -r "$BACKUP_PATH" "$PROJECT_FOLDER_NAME" -q

# Clean up temporary directory
rm -rf "$TEMP_DIR"

if [ -f "$BACKUP_PATH" ]; then
    # Get file size
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    
    echo "✅ Backup created successfully!"
    echo "📁 Location: ${BACKUP_PATH}"
    echo "📏 Size: ${BACKUP_SIZE}"
    echo ""
    echo "📋 Backup includes:"
    echo "   - Source code (src/)"
    echo "   - Configuration files (.env, package.json, etc.)"
    echo "   - Documentation files"
    echo "   - Git repository (.git/)"
    echo ""
    echo "📋 Backup excludes:"
    echo "   - node_modules/"
    echo "   - .next/"
    echo "   - dist/, build/, out/"
    echo "   - Cache directories"
    echo "   - Log files"
    echo "   - OS/Editor specific files"
else
    echo "❌ Backup failed!"
    exit 1
fi

echo "🎉 Backup completed at $(date)"