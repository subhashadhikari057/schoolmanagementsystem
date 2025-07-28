# 🚀 School Management System - Developer Quick Reference

## 📋 ONE-TIME SETUP (New Developers)

```powershell
# AUTOMATED SETUP (Recommended)
.\scripts\setup-new-developer.ps1

# MANUAL SETUP (If needed)
npm install
cd backend && npm install
cd ../frontend && npm install
copy backend\.env.example backend\.env
# Edit backend\.env with your DATABASE_URL
.\scripts\docker-dev-start.ps1
```

---

## 🌐 SERVICE URLS & PORTS

| Service | URL | Credentials | Purpose |
|---------|-----|-------------|---------|
| **Backend** | http://localhost:8080 | None | API server |
| **Frontend** | http://localhost:3000 | None | Web app |
| **MailHog** | http://localhost:8025 | None | Email testing |
| **VPS pgAdmin** | http://95.216.235.115:80/ | admin@school.com / StrongPass123! | DB admin |

---

## 💾 DATABASE CONNECTIONS

```env
# VPS Database (Team/Production-like)
DATABASE_URL="postgresql://schooladmin:StrongPass123!@95.216.235.115:5432/schoolmanagement?schema=public"

# Local Docker Database (Fast/Offline)
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/schoolmanagement?schema=public"
```

---

## 🎯 DAILY COMMANDS

### Start Development
```powershell
# Start all services
.\scripts\docker-dev-start.ps1

# Start backend (Terminal 1)
cd backend && npm run start:dev

# Start frontend (Terminal 2)
cd frontend && npm run dev
```

### Stop Development
```powershell
# Stop servers: Ctrl+C in terminals
# Stop Docker services
.\scripts\docker-dev-stop.ps1
```

### Docker Management
```powershell
.\scripts\docker-dev-start.ps1    # Start services
.\scripts\docker-dev-stop.ps1     # Stop services  
.\scripts\docker-dev-reset.ps1    # Reset all data
.\scripts\test-docker-services.ps1 # Test services
```

---

## 🧪 TESTING COMMANDS

```powershell
# Test everything (MAIN TEST)
.\scripts\test-phase0-final.ps1

# Test Docker services specifically
.\scripts\test-docker-services.ps1

# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test
```

---

## 🔧 CODE QUALITY

```powershell
# Check code quality
cd backend && npm run lint
cd frontend && npm run lint

# Fix code issues
npm run lint:fix

# Format code
npm run format

# Git hooks run automatically on commit
git add .
git commit -m "feat: your changes"
```

---

## 💾 DATABASE COMMANDS

```powershell
cd backend

# Update database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# View database in browser
npx prisma studio

# Reset database (DANGER!)
npx prisma db push --force-reset
```

---

## 🐛 TROUBLESHOOTING

### Services Won't Start
```powershell
# Check Docker is running
docker info

# Reset everything
.\scripts\docker-dev-reset.ps1

# Check ports aren't in use
netstat -an | findstr :8080
netstat -an | findstr :3000
netstat -an | findstr :5432
```

### Backend Issues
```powershell
# Check .env file exists
dir backend\.env

# Reinstall dependencies
cd backend
rmdir /s node_modules
npm install
```

### Database Issues
```powershell
# Test VPS connection
telnet 95.216.235.115 5432

# Test local Docker DB
docker exec sms_postgres pg_isready -U postgres

# Check DATABASE_URL format
type backend\.env | findstr DATABASE_URL
```

---

## 📁 PROJECT STRUCTURE

```
schoolmanagementsystem/
├── backend/          # NestJS API server
├── frontend/         # Next.js web app
├── docker/           # Docker configurations
├── scripts/          # Automation scripts
├── docs/phase0/      # Setup documentation
└── docker-compose.yml # Docker services
```

---

## 🔐 ENVIRONMENT VARIABLES

**Required in `backend/.env`:**
- `DATABASE_URL` - Database connection
- `PORT` - Backend port (8080)
- `NODE_ENV` - Environment (development)
- `JWT_PRIVATE_KEY_BASE64` - JWT signing key
- `JWT_PUBLIC_KEY_BASE64` - JWT verification key

**Optional:**
- `REDIS_URL` - Redis cache connection
- `CORS_ORIGIN` - Frontend URL (http://localhost:3000)

---

## 🎉 SUCCESS INDICATORS

✅ **Setup Complete When:**
- `.\scripts\test-phase0-final.ps1` shows "Tests Passed: 27/27 (100%)"
- Backend starts at http://localhost:8080
- Frontend loads at http://localhost:3000  
- MailHog accessible at http://localhost:8025
- Git hooks run on commit

---

## 📚 DOCUMENTATION LINKS

- **[Essential Scripts Reference](./ESSENTIAL-SCRIPTS.md)** - All 6 scripts explained
- **[Complete Setup Guide](./developer-setup-guide.md)** - Full instructions
- **[Task 0.0-1 Guide](./task-0.0-1-eslint-prettier-husky-setup.md)** - Code quality
- **[Task 0.0-2 Guide](./task-0.0-2-environment-management.md)** - Environment setup
- **[Task 0.0-3 Guide](./task-0.0-3-docker-development-stack.md)** - Docker services

---

## 🆘 NEED HELP?

1. **Check this quick reference first**
2. **Read the complete setup guide**: `docs/phase0/developer-setup-guide.md`
3. **Run the automated setup**: `.\scripts\setup-new-developer.ps1`
4. **Test your setup**: `.\scripts\test-phase0-final.ps1`

---

**💡 TIP: Bookmark this file - it has everything you need for daily development!** 