# Clixen AI - Authentication System with Winston Logging

## 🚀 Overview

Production-ready, multi-method authentication system for the Clixen AI Telegram automation platform. Features comprehensive error handling, Winston-based logging, and Playwright testing integration.

## ✨ Key Features

- **🔐 Multi-Method Authentication**: Email/password, GitHub OAuth, Google OAuth
- **📝 Winston Logging**: Structured logging with daily rotation and performance monitoring  
- **🧪 Comprehensive Testing**: Playwright with Winston integration and detailed reporting
- **🛡️ Enterprise Security**: JWT tokens, HTTPS, secure headers, privacy protection
- **📊 Production Monitoring**: Health checks, error tracking, performance metrics
- **🔧 Developer Tools**: Enhanced debugging, error recovery, screenshot capture

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Next.js 15    │───▶│ Stack Auth   │───▶│   NeonDB    │
│   Frontend      │    │ (NeonAuth)   │    │ PostgreSQL  │
└─────────────────┘    └──────────────┘    └─────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌──────────────┐
│ Winston Logger  │    │OAuth Providers│
│ + Daily Rotate  │    │GitHub & Google│
└─────────────────┘    └──────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (NeonDB)
- Stack Auth account

### Installation

```bash
# Clone repository
git clone <repository-url>
cd clixen-ai/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Stack Auth and OAuth credentials

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### Environment Configuration

```env
# Stack Auth Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_client_key
STACK_SECRET_SERVER_KEY=your_secret_key

# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🧪 Testing

### Run Authentication Tests

```bash
# Basic Playwright tests
npm run test

# Winston-enhanced comprehensive tests
node test-auth-with-winston.cjs

# View test logs
cat logs/auth-test.log

# View test screenshots
ls logs/*.png
```

### Test Features Covered
- ✅ Multi-method authentication UI detection
- ✅ Wrong password validation and error handling
- ✅ OAuth redirect functionality
- ✅ Form interaction and validation
- ✅ Performance monitoring and timing
- ✅ Screenshot capture for debugging

## 📝 Winston Logging

### Log Categories
- **Authentication Events**: Login attempts, successes, failures
- **Performance Metrics**: Response times, load times, form interactions
- **Error Tracking**: Critical errors, handled exceptions, validation failures
- **Test Results**: Test execution, assertions, performance data

### Log Files
```
logs/
├── auth-2025-08-27.log           # Authentication events
├── error-2025-08-27.log          # Error logs
├── combined-2025-08-27.log       # All application logs  
├── auth-test.log                 # Test execution logs
└── auth-test-report.json         # Detailed test results
```

### Usage Examples

```typescript
import { authLogger, perfLogger, errorLogger } from './lib/logger';

// Log authentication attempt
authLogger.authAttempt({
  method: 'email',
  email: 'user@example.com',
  userAgent: req.headers['user-agent']
});

// Log performance metrics
perfLogger.timing('auth_response', 1250); // ms

// Log critical errors with context
errorLogger.critical('Authentication system failure', error, {
  userId: 'user123',
  timestamp: new Date().toISOString()
});
```

## 🔧 Configuration

### Stack Auth Dashboard Setup

1. **Access Dashboard**: `https://app.stack-auth.com/projects/your-project-id`

2. **Configure Authentication Methods**:
   - ✅ Enable Email/Password authentication
   - ✅ Add GitHub OAuth provider
   - ✅ Add Google OAuth with provided credentials
   - ✅ Set account linking strategy to "Link"

3. **Production Setup**:
   - Enable production mode
   - Configure production OAuth credentials
   - Set production callback URLs

### Database Schema

```prisma
model Profile {
  id               String   @id @default(cuid())
  neonAuthUserId   String   @unique
  email            String   @unique
  telegramChatId   String?  @unique
  tier             Tier     @default(FREE)
  trialActive      Boolean  @default(true)
  quotaUsed        Int      @default(0)
  usageLogs        UsageLog[]
}

model UsageLog {
  id             BigInt   @id @default(autoincrement())
  profileId      String
  action         String
  success        Boolean  @default(true)
  createdAt      DateTime @default(now())
  profile        Profile  @relation(fields: [profileId], references: [id])
}
```

## 🛠️ Development

### Project Structure
```
src/
├── app/
│   ├── auth/
│   │   ├── signin/page.tsx      # Sign in page
│   │   └── signup/page.tsx      # Sign up page
│   ├── actions.ts               # Server actions
│   └── layout.tsx               # Root layout with auth
├── lib/
│   ├── logger.ts                # Winston logging system
│   ├── neon-auth.ts            # Stack Auth configuration
│   └── prisma.ts               # Prisma client
├── docs/
│   └── AUTHENTICATION_SYSTEM.md # Complete documentation
└── logs/                        # Winston log files
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run Playwright tests
npm run test:ui      # Run tests with UI
npm run test:headed  # Run tests in headed mode

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma studio    # Open Prisma studio

# Logging
tail -f logs/auth-*.log    # Monitor authentication logs
cat logs/auth-test-report.json | jq '.summary'  # View test summary
```

## 🔍 Troubleshooting

### Common Issues

#### Authentication Form Not Loading
```bash
# Check server status
curl -I http://localhost:3000/auth/signin

# Check logs for errors
grep -i error logs/auth-*.log

# Verify environment variables
node -e "console.log(process.env.NEXT_PUBLIC_STACK_PROJECT_ID)"
```

#### Wrong Password Not Showing Error
```bash
# Run comprehensive test
node test-auth-with-winston.cjs

# Check authentication method configuration in Stack Auth dashboard
# Ensure email/password is set as primary method
```

#### OAuth Issues
```bash
# Verify OAuth credentials
grep "GOOGLE_CLIENT" .env.local

# Check OAuth callback logs
grep "oauth_callback" logs/auth-*.log
```

### Debug Commands

```bash
# Real-time log monitoring
tail -f logs/combined-*.log

# Search for specific errors
grep -i "authentication" logs/error-*.log

# View test results with details
cat logs/auth-test-report.json | jq '.'

# Check system performance
top -p $(pgrep -f "next dev")
```

## 🚀 Production Deployment

### Pre-Deployment Checklist
- [ ] Run full test suite
- [ ] Configure production environment variables
- [ ] Enable Stack Auth production mode
- [ ] Set up production OAuth credentials
- [ ] Configure log monitoring
- [ ] Test database connections
- [ ] Verify SSL certificates

### Health Checks
```bash
# Authentication system health
curl -f https://your-domain.com/api/health/auth

# Database connection health  
curl -f https://your-domain.com/api/health/db
```

## 📊 Monitoring

### Key Metrics
- Authentication success/failure rates
- Response time percentiles
- Error frequency and types
- User registration and login patterns

### Alerts Configuration
```javascript
// Set up alerts for critical metrics
const criticalErrors = logs.filter(log => 
  log.level === 'error' && log.event === 'auth_failure'
);

if (criticalErrors.length > threshold) {
  sendAlert('High authentication failure rate detected');
}
```

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Implement changes with tests
3. Run full test suite
4. Update documentation
5. Submit pull request

### Code Standards
- TypeScript strict mode
- ESLint + Prettier formatting
- Winston structured logging
- Comprehensive error handling
- Test coverage for new features

## 📚 Documentation

- **[Complete Documentation](docs/AUTHENTICATION_SYSTEM.md)** - Comprehensive system guide
- **[API Reference](docs/AUTHENTICATION_SYSTEM.md#api-reference)** - Server actions and endpoints
- **[Testing Guide](docs/AUTHENTICATION_SYSTEM.md#testing-framework)** - Test framework details
- **[Security Guide](docs/AUTHENTICATION_SYSTEM.md#security-implementation)** - Security measures

## 🏆 Achievement Status

✅ **Multi-Method Authentication**: Email/password, GitHub OAuth, Google OAuth working  
✅ **Winston Logging System**: Structured logging with daily rotation implemented  
✅ **Comprehensive Testing**: Playwright with Winston integration completed  
✅ **Production Ready**: Security, monitoring, deployment guides complete  
✅ **Developer Experience**: Documentation, debugging tools, error handling enhanced  

**Original Request Status**: ✅ **COMPLETED** - "Wrong password testing" now works with comprehensive error handling and logging.

## 📞 Support

- **Issues**: Create GitHub issues for technical problems
- **Documentation**: Refer to [complete documentation](docs/AUTHENTICATION_SYSTEM.md)
- **Logs**: Check Winston logs in `logs/` directory for debugging

---

*Built with ❤️ by Terragon Labs*  
*Authentication System v1.0.0 - Production Ready*