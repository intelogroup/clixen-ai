# 📁 B2C Automation Platform - Repository Structure

## 🎯 **NEW PROFESSIONAL STRUCTURE**

This document outlines the reorganized repository structure for scalable development.

```
clixen-ai/
├── 📁 apps/                          # Applications (monorepo structure)
│   ├── 📁 web/                       # Next.js Frontend Application
│   │   ├── 📁 app/                   # Next.js 14 App Router
│   │   ├── 📁 components/            # React Components
│   │   ├── 📁 lib/                   # Utilities & Configurations
│   │   ├── 📁 types/                 # TypeScript Type Definitions
│   │   └── 📄 package.json           # Frontend Dependencies
│   │
│   └── 📁 workflows/                 # n8n Workflow Definitions
│       ├── 📁 templates/             # Production Workflow Templates
│       ├── 📁 development/           # Development/Test Workflows
│       └── 📁 exports/               # Exported Workflow JSON Files
│
├── 📁 packages/                      # Shared Packages
│   ├── 📁 ui/                        # Shared UI Components
│   ├── 📁 database/                  # Database Schema & Types
│   ├── 📁 config/                    # Shared Configuration
│   └── 📁 utils/                     # Shared Utilities
│
├── 📁 infrastructure/                # Infrastructure as Code
│   ├── 📁 supabase/                  # Database Schema & Migrations
│   │   ├── 📁 migrations/            # SQL Migration Files
│   │   ├── 📁 functions/             # Edge Functions
│   │   └── 📁 seed/                  # Sample Data
│   │
│   ├── 📁 n8n/                       # n8n Configuration
│   │   ├── 📁 credentials/           # Credential Templates
│   │   ├── 📁 settings/              # Environment Settings
│   │   └── 📁 backups/               # Workflow Backups
│   │
│   └── 📁 deployment/                # Deployment Scripts
│       ├── 📁 vercel/                # Vercel Configuration
│       ├── 📁 sliplane/              # Sliplane Setup
│       └── 📁 monitoring/            # Monitoring Setup
│
├── 📁 docs/                          # Documentation
│   ├── 📁 api/                       # API Documentation
│   ├── 📁 workflows/                 # Workflow Documentation
│   ├── 📁 deployment/                # Deployment Guides
│   └── 📁 user/                      # User Guides
│
├── 📁 tools/                         # Development Tools
│   ├── 📁 scripts/                   # Build & Deployment Scripts
│   ├── 📁 testing/                   # Testing Utilities
│   └── 📁 generators/                # Code Generators
│
├── 📁 .github/                       # GitHub Configuration
│   ├── 📁 workflows/                 # CI/CD Pipelines
│   ├── 📁 ISSUE_TEMPLATE/            # Issue Templates
│   └── 📄 PULL_REQUEST_TEMPLATE.md   # PR Template
│
├── 📄 package.json                   # Root Package Configuration
├── 📄 turbo.json                     # Turbo Monorepo Config
├── 📄 .env.example                   # Environment Template
├── 📄 ROADMAP.md                     # Development Roadmap
├── 📄 TASKMANAGER.md                 # Task Management
└── 📄 README.md                      # Project Overview
```

---

## 🏗️ **MIGRATION PLAN**

### **Phase 1: Create New Structure**
1. Create new directory structure
2. Move existing files to appropriate locations
3. Update import paths and references
4. Test functionality

### **Phase 2: Configure Development Environment**
1. Set up monorepo tooling (Turbo)
2. Configure TypeScript for workspace
3. Set up ESLint and Prettier
4. Configure testing framework

### **Phase 3: Update CI/CD**
1. Create GitHub workflows
2. Configure deployment pipelines
3. Set up monitoring and alerting
4. Document new processes

---

## 📦 **PACKAGE MANAGEMENT**

### **Root Package.json**
```json
{
  "name": "clixen-ai-platform",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "deploy": "turbo run deploy",
    "db:push": "cd apps/web && npm run db:push",
    "db:migrate": "cd infrastructure/supabase && npm run migrate"
  }
}
```

### **Workspace Dependencies**
- **Shared**: TypeScript, ESLint, Prettier
- **Frontend**: Next.js, React, Tailwind, Supabase
- **Backend**: Node.js, n8n APIs, PostgreSQL
- **Testing**: Jest, Playwright, Artillery
- **Deployment**: Vercel CLI, custom scripts

---

## 🔧 **DEVELOPMENT WORKFLOW**

### **Local Development**
```bash
# Install all dependencies
npm install

# Start development servers
npm run dev
# - Web app: http://localhost:3000
# - API docs: http://localhost:3001

# Run tests
npm run test

# Build for production
npm run build
```

### **Code Quality**
```bash
# Lint all packages
npm run lint

# Format code
npm run format

# Type checking
npm run type-check

# Run full quality check
npm run quality:check
```

### **Database Operations**
```bash
# Deploy database schema
npm run db:push

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

---

## 🎯 **BENEFITS OF NEW STRUCTURE**

### **Scalability**
- Clear separation of concerns
- Easy to add new applications
- Shared code reduces duplication
- Modular architecture

### **Developer Experience**
- Consistent tooling across packages
- Fast build times with Turbo
- Simplified dependency management
- Clear development workflow

### **Maintainability**
- Well-organized codebase
- Easy to find and modify code
- Clear ownership boundaries
- Comprehensive documentation

### **Deployment**
- Independent deployment of apps
- Optimized build processes
- Environment-specific configurations
- Automated CI/CD pipelines

---

## 📋 **MIGRATION CHECKLIST**

- [ ] Create new directory structure
- [ ] Move frontend code to `apps/web/`
- [ ] Move workflows to `apps/workflows/`
- [ ] Move documentation to `docs/`
- [ ] Create shared packages
- [ ] Configure monorepo tooling
- [ ] Update all import paths
- [ ] Configure TypeScript workspaces
- [ ] Set up ESLint and Prettier
- [ ] Configure testing framework
- [ ] Create GitHub workflows
- [ ] Update README and documentation
- [ ] Test all functionality
- [ ] Deploy to staging environment

---

**Status**: 🔄 In Progress  
**Next Step**: Execute migration  
**Owner**: Development Team  
**Timeline**: 1-2 days