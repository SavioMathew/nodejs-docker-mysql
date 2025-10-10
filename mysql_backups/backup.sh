#!/bin/bash
# Variables
VOLUME_NAME=db_data
BACKUP_DIR=/home/ubuntu/mysql_backups
DATE=$(date +%F_%H-%M)
S3_BUCKET=s3://myql-docker-nodejs-backup

# Create backup from Docker volume

docker run --rm \
  -v ${VOLUME_NAME}:/db_data:ro \
  -v ${BACKUP_DIR}:/backup \
  alpine \
  sh -c "tar czf /backup/mysql_data_${DATE}.tar.gz -C /db_data ."

aws s3 cp ${BACKUP_DIR}/mysql_data_${DATE}.tar.gz ${S3_BUCKET}/
