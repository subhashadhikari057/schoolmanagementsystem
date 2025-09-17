# 🚀 School Management System Deployment Guide

Complete professional deployment workflow from local development to production VPS.

## 📋 Prerequisites

- Node.js 20+ installed locally
- Git configured
- SSH access to your VPS (135.181.66.185)
- Domain (sms.navneetverma.com) pointing to your VPS

## 🏠 Local Development Setup

### 1. Initial Setup
```bash
# Make setup script executable
chmod +x dev-setup.sh

# Run local setup
./dev-setup.sh
```

### 2. Configure Environment
```bash
# Update backend/.env with your local database
DATABASE_URL="postgresql://user:password@localhost:5432/school_db"

# Update frontend/.env.local (already created by script)
NEXT_PUBLIC_API_URL=http://localhost:8080
BACKEND_ORIGIN=http://localhost:8080
```

### 3. Start Development
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

**Local URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## 🌐 VPS Deployment

### 1. Prepare for Deployment
```bash
# Make deployment script executable
chmod +x deploy-vps.sh

# Commit your changes
git add .
git commit -m "Your changes"
git push origin main
```

### 2. Set Up VPS Environment Files

**Create backend/.env on VPS:**
```env
DATABASE_URL="postgresql://schooladmin:3SMSnew321!@localhost:5432/school_management_db"
JWT_PRIVATE_KEY_BASE64="your_jwt_private_key"
JWT_PUBLIC_KEY_BASE64="your_jwt_public_key"
COOKIE_DOMAIN="sms.navneetverma.com"
NODE_ENV="production"
PORT=8080
CORS_ORIGIN="https://sms.navneetverma.com"
FRONTEND_URL="https://sms.navneetverma.com"
```

**Create frontend/.env.production.local on VPS:**
```env
NEXT_PUBLIC_API_URL=https://sms.navneetverma.com
BACKEND_ORIGIN=https://sms.navneetverma.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 3. Deploy to VPS
```bash
# Run deployment script
./deploy-vps.sh
```

This script will:
- ✅ Build locally for verification
- ✅ Copy files to VPS (excluding node_modules, dist, .next)
- ✅ Install dependencies on VPS
- ✅ Build applications on VPS
- ✅ Restart PM2 services
- ✅ Run health checks

### 4. Configure Nginx and SSL

**On your VPS:**
```bash
# Copy nginx configuration
sudo cp /var/www/schoolmanagementsystem/nginx-vps.conf /etc/nginx/sites-available/school-management

# Enable site
sudo ln -sf /etc/nginx/sites-available/school-management /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Get SSL certificate
sudo certbot --nginx -d sms.navneetverma.com

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

## 🔄 Regular Deployment Workflow

### Daily Development Cycle:
1. **Develop locally**
   ```bash
   # Make changes
   cd backend && npm run dev  # or frontend
   ```

2. **Test locally**
   ```bash
   # Test your changes
   curl http://localhost:8080/api/v1/health
   ```

3. **Commit changes**
   ```bash
   git add .
   git commit -m "Feature: Add new functionality"
   git push origin main
   ```

4. **Deploy to VPS**
   ```bash
   ./deploy-vps.sh
   ```

### Hot Fixes:
```bash
# For urgent fixes, you can deploy specific changes
git add specific-file.ts
git commit -m "Hotfix: Critical bug fix"
git push origin main
./deploy-vps.sh
```

## 🔧 Useful Commands

### Local Development:
```bash
# Reset local database
cd backend
npx prisma migrate reset

# View logs
npm run dev  # Shows real-time logs

# Build for production testing
npm run build
```

### VPS Management:
```bash
# SSH to VPS
ssh root@135.181.66.185

# Check PM2 status
pm2 status
pm2 logs
pm2 monit

# Restart services
pm2 restart all

# Check nginx
sudo nginx -t
sudo systemctl status nginx

# View system logs
tail -f /var/log/school-*.log
```

## 🐛 Troubleshooting

### Common Issues:

**1. Build Fails:**
```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**2. Database Connection Issues:**
```bash
# Check database connectivity
cd backend
npx prisma migrate status
npx prisma db pull
```

**3. SSL Certificate Issues:**
```bash
# Renew SSL certificate
sudo certbot renew
sudo systemctl reload nginx
```

**4. PM2 Services Not Starting:**
```bash
# Check PM2 logs
pm2 logs
pm2 delete all
pm2 start ecosystem.config.json
```

## 📊 Monitoring

### Health Checks:
- Website: https://sms.navneetverma.com
- API Health: https://sms.navneetverma.com/api/v1/health
- PM2 Dashboard: `pm2 monit`

### Log Locations:
- Backend: `/var/log/school-backend.log`
- Frontend: `/var/log/school-frontend.log`
- Nginx: `/var/log/nginx/access.log`

## 🔒 Security Checklist

- ✅ SSL certificate configured
- ✅ Firewall configured (UFW)
- ✅ Rate limiting enabled
- ✅ Security headers configured
- ✅ Environment variables secured
- ✅ Database access restricted
- ✅ File upload restrictions

## 🎯 Performance Optimization

- ✅ Gzip compression enabled
- ✅ Static file caching
- ✅ PM2 process management
- ✅ Database connection pooling
- ✅ CDN-ready static assets

## 📞 Support

If you encounter issues:
1. Check the logs first: `pm2 logs`
2. Verify environment variables
3. Test API endpoints manually
4. Check nginx configuration: `sudo nginx -t`

---

**Happy Deploying! 🚀**
