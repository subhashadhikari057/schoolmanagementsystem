#!/bin/bash

# Complete Deployment Script for School Management System
# This script handles the full deployment process

set -e  # Exit on any error

echo "🚀 Starting School Management System Deployment"
echo "==============================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_status() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

print_info() {
    echo -e "\033[1;34mℹ️  $1\033[0m"
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed"
    exit 1
fi

if ! command_exists pm2; then
    print_error "PM2 is not installed. Installing..."
    sudo npm install -g pm2
fi

print_status "Prerequisites check passed"

# Create necessary directories
print_info "Creating directories..."
mkdir -p /deploy/schoolmanagementsystem/logs
mkdir -p /deploy/schoolmanagementsystem/backend/logs
mkdir -p /deploy/schoolmanagementsystem/backend/uploads

# Set proper permissions
sudo chown -R deploy:deploy /deploy/schoolmanagementsystem/
chmod 755 /deploy/schoolmanagementsystem/backend/uploads

print_status "Directories created"

# Install dependencies
print_info "Installing dependencies..."
cd /deploy/schoolmanagementsystem

# Install root dependencies
npm install

# Install and build shared types
cd shared-types
npm install
npm run build
print_status "Shared types built"

# Install and build backend
cd ../backend
npm install

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found in backend directory"
    print_info "Please create backend/.env file with your configuration"
    exit 1
fi

# Run database operations
print_info "Setting up database..."
npx prisma generate
npx prisma migrate deploy

# Ask if user wants to seed database
read -p "Do you want to seed the database with initial data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:seed:comprehensive
    print_status "Database seeded"
fi

# Build backend
npm run build
print_status "Backend built"

# Install and build frontend
cd ../frontend
npm install

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found in frontend directory"
    print_info "Please create frontend/.env.production file with your configuration"
    exit 1
fi

# Clean node_modules and reinstall to fix workspace issues
rm -rf node_modules package-lock.json
npm install

npm run build
print_status "Frontend built"

# Configure nginx
print_info "Configuring nginx..."
cd ..

# Copy nginx configuration
sudo cp nginx-school.conf /etc/nginx/sites-available/school

# Enable site
sudo ln -sf /etc/nginx/sites-available/school /etc/nginx/sites-enabled/

# Test nginx configuration
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
    sudo systemctl reload nginx
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Stop existing PM2 processes
print_info "Stopping existing PM2 processes..."
pm2 delete all 2>/dev/null || true

# Start applications with PM2
print_info "Starting applications with PM2..."
pm2 start ecosystem.config.json

# Save PM2 configuration
pm2 save

# Setup PM2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u schoolapp --hp /home/schoolapp

print_status "Applications started with PM2"

# Display status
echo ""
echo "🎉 Deployment completed successfully!"
echo "======================================"
pm2 status
echo ""
print_info "Application URLs:"
echo "• Frontend: https://$(hostname -f) or https://your-domain.com"
echo "• Backend API: https://$(hostname -f)/api or https://your-domain.com/api"
echo ""
print_info "Useful commands:"
echo "• Check status: pm2 status"
echo "• View logs: pm2 logs"
echo "• Restart apps: pm2 restart all"
echo "• Monitor: pm2 monit"
echo ""
print_info "Don't forget to:"
echo "1. Configure your domain's DNS to point to this server"
echo "2. Get SSL certificate: sudo certbot --nginx -d your-domain.com"
echo "3. Update frontend and backend URLs in environment files"