# B2C Automation Platform - Tunnel Setup Documentation

## Current Active URLs
- **ngrok**: https://00de4d2ed633.ngrok-free.app
- **Status**: ✅ All systems operational

## Server Configuration
- **Local Server**: http://localhost:3000
- **Framework**: Next.js 14.0.4
- **Environment**: Development with .env.local

## Pages Status (All Tested ✅)
- `/` - Landing page (200 OK)
- `/dashboard` - Dashboard (200 OK)  
- `/profile` - Profile (200 OK)

## Console Logging Active
- 🏠 Home page load tracking
- 🌐 URL and User Agent logging
- 🔐 Authentication flow tracking
- ✅ Success logging
- ❌ Error logging

## Monitoring Commands
```bash
# Check server status
curl -I http://localhost:3000

# Test ngrok tunnel
curl -I https://00de4d2ed633.ngrok-free.app

# Monitor server logs
# Server is running in background bash_3

# Monitor ngrok logs  
# Ngrok is running in background bash_2
```

## Restart Commands
```bash
# Restart Next.js server
cd /root/repo/landing-page && npm run dev

# Restart ngrok tunnel (with your auth)
ngrok http 3000 --log=stdout
```

## Credentials Configured
- **ngrok authtoken**: ✅ Configured in ~/.config/ngrok/ngrok.yml
- **ngrok API key**: Available for advanced features
- **Test User**: testuser1@email.com / Demo123

## Performance Notes
- Server restart fixed memory leak (was 56% memory usage)
- All pages compile in <1s
- Favicon issues resolved
- Console loggers added for debugging

## Last Updated
August 22, 2025 - 21:13 UTC