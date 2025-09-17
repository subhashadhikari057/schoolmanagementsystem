#!/bin/bash

# ============================================================================
# Local Development Setup Script
# ============================================================================
# Sets up your local development environment
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_info "Setting up local development environment..."

# Install root dependencies
print_info "Installing root dependencies..."
npm install

# Setup shared types
print_info "Setting up shared types..."
cd shared-types
npm install
npm run build
cd ..

# Setup backend
print_info "Setting up backend..."
cd backend
npm install

# Check if .env exists
if [ ! -f .env ]; then
    print_info "Creating backend .env from example..."
    cp .env.example .env
    echo "⚠️  Please update backend/.env with your local database credentials"
fi

# Generate Prisma client
npx prisma generate

print_info "Backend setup completed"
cd ..

# Setup frontend
print_info "Setting up frontend..."
cd frontend
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    print_info "Creating frontend .env.local..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8080
BACKEND_ORIGIN=http://localhost:8080
EOF
fi

print_info "Frontend setup completed"
cd ..

print_success "Local development environment is ready!"

echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your database credentials"
echo "2. Run database migrations: cd backend && npx prisma migrate dev"
echo "3. Start development:"
echo "   • Backend: cd backend && npm run dev"
echo "   • Frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Local URLs:"
echo "• Frontend: http://localhost:3000"
echo "• Backend API: http://localhost:8080"
echo "• API Docs: http://localhost:8080/api"
