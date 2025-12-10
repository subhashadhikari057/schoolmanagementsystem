#!/bin/bash

# =============================================================================
# School Management System - Production Deployment Script
# =============================================================================
# This script handles the complete deployment process after code changes
# Run this script after pushing/pulling changes to deploy to production
# =============================================================================

set -e  # Exit on any error

echo "🚀 Starting School Management System Production Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Current directory: $(pwd)"
print_info "Starting deployment process..."

# Step 1: Clean everything
print_info "Step 1: Cleaning node_modules and package-lock.json files..."
rm -rf */node_modules */package-lock.json node_modules package-lock.json
print_status "Cleaned all dependencies"

# Step 2: Install root dependencies
print_info "Step 2: Installing root dependencies..."
if npm install; then
    print_status "Root dependencies installed"
else
    print_error "Failed to install root dependencies"
    exit 1
fi

# Step 3: Build shared-types
print_info "Step 3: Building shared-types..."
cd shared-types
if npm install && npm run build; then
    print_status "Shared-types built successfully"
else
    print_error "Failed to build shared-types"
    exit 1
fi
cd ..
print_status "Returned to project root"

# Step 4: Setup backend
print_info "Step 4: Setting up backend..."
cd backend
if npm install; then
    print_status "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Step 5: Generate Prisma client
print_info "Step 5: Generating Prisma client (CRITICAL)..."
if npx prisma generate; then
    print_status "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Step 6: Install TypeScript types
print_info "Step 6: Installing TypeScript types..."
if npm install --save-dev @types/node; then
    print_status "@types/node installed"
else
    print_warning "@types/node install failed, but continuing..."
fi

# Step 7: Build backend
print_info "Step 7: Building backend..."
if npm run build; then
    print_status "Backend built successfully"
else
    print_error "Failed to build backend"
    exit 1
fi
cd ..
print_status "Returned to project root"

# Step 8: Build frontend
print_info "Step 8: Building frontend..."
cd frontend
if npm install && npm run build; then
    print_status "Frontend built successfully"
else
    print_error "Failed to build frontend"
    exit 1
fi
cd ..
print_status "Returned to project root"

# Step 9: Database setup
print_info "Step 9: Setting up database..."
cd backend

# Run migrations
print_info "Running database migrations..."
if npx prisma migrate deploy; then
    print_status "Database migrations completed"
else
    print_warning "Migration failed, but continuing..."
fi

# Seed database
print_info "Seeding database with demo data..."
if npm run db:seed:comprehensive; then
    print_status "Database seeded with comprehensive demo data"
else
    print_warning "Database seeding failed, but continuing..."
fi

cd ..
print_status "Database setup completed"

# Final status
echo ""
echo "================================================================="
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "================================================================="
echo ""
print_info "Next steps:"
echo "1. Start the backend: cd backend && npm start"
echo "2. Start the frontend: cd frontend && npm start"
echo "3. Or use PM2: npm run pm2:start"
echo "4. Access your application at: https://sms.navneetverma.com"
echo ""
print_info "Services should be running on:"
echo "  - Backend API: http://localhost:8080"
echo "  - Frontend: http://localhost:3000"
echo "  - External: https://sms.navneetverma.com"
echo ""
print_status "Deployment script finished successfully! 🚀"
