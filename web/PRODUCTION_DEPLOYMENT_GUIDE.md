# Ascend Authentication System - Production Deployment Guide

This guide provides comprehensive instructions for deploying the Ascend Authentication System to production.

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+ recommended) or Windows Server
- **Memory**: Minimum 4GB RAM, 8GB+ recommended
- **Storage**: Minimum 50GB SSD, 100GB+ recommended
- **Network**: Stable internet connection with static IP
- **SSL Certificate**: Valid SSL certificate for HTTPS

### Required Software
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Node.js**: Version 18+ (for local development)
- **PostgreSQL Client**: For database operations
- **Nginx**: For reverse proxy (if not using Docker)

### Required Accounts & Services
- **Supabase**: Production project with billing enabled
- **Domain**: Registered domain with DNS control
- **SSL Certificate**: From Let's Encrypt, Cloudflare, or commercial CA
- **Monitoring**: Sentry, DataDog, or similar (optional but recommended)
- **Email Service**: For notifications (optional)

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Create production Supabase project
- [ ] Configure domain DNS records
- [ ] Obtain SSL certificates
- [ ] Set up monitoring accounts
- [ ] Configure backup storage (AWS S3, Google Cloud, etc.)

### 2. Security Preparation
- [ ] Generate strong JWT secrets
- [ ] Configure firewall rules
- [ ] Set up VPN access (if required)
- [ ] Prepare security incident response plan
- [ ] Configure rate limiting rules

### 3. Database Setup
- [ ] Run database migrations
- [ ] Configure Row Level Security policies
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Test database performance

## Deployment Methods

### Method 1: Docker Compose (Recommended)

#### Step 1: Clone and Configure
```bash
# Clone the repository
git clone <repository-url>
cd ascend/web

# Copy environment configuration
cp .env.production .env.local

# Edit environment variables
nano .env.local
```

#### Step 2: Configure Environment Variables
```bash
# Required Production Variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export JWT_SECRET="your-super-secret-jwt-key"
export NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Optional but Recommended
export SENTRY_DSN="your-sentry-dsn"
export LOG_LEVEL="info"
export REDIS_PASSWORD="your-redis-password"
export GRAFANA_ADMIN_PASSWORD="your-grafana-password"
```

#### Step 3: Deploy with Docker Compose
```bash
# Build and start services
docker-compose -f docker-compose.production.yml up -d

# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f app
```

#### Step 4: Configure Nginx (if using external Nginx)
```bash
# Copy Nginx configuration
sudo cp nginx/nginx.conf /etc/nginx/sites-available/ascend-auth
sudo ln -s /etc/nginx/sites-available/ascend-auth /etc/nginx/sites-enabled/

# Update domain name in configuration
sudo nano /etc/nginx/sites-available/ascend-auth

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Method 2: Manual Deployment

#### Step 1: Install Dependencies
```bash
# Install Node.js dependencies
npm ci --only=production

# Build the application
npm run build
```

#### Step 2: Configure Process Manager
```bash
# Install PM2
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ascend-auth',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Method 3: Cloud Platform Deployment

#### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### AWS/GCP/Azure Deployment
- Use platform-specific deployment guides
- Configure environment variables in platform settings
- Set up load balancers and auto-scaling
- Configure monitoring and logging

## Post-Deployment Configuration

### 1. SSL Certificate Setup

#### Using Let's Encrypt (Certbot)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### Using Cloudflare
- Configure Cloudflare proxy
- Enable "Full (strict)" SSL mode
- Configure origin certificates

### 2. Database Configuration

#### Run Migrations
```bash
# Using Supabase CLI
supabase db push --project-ref your-project-ref

# Or manually via SQL
psql "postgresql://user:pass@host:port/db" < migrations/all.sql
```

#### Configure Backups
```bash
# Set up automated backups
chmod +x scripts/backup-production.sh

# Add to crontab for daily backups
echo "0 2 * * * /path/to/scripts/backup-production.sh" | crontab -
```

### 3. Monitoring Setup

#### Configure Health Checks
```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test metrics endpoint
curl https://your-domain.com/api/metrics
```

#### Set up Prometheus Monitoring
```bash
# Start monitoring stack
docker-compose -f docker-compose.production.yml up -d prometheus grafana

# Access Grafana dashboard
# URL: https://your-domain.com:3001
# Default login: admin / your-grafana-password
```

### 4. Security Hardening

#### Configure Firewall
```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### Set up Fail2Ban
```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure for Nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Add Nginx jail configuration
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

## Verification & Testing

### 1. Functional Testing
```bash
# Run deployment verification script
./scripts/deploy-production.sh

# Test authentication endpoints
curl -X POST https://your-domain.com/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@college.edu"}'

# Test health endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/api/metrics
```

### 2. Performance Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test concurrent requests
ab -n 1000 -c 10 https://your-domain.com/api/health

# Test authentication endpoint
ab -n 100 -c 5 -p auth-test.json -T application/json \
  https://your-domain.com/api/v1/auth/config
```

### 3. Security Testing
```bash
# Test SSL configuration
curl -I https://your-domain.com

# Test security headers
curl -I https://your-domain.com | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"

# Test rate limiting
for i in {1..20}; do curl https://your-domain.com/api/v1/auth/verify-email; done
```

## Maintenance & Operations

### 1. Regular Maintenance Tasks

#### Daily
- [ ] Check application logs for errors
- [ ] Monitor system resources (CPU, memory, disk)
- [ ] Verify backup completion
- [ ] Check security alerts

#### Weekly
- [ ] Review performance metrics
- [ ] Update dependencies (security patches)
- [ ] Test backup restoration
- [ ] Review access logs for suspicious activity

#### Monthly
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Disaster recovery testing
- [ ] Update documentation

### 2. Monitoring & Alerting

#### Key Metrics to Monitor
- Application uptime and response times
- Database connection pool usage
- Authentication success/failure rates
- Error rates and types
- System resource utilization
- Security events and anomalies

#### Alert Thresholds
- Response time > 2 seconds
- Error rate > 5%
- CPU usage > 80%
- Memory usage > 90%
- Disk usage > 85%
- Failed authentication attempts > 10/minute

### 3. Backup & Recovery

#### Backup Schedule
- **Database**: Daily at 2 AM UTC
- **Configuration**: Weekly
- **Application logs**: Daily
- **System snapshots**: Weekly

#### Recovery Procedures
```bash
# List available backups
./scripts/restore-production.sh --list

# Restore from specific backup
./scripts/restore-production.sh --timestamp 20240101_020000

# Restore from latest backup
./scripts/restore-production.sh
```

## Troubleshooting

### Common Issues

#### Application Won't Start
1. Check environment variables
2. Verify database connectivity
3. Check port availability
4. Review application logs

#### Database Connection Issues
1. Verify Supabase project status
2. Check connection string format
3. Verify network connectivity
4. Check connection pool limits

#### SSL Certificate Issues
1. Verify certificate validity
2. Check certificate chain
3. Verify domain configuration
4. Check certificate renewal

#### Performance Issues
1. Check database query performance
2. Monitor system resources
3. Review application logs
4. Check network latency

### Log Locations
- **Application logs**: `/var/log/ascend-auth/`
- **Nginx logs**: `/var/log/nginx/`
- **System logs**: `/var/log/syslog`
- **Docker logs**: `docker logs <container-name>`

### Support Contacts
- **Technical Issues**: tech-support@your-domain.com
- **Security Issues**: security@your-domain.com
- **Emergency**: emergency-contact@your-domain.com

## Scaling Considerations

### Horizontal Scaling
- Use load balancers (AWS ALB, Nginx, Cloudflare)
- Deploy multiple application instances
- Configure session affinity if needed
- Use Redis for shared session storage

### Database Scaling
- Configure read replicas
- Implement connection pooling
- Use database caching (Redis)
- Monitor query performance

### CDN Configuration
- Use Cloudflare, AWS CloudFront, or similar
- Configure caching rules
- Optimize static asset delivery
- Enable compression

This deployment guide ensures a secure, scalable, and maintainable production deployment of the Ascend Authentication System.