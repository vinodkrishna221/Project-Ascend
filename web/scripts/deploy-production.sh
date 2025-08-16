#!/bin/bash

# Production Deployment Script for Ascend Authentication System
# This script handles the complete production deployment process

set -e  # Exit on any error

echo "🚀 Starting Ascend Authentication Production Deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking required environment variables..."
    
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "JWT_SECRET"
        "NEXT_PUBLIC_APP_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    print_success "All required environment variables are set"
}

# Install dependencies
install_dependencies() {
    print_status "Installing production dependencies..."
    npm ci --only=production
    print_success "Dependencies installed"
}

# Run tests
run_tests() {
    print_status "Running test suite..."
    npm run test -- --run --reporter=verbose
    print_success "All tests passed"
}

# Build the application
build_application() {
    print_status "Building Next.js application for production..."
    npm run build
    print_success "Application built successfully"
}

# Deploy Supabase Edge Functions
deploy_edge_functions() {
    print_status "Deploying Supabase Edge Functions..."
    
    if command -v supabase &> /dev/null; then
        # Deploy all edge functions
        supabase functions deploy --project-ref $SUPABASE_PROJECT_REF
        print_success "Edge Functions deployed"
    else
        print_warning "Supabase CLI not found. Please deploy Edge Functions manually"
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if command -v supabase &> /dev/null; then
        supabase db push --project-ref $SUPABASE_PROJECT_REF
        print_success "Database migrations completed"
    else
        print_warning "Supabase CLI not found. Please run migrations manually"
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if the application is accessible
    if curl -f -s "$NEXT_PUBLIC_APP_URL/api/health" > /dev/null; then
        print_success "Application is accessible"
    else
        print_error "Application health check failed"
        exit 1
    fi
    
    # Check authentication endpoints
    if curl -f -s "$NEXT_PUBLIC_APP_URL/api/v1/auth/config" > /dev/null; then
        print_success "Authentication endpoints are accessible"
    else
        print_error "Authentication endpoints health check failed"
        exit 1
    fi
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring and alerting..."
    
    # This would typically integrate with your monitoring service
    # For now, we'll just log the setup
    print_warning "Monitoring setup requires manual configuration of your monitoring service"
    print_status "Please configure the following:"
    echo "  - Application performance monitoring"
    echo "  - Error tracking and alerting"
    echo "  - Database performance monitoring"
    echo "  - Security incident alerts"
}

# Main deployment process
main() {
    print_status "Starting production deployment process..."
    
    check_env_vars
    install_dependencies
    run_tests
    build_application
    deploy_edge_functions
    run_migrations
    verify_deployment
    setup_monitoring
    
    print_success "🎉 Production deployment completed successfully!"
    print_status "Application is now live at: $NEXT_PUBLIC_APP_URL"
}

# Run the main function
main "$@"