#!/bin/bash

# Production Environment Setup Script
# Run this script to set up your production environment variables

echo "🚀 Setting up production environment for School Management System"
echo "================================================"

# Get domain name
read -p "Enter your domain name (e.g., school.yourdomain.com): " DOMAIN_NAME

# Get database password
read -s -p "Enter your database password: " DB_PASSWORD
echo ""

# Get email configuration
read -p "Enter your SMTP email: " SMTP_EMAIL
read -s -p "Enter your SMTP password: " SMTP_PASSWORD
echo ""

# Generate JWT keys
echo "🔐 Generating JWT keys..."
openssl genpkey -algorithm RSA -out private.pem -pkcs8 -aes256
openssl rsa -pubout -in private.pem -out public.pem

PRIVATE_KEY_B64=$(cat private.pem | base64 -w 0)
PUBLIC_KEY_B64=$(cat public.pem | base64 -w 0)

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 32)

# Clean up key files
rm private.pem public.pem

# Create backend .env file
cat > backend/.env << EOF
DATABASE_URL="postgresql://schoolapp_user:${DB_PASSWORD}@localhost:5432/school_management_db"
JWT_PRIVATE_KEY_BASE64="${PRIVATE_KEY_B64}"
JWT_PUBLIC_KEY_BASE64="${PUBLIC_KEY_B64}"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
COOKIE_DOMAIN="${DOMAIN_NAME}"
COOKIE_SAME_SITE="lax"
ACCESS_TOKEN_EXPIRES_IN="900000"
REFRESH_TOKEN_EXPIRES_IN="604800000"
PORT="8080"
NODE_ENV="production"
FRONTEND_URL="https://${DOMAIN_NAME}"
CORS_ORIGIN="https://${DOMAIN_NAME}"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="${SMTP_EMAIL}"
SMTP_PASS="${SMTP_PASSWORD}"
SMTP_FROM="School Management System <noreply@${DOMAIN_NAME}>"
MAX_FILE_SIZE="10485760"
ALLOWED_FILE_TYPES="jpg,jpeg,png,pdf,doc,docx"
UPLOAD_PATH="/home/schoolapp/schoolmanagementsystem/backend/uploads"
LOG_LEVEL="info"
LOG_FILE="/home/schoolapp/schoolmanagementsystem/backend/logs/app.log"
SESSION_SECRET="${SESSION_SECRET}"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"
EOF

# Create frontend .env file
cat > frontend/.env.production << EOF
NEXT_PUBLIC_API_URL=https://${DOMAIN_NAME}/api
BACKEND_ORIGIN=http://localhost:8080
NEXT_PUBLIC_APP_NAME="School Management System"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_CSRF_TOKEN_HEADER=x-csrf-token
EOF

# Update nginx configuration
sed -i "s/yourdomain.com/${DOMAIN_NAME}/g" nginx-school.conf

# Update next.config.ts
sed -i "s/yourdomain.com/${DOMAIN_NAME}/g" frontend/next.config.ts

echo "✅ Environment configuration completed!"
echo "📋 Next steps:"
echo "1. Copy the nginx configuration to /etc/nginx/sites-available/"
echo "2. Get SSL certificate with: sudo certbot --nginx -d ${DOMAIN_NAME}"
echo "3. Build and start your applications"