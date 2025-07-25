# 🏫 School Management System

> A modern, scalable school management platform built with **Domain-Driven Design** principles and **Atomic Design** methodology for enterprise-grade educational institutions.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🌟 Overview

A comprehensive school management solution designed for single-school environments with multi-role support (Students, Teachers, Parents, Administrators). Built with modularity, security, and scalability at its core, this system demonstrates professional software architecture patterns and best practices.

## 🚀 Key Features

### 👥 Role-Based Access Control
- **Students**: View grades, attendance, assignments, and timetables
- **Teachers**: Manage classes, record attendance, assign grades
- **Parents**: Monitor student progress and communicate with teachers
- **Administrators**: Complete system management and oversight

### 📊 Core Modules
- **📈 Attendance Management** - Real-time tracking and reporting
- **📚 Academic Management** - Grades, courses, and curriculum
- **⏰ Timetable System** - Class scheduling and room management
- **📢 Communication Hub** - Announcements and messaging
- **💬 Complaints System** - Issue tracking and resolution

### 🔐 Security & Performance
- JWT-based authentication with role-based permissions
- Input validation and sanitization
- Responsive design with mobile-first approach
- Server-side rendering for optimal performance

## 🏗️ Architecture

### Backend (NestJS) - Domain-Driven Design
```
📦 backend/src/
├── 📁 modules/                    # Domain Modules (Bounded Contexts)
│   ├── 📁 student/               # Student domain logic
│   │   ├── application/          # Business logic orchestration
│   │   ├── domain/               # Entities, aggregates, interfaces
│   │   ├── infrastructure/       # Data persistence adapters
│   │   └── dto/                  # Data Transfer Objects
│   ├── 📁 teacher/               # Teacher domain logic
│   ├── 📁 attendance/            # Attendance domain logic
│   └── ...
├── 📁 shared/                    # Cross-cutting concerns
│   ├── 📁 auth/                  # Authentication logic
│   ├── 📁 guards/                # Route guards
│   └── 📁 middlewares/           # Request middlewares
├── 📁 infrastructure/           # External concerns
│   ├── 📁 database/              # Database configuration
│   └── 📁 mailer/                # Email services
└── 📁 common/                   # Global utilities
```

### Frontend (Next.js) - Atomic Design
```
📦 frontend/src/
├── 📁 app/                      # App Router pages
│   ├── 📁 dashboard/            # Role-based dashboards
│   │   ├── 📁 student/          # Student dashboard
│   │   ├── 📁 teacher/          # Teacher dashboard
│   │   ├── 📁 parent/           # Parent dashboard
│   │   └── 📁 admin/            # Admin dashboard
│   └── 📁 auth/                 # Authentication pages
├── 📁 components/               # Atomic Design System
│   ├── 📁 atoms/                # Basic UI elements
│   ├── 📁 molecules/            # Composite components
│   ├── 📁 organisms/            # Complex UI sections
│   └── 📁 layout/               # Layout components
├── 📁 features/                 # Feature modules
│   ├── 📁 attendance/           # Attendance features
│   ├── 📁 timetable/            # Timetable features
│   └── ...
└── 📁 lib/                      # Utilities & configurations
```

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: Prisma ORM (PostgreSQL/MySQL ready)
- **Authentication**: JWT + Passport.js
- **Validation**: Zod schemas + Class Validator
- **Testing**: Jest (Unit & E2E)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript  
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios + TanStack Query
- **Icons**: Lucide React

### Development Tools
- **Code Quality**: ESLint + Prettier
- **Git Hooks**: Husky + Lint-staged
- **Commit Standard**: Conventional Commits
- **Type Checking**: Strict TypeScript

## 🚦 Getting Started

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/school-management-system.git
   cd school-management-system
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

#### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

#### Production Mode

**Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

### Access Points
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/ (returns "Hello World!")

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e
```

### Frontend Testing
```bash
cd frontend

# Run component tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run end-to-end tests (when implemented)
npm run test:e2e
```

## 📋 Development Guidelines

### Code Standards
- **Strict TypeScript**: No `any` types allowed
- **ESLint + Prettier**: Automated code formatting
- **Conventional Commits**: Use semantic commit messages
- **Pre-commit Hooks**: Automated linting and testing

### Architecture Principles
- **No Cross-Module Imports**: Modules communicate via interfaces only
- **Dependency Inversion**: Use dependency injection containers
- **Single Responsibility**: Each class/component has one purpose
- **Interface Segregation**: Keep interfaces focused and minimal

### Naming Conventions
| Item | Convention | Example |
|------|-----------|---------|
| Folders | `kebab-case` | `student-module` |
| Files | `kebab-case` | `student.service.ts` |
| Classes | `PascalCase` | `StudentService` |
| Variables | `camelCase` | `studentId` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_STUDENTS_PER_CLASS` |
| Interfaces | `PascalCase` with `I` prefix | `IStudentRepository` |

## 📁 Available Scripts

### Backend Scripts
```bash
npm run start:dev      # Development with hot reload
npm run start:debug    # Development with debugging
npm run start:prod     # Production mode
npm run build          # Build for production
npm run format         # Format code with Prettier
npm run lint           # Lint and fix code issues
npm test               # Run unit tests
npm run test:e2e       # Run integration tests
npm run test:cov       # Run tests with coverage
```

### Frontend Scripts
```bash
npm run dev            # Development server
npm run build          # Build for production
npm start              # Start production server
npm run lint           # Lint code
npm test               # Run tests
npm run type-check     # TypeScript type checking
```

## 🗄️ Database Setup (Optional)

The application currently uses in-memory storage for demo purposes. To use a real database:

1. **Install database** (PostgreSQL recommended)
2. **Configure environment variables**
   ```bash
   # backend/.env
   DATABASE_URL="postgresql://username:password@localhost:5432/school_db"
   JWT_SECRET="your-jwt-secret"
   ```
3. **Run Prisma migrations**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

## 🚀 Deployment

### Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment
1. Build both applications
2. Set production environment variables
3. Deploy to your preferred hosting platform
4. Configure reverse proxy (Nginx recommended)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Commit Message Format
```
type(scope): description

feat(auth): add JWT token refresh mechanism
fix(student): resolve grade calculation bug
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(api): simplify student service logic
test(user): add unit tests for user creation
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different ports
# Backend: npm run start:dev -- --port 3001
# Frontend: npm run dev -- --port 3002
```

**Module Not Found:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors:**
```bash
# Check TypeScript configuration
npm run type-check

# Restart TypeScript service in your IDE
```

## 📞 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

## 🙏 Acknowledgments

- **Domain-Driven Design** principles by Eric Evans
- **Atomic Design** methodology by Brad Frost
- **Clean Architecture** concepts by Robert C. Martin
- **NestJS** framework and community
- **Next.js** team and ecosystem

---

⭐ **Star this repository if you find it helpful!**

> 💡 **Perfect for**: Learning modern full-stack development, understanding DDD architecture, building production-ready educational software, or as a foundation for custom school management solutions. 