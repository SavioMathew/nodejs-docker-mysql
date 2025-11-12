#!/bin/bash
# -------------------------------
# 🐳 Docker Image Backup to S3 (Keep Only Latest Local Copy)
# -------------------------------

# S3 Configuration
S3_BUCKET="docker-images-3-backup"
S3_FOLDER="docker-backups"

# Timestamp
DATE=$(date +%F_%H-%M-%S)

# Local backup directory
LOCAL_BACKUP_DIR="$(pwd)/docker-backups"
mkdir -p "$LOCAL_BACKUP_DIR"

# File paths
TAR_FILE="$LOCAL_BACKUP_DIR/docker_images_${DATE}.tar"
GZ_FILE="${TAR_FILE}.gz"
LATEST_FILE="$LOCAL_BACKUP_DIR/docker_images_latest.tar.gz"

echo "🔹 Starting Docker image backup to s3://$S3_BUCKET/$S3_FOLDER/"

# Step 1: Get list of valid images (skip <none> tags)
IMAGES=$(docker images --format '{{.Repository}}:{{.Tag}}' | grep -v '<none>')
if [ -z "$IMAGES" ]; then
  echo "❌ No valid Docker images found to back up."
  exit 1
fi

# Step 2: Save all Docker images into one .tar file
echo "💾 Saving Docker images..."
docker save $IMAGES -o "$TAR_FILE"
if [ $? -ne 0 ]; then
  echo "❌ Docker save failed. Aborting."
  exit 1
fi

# Step 3: Compress the backup
echo "🗜️ Compressing backup..."
gzip "$TAR_FILE"

# Step 4: Copy latest
cp "$GZ_FILE" "$LATEST_FILE"

# Step 5: Upload to S3
echo "☁️ Uploading to S3..."
aws s3 cp "$GZ_FILE" "s3://$S3_BUCKET/$S3_FOLDER/"
if [ $? -ne 0 ]; then
  echo "❌ Upload to S3 failed. Aborting."
  exit 1
fi

# Step 6: Clean up old local backups (keep latest)
find "$LOCAL_BACKUP_DIR" -type f -name "docker_images_*.tar.gz" ! -name "$(basename "$GZ_FILE")" -delete

echo "✅ Backup completed successfully!"
echo "📦 Local copy: $GZ_FILE"
echo "☁️ Uploaded to: s3://$S3_BUCKET/$S3_FOLDER/"

