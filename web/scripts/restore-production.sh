#!/bin/bash

# Production Restore Script for Ascend Authentication System
# This script handles disaster recovery and database restoration

set -e

echo "🔄 Starting Ascend Authentication Production Restore..."

# Configuration
BACKUP_DIR="/var/backups/ascend-auth"
RESTORE_TIMESTAMP=""

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

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -t, --timestamp TIMESTAMP    Restore from specific backup timestamp"
    echo "  -l, --list                   List available backups"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list                    # List all available backups"
    echo "  $0 -t 20240101_120000        # Restore from specific backup"
    echo "  $0                           # Restore from latest backup"
}

# List available backups
list_backups() {
    print_status "Available backups:"
    echo ""
    
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR"/database_backup_*.sql.gz 2>/dev/null | while read -r line; do
            echo "  $line"
        done
        
        echo ""
        ls -la "$BACKUP_DIR"/config_backup_*.tar.gz 2>/dev/null | while read -r line; do
            echo "  $line"
        done
    else
        print_warning "No backup directory found at $BACKUP_DIR"
    fi
}

# Validate backup file
validate_backup() {
    local backup_file=$1
    
    print_status "Validating backup file: $backup_file"
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    # Test backup integrity
    if gunzip -t "$backup_file"; then
        print_success "Backup file validation passed"
    else
        print_error "Backup file is corrupted"
        exit 1
    fi
}

# Create database backup before restore
create_pre_restore_backup() {
    print_status "Creating pre-restore backup..."
    
    local pre_restore_timestamp=$(date +"%Y%m%d_%H%M%S")
    local pre_restore_file="$BACKUP_DIR/pre_restore_backup_$pre_restore_timestamp.sql"
    
    if [ -n "$SUPABASE_DB_URL" ] && command -v pg_dump &> /dev/null; then
        pg_dump "$SUPABASE_DB_URL" > "$pre_restore_file"
        gzip "$pre_restore_file"
        print_success "Pre-restore backup created: $pre_restore_file.gz"
    else
        print_warning "Could not create pre-restore backup"
    fi
}

# Restore database
restore_database() {
    local backup_file=$1
    
    print_status "Restoring database from: $backup_file"
    
    if [ -z "$SUPABASE_DB_URL" ]; then
        print_error "SUPABASE_DB_URL environment variable not set"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_error "psql not found. Please install PostgreSQL client tools"
        exit 1
    fi
    
    # Confirm restore operation
    echo ""
    print_warning "This will OVERWRITE the current database!"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_status "Restore operation cancelled"
        exit 0
    fi
    
    # Stop application services
    print_status "Stopping application services..."
    docker-compose -f docker-compose.production.yml stop app || true
    
    # Restore database
    print_status "Restoring database..."
    gunzip -c "$backup_file" | psql "$SUPABASE_DB_URL"
    
    print_success "Database restore completed"
}

# Restore configuration files
restore_config() {
    local config_backup_file=$1
    
    if [ -f "$config_backup_file" ]; then
        print_status "Restoring configuration files from: $config_backup_file"
        
        # Extract to temporary directory
        local temp_dir=$(mktemp -d)
        tar -xzf "$config_backup_file" -C "$temp_dir"
        
        # Restore configuration files (with confirmation)
        echo ""
        print_warning "This will overwrite current configuration files!"
        read -p "Do you want to restore configuration files? (yes/no): " confirm_config
        
        if [ "$confirm_config" = "yes" ]; then
            cp -r "$temp_dir"/config_*/migrations supabase/ 2>/dev/null || true
            cp "$temp_dir"/config_*/config.toml supabase/ 2>/dev/null || true
            cp "$temp_dir"/config_*/docker-compose.production.yml . 2>/dev/null || true
            cp "$temp_dir"/config_*/nginx.conf nginx/ 2>/dev/null || true
            cp "$temp_dir"/config_*/prometheus.yml monitoring/ 2>/dev/null || true
            
            print_success "Configuration files restored"
        else
            print_status "Configuration restore skipped"
        fi
        
        # Cleanup
        rm -rf "$temp_dir"
    else
        print_warning "Configuration backup file not found: $config_backup_file"
    fi
}

# Verify restore
verify_restore() {
    print_status "Verifying restore..."
    
    # Start application services
    print_status "Starting application services..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to start
    sleep 30
    
    # Check application health
    local app_url=${NEXT_PUBLIC_APP_URL:-"http://localhost:3000"}
    
    if curl -f -s "$app_url/api/health" > /dev/null; then
        print_success "Application is running and healthy"
    else
        print_error "Application health check failed"
        exit 1
    fi
    
    # Check database connectivity
    if curl -f -s "$app_url/api/v1/auth/config" > /dev/null; then
        print_success "Database connectivity verified"
    else
        print_error "Database connectivity check failed"
        exit 1
    fi
}

# Send restore notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🔄 Ascend Auth Restore $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"🔄 Ascend Auth Restore $status: $message\"}" \
            "$DISCORD_WEBHOOK_URL" || true
    fi
}

# Main restore process
main() {
    local start_time=$(date)
    
    print_status "Starting restore process at $start_time"
    
    # Determine backup files to use
    local db_backup_file
    local config_backup_file
    
    if [ -n "$RESTORE_TIMESTAMP" ]; then
        db_backup_file="$BACKUP_DIR/database_backup_$RESTORE_TIMESTAMP.sql.gz"
        config_backup_file="$BACKUP_DIR/config_backup_$RESTORE_TIMESTAMP.tar.gz"
    else
        # Use latest backup
        db_backup_file=$(ls -t "$BACKUP_DIR"/database_backup_*.sql.gz 2>/dev/null | head -n1)
        config_backup_file=$(ls -t "$BACKUP_DIR"/config_backup_*.tar.gz 2>/dev/null | head -n1)
    fi
    
    if [ -z "$db_backup_file" ]; then
        print_error "No database backup file found"
        exit 1
    fi
    
    validate_backup "$db_backup_file"
    create_pre_restore_backup
    restore_database "$db_backup_file"
    restore_config "$config_backup_file"
    verify_restore
    
    local end_time=$(date)
    local success_message="Restore completed successfully. Started: $start_time, Finished: $end_time"
    
    print_success "$success_message"
    send_notification "SUCCESS" "$success_message"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--timestamp)
            RESTORE_TIMESTAMP="$2"
            shift 2
            ;;
        -l|--list)
            list_backups
            exit 0
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Error handling
trap 'print_error "Restore failed at line $LINENO"; send_notification "FAILED" "Restore process failed at line $LINENO"' ERR

# Run main function
main "$@"