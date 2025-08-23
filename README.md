# 🚀 Clixen AI - Telegram Bot Automation Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-blue)](https://stripe.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

**Lead generation platform that converts visitors into paying subscribers for AI-powered automation services via Telegram bot.**

## 🎯 Business Model

**Landing Page → Payment → Telegram Bot Access**

1. **Lead Generation**: Marketing landing page with automation promises
2. **Subscription Plans**: Tiered pricing (Starter $9, Pro $29, Enterprise $99)
3. **Payment Processing**: Stripe checkout with instant provisioning
4. **Bot Access**: Users get @ClixenAIBot access after payment
5. **Automation**: All workflow creation through Telegram chat interface

## ✨ Features

### 🎨 Frontend (Lead Generation)
- **Modern Landing Page**: Hero, features, pricing, testimonials
- **Authentication System**: Email/password + magic links
- **Subscription Management**: Plan selection and Stripe checkout
- **Payment Flow**: Success pages and bot access instructions
- **Responsive Design**: Mobile-optimized with Tailwind CSS

### 💳 Payment Integration
- **Stripe Checkout**: Secure subscription payments
- **Webhook Handling**: Automatic user provisioning
- **Multiple Plans**: Credits-based tiering system
- **Billing Management**: Upgrades, downgrades, cancellations

### 🤖 Telegram Bot Integration
- **Secure Access**: User-specific authentication codes
- **Credit Tracking**: Usage monitoring and billing integration
- **Command Interface**: Natural language workflow creation
- **Template System**: Pre-built automation templates

### 🗄️ Database & Backend
- **Supabase**: PostgreSQL with real-time capabilities
- **Authentication**: Row-level security and JWT tokens
- **User Profiles**: Credits, subscriptions, and preferences
- **Usage Analytics**: Tracking and billing data

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality components
- **Framer Motion**: Animations and transitions

### Backend & Services  
- **Supabase**: Database, auth, and real-time features
- **Stripe**: Payment processing and subscription management
- **n8n**: Workflow automation engine
- **Vercel**: Deployment and hosting

### Development Tools
- **ESLint + Prettier**: Code formatting and linting
- **Playwright**: End-to-end testing
- **Claude Code & Gemini**: AI-assisted development

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (test keys for development)

### 1. Clone Repository
```bash
git clone https://github.com/your-org/clixen-ai.git
cd clixen-ai/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create `.env.local` file:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Database Setup
Run the Supabase migrations (see `CLAUDE.md` for details):
```bash
# Database schema is in CLAUDE.md
# Run using postgres client or Supabase dashboard
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## 🏗️ Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── stripe/        # Payment handling
│   │   └── user/          # User management
│   ├── subscription/      # Pricing page
│   ├── bot-access/        # Post-payment bot access
│   ├── payment-success/   # Payment confirmation
│   ├── dashboard/         # User dashboard
│   └── profile/           # Account settings
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── AuthModal.tsx     # Authentication modal
│   ├── ModernHero.tsx    # Landing page hero
│   └── PricingSection.tsx # Pricing display
├── lib/                  # Utility functions
│   ├── stripe.ts         # Stripe configuration
│   ├── supabase.ts       # Database client
│   └── utils.ts          # Common utilities
└── middleware.ts         # Route protection
```

## 🔄 User Flow

### New User Journey
1. **Landing Page**: User discovers automation platform
2. **Sign Up**: Creates account with email/password
3. **Plan Selection**: Chooses subscription tier
4. **Payment**: Stripe checkout process
5. **Bot Access**: Gets Telegram bot credentials
6. **Automation**: Creates workflows through bot chat

### Returning User
1. **Login**: Authenticates through landing page
2. **Dashboard**: Views usage and bot access
3. **Bot Interaction**: Continues automation work
4. **Billing**: Manages subscription as needed

## 💰 Pricing Plans

| Plan | Price | Credits | Features |
|------|-------|---------|----------|
| **Starter** | $9/mo | 100 | Basic templates, Email support |
| **Professional** | $29/mo | 500 | All templates, Priority support, Webhooks |
| **Enterprise** | $99/mo | 2000 | Custom workflows, Dedicated support, API |

## 🎯 Key Pages

### 🏠 Landing Page (`/`)
- Hero section with value proposition
- Feature showcase and social proof
- Pricing table with CTAs
- Authentication modal

### 💳 Subscription Page (`/subscription`)
- Detailed plan comparison
- Stripe checkout integration
- FAQ and trust indicators

### 🤖 Bot Access Page (`/bot-access`)
- Telegram bot connection instructions
- Unique user access codes
- Getting started guide

### ✅ Payment Success (`/payment-success`)
- Payment confirmation
- Next steps instructions
- Auto-redirect to bot access

## 🧪 Testing

### Run Tests
```bash
# TypeScript compilation
npm run type-check

# Linting
npm run lint

# E2E tests (Playwright)
npm run test:e2e
```

### Test User Account
```
Email: testuser1@email.com
Password: Demo123
```

## 🚀 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Environment Variables for Production
- Update all test keys to live keys
- Set production URLs
- Configure webhook endpoints
- Enable Stripe live mode

## 🔌 Integrations

### Stripe Webhooks
Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhook`

Events to monitor:
- `checkout.session.completed`
- `customer.subscription.updated`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Telegram Bot Setup
1. Create bot with @BotFather
2. Get bot token
3. Configure webhook for n8n integration
4. Set up authentication flow

## 📊 Database Schema

### Key Tables
- **profiles**: User accounts, subscriptions, credits
- **usage_metrics**: Credit consumption tracking
- **workflow_executions**: Automation run history

See `CLAUDE.md` for complete schema details.

## 🛡️ Security

- **Row Level Security**: Database access control
- **JWT Authentication**: Secure session management
- **Environment Variables**: Sensitive data protection
- **Webhook Verification**: Stripe signature validation
- **Rate Limiting**: API protection (planned)

## 📈 Analytics & Monitoring

- **User Registration**: Track conversion rates
- **Payment Success**: Monitor checkout completion
- **Bot Engagement**: Track automation usage
- **Churn Analysis**: Monitor subscription cancellations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

## 📄 License

Private commercial project. All rights reserved.

## 🆘 Support

- **Documentation**: Check `CLAUDE.md` for detailed implementation
- **Issues**: Create GitHub issues for bugs
- **Questions**: Contact development team

---

## 🎉 Current Status

**✅ Production Ready for Lead Generation**
- Complete payment processing
- Telegram bot access provisioning  
- User management system
- Responsive design
- Security implementation

**🔄 Ready for Launch**: Platform can immediately start converting visitors to paying bot users.

---

*Built with ❤️ using Next.js, Supabase, and Stripe*