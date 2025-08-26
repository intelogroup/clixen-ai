# NeonAuth Next.js Quick Start Guide

Source: https://neon.com/docs/neon-auth/quick-start/nextjs

## Setup Steps

### 1. Create Neon Project
- Go to [pg.new](https://pg.new) to create a new Neon project
- Navigate to the project's "Auth" page
- Click "Enable Neon Auth"

### 2. Environment Variables
Get these from your Neon Auth dashboard:
```env
NEXT_PUBLIC_STACK_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=YOUR_PUBLISHABLE_KEY
STACK_SECRET_SERVER_KEY=YOUR_SECRET_KEY
DATABASE_URL=YOUR_CONNECTION_STRING
```

### 3. Quick Integration

#### Option 1: Setup Wizard (Recommended)
```bash
npx @stackframe/init-stack@latest --no-browser
```

#### Option 2: Manual Setup
1. Install dependencies:
```bash
npm install @stackframe/stack
```

2. Add environment variables to `.env.local`

3. Configure the Stack client

### 4. Start Development
```bash
npm run dev
```

## Key Features

- **Automatic Sync**: User data automatically syncs to Postgres
- **OAuth Support**: Built-in OAuth providers  
- **Credential Auth**: Email/password authentication
- **React Components**: Pre-built auth UI components
- **Next.js Integration**: Optimized for App Router and Pages Router

## Testing Integration

1. **Create Users**: Visit `http://localhost:3000/handler/sign-up`
2. **Verify Database**: Check users in `neon_auth.users_sync` table:
   ```sql
   SELECT * FROM neon_auth.users_sync;
   ```

## Database Schema

NeonAuth automatically creates:
- `neon_auth.users_sync` table for user data
- Automatic syncing between Stack Auth and Neon database
- Built-in user management queries

## Next Steps

- Review "How Neon Auth works" documentation
- Explore SDK and component options  
- Check best practices guide
- Configure authentication providers
- Set up authorization rules

## Notes

- This is a **beta feature** actively being improved
- Built on the Stack framework
- Provides seamless Postgres integration
- No additional database setup required