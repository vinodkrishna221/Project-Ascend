# Production Deployment Script for Ascend Authentication System (PowerShell)
# This script handles the complete production deployment process

param(
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [string]$Environment = "production"
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Ascend Authentication Production Deployment..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if required environment variables are set
function Test-EnvironmentVariables {
    Write-Status "Checking required environment variables..."
    
    $requiredVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY", 
        "SUPABASE_SERVICE_ROLE_KEY",
        "JWT_SECRET",
        "NEXT_PUBLIC_APP_URL"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if (-not (Get-ChildItem Env: | Where-Object Name -eq $var)) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables: $($missingVars -join ', ')"
        exit 1
    }
    
    Write-Success "All required environment variables are set"
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing production dependencies..."
    npm ci --only=production
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    Write-Success "Dependencies installed"
}

# Run tests
function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "Skipping tests as requested"
        return
    }
    
    Write-Status "Running test suite..."
    npm run test -- --run --reporter=verbose
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed"
        exit 1
    }
    Write-Success "All tests passed"
}

# Build the application
function Build-Application {
    if ($SkipBuild) {
        Write-Warning "Skipping build as requested"
        return
    }
    
    Write-Status "Building Next.js application for production..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        exit 1
    }
    Write-Success "Application built successfully"
}

# Deploy Supabase Edge Functions
function Deploy-EdgeFunctions {
    Write-Status "Deploying Supabase Edge Functions..."
    
    if (Get-Command supabase -ErrorAction SilentlyContinue) {
        $projectRef = $env:SUPABASE_PROJECT_REF
        if ($projectRef) {
            supabase functions deploy --project-ref $projectRef
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Edge Functions deployed"
            } else {
                Write-Error "Failed to deploy Edge Functions"
                exit 1
            }
        } else {
            Write-Warning "SUPABASE_PROJECT_REF not set. Please deploy Edge Functions manually"
        }
    } else {
        Write-Warning "Supabase CLI not found. Please deploy Edge Functions manually"
    }
}

# Run database migrations
function Invoke-Migrations {
    Write-Status "Running database migrations..."
    
    if (Get-Command supabase -ErrorAction SilentlyContinue) {
        $projectRef = $env:SUPABASE_PROJECT_REF
        if ($projectRef) {
            supabase db push --project-ref $projectRef
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Database migrations completed"
            } else {
                Write-Error "Database migrations failed"
                exit 1
            }
        } else {
            Write-Warning "SUPABASE_PROJECT_REF not set. Please run migrations manually"
        }
    } else {
        Write-Warning "Supabase CLI not found. Please run migrations manually"
    }
}

# Verify deployment
function Test-Deployment {
    Write-Status "Verifying deployment..."
    
    $appUrl = $env:NEXT_PUBLIC_APP_URL
    if (-not $appUrl) {
        Write-Error "NEXT_PUBLIC_APP_URL not set"
        exit 1
    }
    
    try {
        # Check if the application is accessible
        $healthResponse = Invoke-WebRequest -Uri "$appUrl/api/health" -Method GET -TimeoutSec 30
        if ($healthResponse.StatusCode -eq 200) {
            Write-Success "Application is accessible"
        } else {
            Write-Error "Application health check failed with status: $($healthResponse.StatusCode)"
            exit 1
        }
        
        # Check authentication endpoints
        $authResponse = Invoke-WebRequest -Uri "$appUrl/api/v1/auth/config" -Method GET -TimeoutSec 30
        if ($authResponse.StatusCode -eq 200) {
            Write-Success "Authentication endpoints are accessible"
        } else {
            Write-Error "Authentication endpoints health check failed with status: $($authResponse.StatusCode)"
            exit 1
        }
    }
    catch {
        Write-Error "Deployment verification failed: $($_.Exception.Message)"
        exit 1
    }
}

# Setup monitoring
function Initialize-Monitoring {
    Write-Status "Setting up monitoring and alerting..."
    
    Write-Warning "Monitoring setup requires manual configuration of your monitoring service"
    Write-Status "Please configure the following:"
    Write-Host "  - Application performance monitoring" -ForegroundColor Gray
    Write-Host "  - Error tracking and alerting" -ForegroundColor Gray
    Write-Host "  - Database performance monitoring" -ForegroundColor Gray
    Write-Host "  - Security incident alerts" -ForegroundColor Gray
}

# Main deployment process
function Start-Deployment {
    Write-Status "Starting production deployment process..."
    
    try {
        Test-EnvironmentVariables
        Install-Dependencies
        Invoke-Tests
        Build-Application
        Deploy-EdgeFunctions
        Invoke-Migrations
        Test-Deployment
        Initialize-Monitoring
        
        Write-Success "🎉 Production deployment completed successfully!"
        Write-Status "Application is now live at: $($env:NEXT_PUBLIC_APP_URL)"
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run the main function
Start-Deployment