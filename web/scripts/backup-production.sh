#!/bin/bash

# Production Backup Script for Ascend Authentication System
# This script handles database backups and disaster recovery preparation

set -e

echo "🔄 Starting Ascend Authentication Production Backup..."

# Configuration
BACKUP_DIR="/var/backups/ascend-auth"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    print_status "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
    print_success "Backup directory created: $BACKUP_DIR"
}

# Backup Supabase database
backup_database() {
    print_status "Starting database backup..."
    
    if [ -z "$SUPABASE_DB_URL" ]; then
        print_error "SUPABASE_DB_URL environment variable not set"
        exit 1
    fi
    
    local backup_file="$BACKUP_DIR/database_backup_$TIMESTAMP.sql"
    
    # Use pg_dump to backup the database
    if command -v pg_dump &> /dev/null; then
        pg_dump "$SUPABASE_DB_URL" > "$backup_file"
        
        # Compress the backup
        gzip "$backup_file"
        backup_file="$backup_file.gz"
        
        print_success "Database backup completed: $backup_file"
        
        # Verify backup integrity
        if gunzip -t "$backup_file"; then
            print_success "Backup integrity verified"
        else
            print_error "Backup integrity check failed"
            exit 1
        fi
    else
        print_error "pg_dump not found. Please install PostgreSQL client tools"
        exit 1
    fi
}

# Backup configuration files
backup_config() {
    print_status "Backing up configuration files..."
    
    local config_backup_dir="$BACKUP_DIR/config_$TIMESTAMP"
    mkdir -p "$config_backup_dir"
    
    # Backup important configuration files (without secrets)
    cp -r supabase/migrations "$config_backup_dir/" 2>/dev/null || true
    cp supabase/config.toml "$config_backup_dir/" 2>/dev/null || true
    cp docker-compose.production.yml "$config_backup_dir/" 2>/dev/null || true
    cp nginx/nginx.conf "$config_backup_dir/" 2>/dev/null || true
    cp monitoring/prometheus.yml "$config_backup_dir/" 2>/dev/null || true
    
    # Create a tar archive
    tar -czf "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "config_$TIMESTAMP"
    rm -rf "$config_backup_dir"
    
    print_success "Configuration backup completed"
}

# Backup storage files (if using local storage)
backup_storage() {
    print_status "Backing up storage files..."
    
    if [ -d "/var/lib/supabase/storage" ]; then
        tar -czf "$BACKUP_DIR/storage_backup_$TIMESTAMP.tar.gz" -C "/var/lib/supabase" storage
        print_success "Storage backup completed"
    else
        print_warning "No local storage directory found. Skipping storage backup."
    fi
}

# Test backup restoration (dry run)
test_backup_restoration() {
    print_status "Testing backup restoration (dry run)..."
    
    local latest_backup=$(ls -t "$BACKUP_DIR"/database_backup_*.sql.gz 2>/dev/null | head -n1)
    
    if [ -n "$latest_backup" ]; then
        # Test if we can read the backup file
        if gunzip -t "$latest_backup"; then
            print_success "Backup restoration test passed"
        else
            print_error "Backup restoration test failed"
            exit 1
        fi
    else
        print_warning "No database backup found for restoration test"
    fi
}

# Clean up old backups
cleanup_old_backups() {
    print_status "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    print_success "Old backups cleaned up"
}

# Upload backup to cloud storage (optional)
upload_to_cloud() {
    if [ -n "$AWS_S3_BACKUP_BUCKET" ]; then
        print_status "Uploading backups to AWS S3..."
        
        if command -v aws &> /dev/null; then
            aws s3 sync "$BACKUP_DIR" "s3://$AWS_S3_BACKUP_BUCKET/ascend-auth-backups/" \
                --exclude "*" \
                --include "*_$TIMESTAMP.*" \
                --storage-class STANDARD_IA
            
            print_success "Backups uploaded to S3"
        else
            print_warning "AWS CLI not found. Skipping cloud upload."
        fi
    fi
    
    if [ -n "$GCS_BACKUP_BUCKET" ]; then
        print_status "Uploading backups to Google Cloud Storage..."
        
        if command -v gsutil &> /dev/null; then
            gsutil -m cp "$BACKUP_DIR"/*_$TIMESTAMP.* "gs://$GCS_BACKUP_BUCKET/ascend-auth-backups/"
            print_success "Backups uploaded to GCS"
        else
            print_warning "gsutil not found. Skipping cloud upload."
        fi
    fi
}

# Send backup notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🔄 Ascend Auth Backup $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"🔄 Ascend Auth Backup $status: $message\"}" \
            "$DISCORD_WEBHOOK_URL" || true
    fi
}

# Main backup process
main() {
    local start_time=$(date)
    
    print_status "Starting backup process at $start_time"
    
    create_backup_dir
    backup_database
    backup_config
    backup_storage
    test_backup_restoration
    cleanup_old_backups
    upload_to_cloud
    
    local end_time=$(date)
    local success_message="Backup completed successfully. Started: $start_time, Finished: $end_time"
    
    print_success "$success_message"
    send_notification "SUCCESS" "$success_message"
}

# Error handling
trap 'print_error "Backup failed at line $LINENO"; send_notification "FAILED" "Backup process failed at line $LINENO"' ERR

# Run main function
main "$@"