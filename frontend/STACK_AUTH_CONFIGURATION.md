# Stack Auth Dashboard Configuration Guide

## Current Project Details
- **Project ID**: `9a382a23-2903-4653-b4e5-ee032cec183b`
- **Dashboard URL**: https://app.stack-auth.com/projects/9a382a23-2903-4653-b4e5-ee032cec183b

## Required Configuration Steps

### 1. Enable Email/Password Authentication
1. Go to Stack Auth Dashboard → Auth Methods
2. Toggle ON "Email/Password" authentication
3. Configure email verification settings:
   - Enable email verification (recommended)
   - Set up custom SMTP (optional for development)

### 2. Add Google OAuth Integration
1. In Stack Auth Dashboard → Auth Methods → OAuth Providers
2. Add Google OAuth provider:
   - **Client ID**: `[YOUR_GOOGLE_CLIENT_ID_FROM_ENV]`
   - **Client Secret**: `[YOUR_GOOGLE_CLIENT_SECRET_FROM_ENV]`
   - **Redirect URI**: `https://api.stack-auth.com/api/v1/auth/oauth/callback/google`
   - **Scopes**: `openid email profile`

### 3. Configure Account Linking Strategy
1. Go to Stack Auth Dashboard → Settings → Account Linking
2. Select strategy for users with same email:
   - **Recommended**: "Link" - automatically link accounts with same verified email
   - Alternative: "Allow" - create separate accounts
   - Alternative: "Block" - prevent OAuth signin with existing email

### 4. Update Callback URLs
Ensure these callback URLs are configured:
- **Development**: `http://localhost:3000/api/auth/callback`
- **Production**: `https://clixen.app/api/auth/callback`

### 5. Production Settings (when ready)
1. Enable production mode in Project Settings
2. Configure custom domain for auth (optional)
3. Set up custom SMTP for email delivery
4. Replace shared OAuth keys with production keys

## Expected UI Changes After Configuration

Once configured, the Stack Auth `<SignIn />` component will automatically display:
1. **Email/Password Form**: Email input, password input, "Sign In" button
2. **Google OAuth Button**: "Sign in with Google"
3. **GitHub OAuth Button**: "Sign in with GitHub" (existing)
4. **Proper Error Handling**: Wrong password errors will show in the email/password form

## Verification Steps

After configuration, test these scenarios:
1. ✅ Email/password signup and signin
2. ✅ Wrong password error display
3. ✅ Google OAuth signin flow
4. ✅ GitHub OAuth signin flow (existing)
5. ✅ Account linking for users with same email across methods

## Next Steps

1. **Configure Stack Auth Dashboard** using the steps above
2. **Restart Next.js development server** to pick up new authentication methods
3. **Run authentication tests** to verify all methods work
4. **Test wrong password scenarios** (your original requirement)

## Notes

- Stack Auth automatically handles the UI for all configured authentication methods
- The `<SignIn />` component will show email/password forms once enabled in dashboard
- Google OAuth credentials are already added to `.env.local`
- Existing GitHub OAuth will continue to work alongside new methods