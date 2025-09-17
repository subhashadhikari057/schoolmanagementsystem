#!/bin/bash

# ============================================================================
# School Management System VPS Deployment Script
# ============================================================================
# Professional deployment workflow for VPS deployment
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "============================================================================"
    echo "$1"
    echo "============================================================================"
    echo -e "${NC}"
}

# Configuration
VPS_USER="root"
VPS_HOST="135.181.66.185"
VPS_PATH="/var/www/schoolmanagementsystem"
DOMAIN="sms.navneetverma.com"

# Check if we're running from the correct directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the root of your project directory"
    exit 1
fi

print_header "🚀 School Management System VPS Deployment"

# Step 1: Local preparations
print_info "Step 1: Preparing local environment..."

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Do you want to continue? (y/N)"
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Please commit your changes first"
        exit 1
    fi
fi

# Get current branch and commit
CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse --short HEAD)

print_info "Current branch: $CURRENT_BRANCH"
print_info "Current commit: $CURRENT_COMMIT"

# Step 2: Build locally (optional verification)
print_info "Step 2: Building locally for verification..."
print_info "Building shared types..."
cd shared-types
npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1
cd ..

print_info "Building backend..."
cd backend
npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1
cd ..

print_info "Building frontend..."
cd frontend
npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1
cd ..

print_success "Local build verification completed"

# Step 3: Deploy to VPS
print_info "Step 3: Deploying to VPS..."

# Function to run commands on VPS
run_vps_command() {
    ssh "$VPS_USER@$VPS_HOST" "$1"
}

# Function to copy files to VPS
copy_to_vps() {
    rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.next' \
          --exclude='uploads' --exclude='logs' --exclude='.env*' \
          ./ "$VPS_USER@$VPS_HOST:$VPS_PATH/"
}

print_info "Copying files to VPS..."
copy_to_vps

print_info "Setting up VPS environment..."

# Create deployment script for VPS
cat > /tmp/vps-deploy.sh << 'EOF'
#!/bin/bash
set -e

cd /var/www/schoolmanagementsystem

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Build shared types
echo "🔧 Building shared types..."
cd shared-types
npm install
npm run build

# Build backend
echo "🏗️  Building backend..."
cd ../backend
npm install

# Generate Prisma client
npx prisma generate

# Build backend
npm run build

# Build frontend
echo "🎨 Building frontend..."
cd ../frontend
npm install
npm run build

echo "✅ Build completed successfully"
EOF

# Copy and run deployment script on VPS
scp /tmp/vps-deploy.sh "$VPS_USER@$VPS_HOST:/tmp/"
run_vps_command "chmod +x /tmp/vps-deploy.sh && /tmp/vps-deploy.sh"

# Clean up temp file
rm /tmp/vps-deploy.sh

print_success "VPS build completed"

# Step 4: Restart services
print_info "Step 4: Restarting services..."

run_vps_command "cd $VPS_PATH && pm2 restart ecosystem.config.json || pm2 start ecosystem.config.json"
run_vps_command "pm2 save"

print_success "Services restarted"

# Step 5: Health check
print_info "Step 5: Running health checks..."

sleep 5  # Wait for services to start

# Check if services are running
if run_vps_command "pm2 list | grep -q 'online'"; then
    print_success "PM2 services are running"
else
    print_error "Some PM2 services failed to start"
    run_vps_command "pm2 status"
    exit 1
fi

# Check if website is accessible
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200\|301\|302"; then
    print_success "Website is accessible"
else
    print_warning "Website might not be fully accessible yet"
fi

# Final status
print_header "🎉 Deployment Completed Successfully!"

echo "📋 Deployment Summary:"
echo "• Branch: $CURRENT_BRANCH"
echo "• Commit: $CURRENT_COMMIT"
echo "• Domain: https://$DOMAIN"
echo "• Backend API: https://$DOMAIN/api"
echo ""

print_info "Useful commands to run on VPS:"
echo "• Check status: pm2 status"
echo "• View logs: pm2 logs"
echo "• Restart: pm2 restart all"
echo "• Monitor: pm2 monit"
echo ""

print_info "Post-deployment checklist:"
echo "• ✅ Test login functionality"
echo "• ✅ Check API endpoints"
echo "• ✅ Verify file uploads"
echo "• ✅ Test all major features"

print_success "Deployment completed! 🚀"
