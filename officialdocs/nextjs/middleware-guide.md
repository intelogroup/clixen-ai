# Next.js Middleware Guide

Source: https://nextjs.org/docs/app/building-your-application/routing/middleware

## Overview

Next.js middleware allows you to run code before a request is completed, enabling custom server-side logic like authentication, logging, and redirects.

## Key Concepts

- **Location**: `middleware.js` or `middleware.ts` at project root
- **Execution**: Runs before routes are rendered
- **Use Cases**: Authentication, logging, redirects, header modification

## Basic Setup

### Simple Middleware Example
```typescript
import { NextResponse, NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}

export const config = {
  matcher: '/about/:path*'
}
```

## Configuration Options

### Matcher Configuration
```typescript
export const config = {
  matcher: [
    // Match specific paths
    '/dashboard/:path*',
    
    // Exclude paths using negative lookahead
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    
    // Multiple matchers
    ['/dashboard/:path*', '/profile/:path*']
  ]
}
```

### Complex Path Matching
- **Single Path**: `'/dashboard'`
- **Wildcard**: `'/dashboard/:path*'`
- **Regex**: Complex patterns with regular expressions
- **Exclusions**: Use negative lookahead for excluding paths

## Middleware Capabilities

### Request/Response Manipulation
- **Headers**: Modify request/response headers
- **Cookies**: Set, read, and delete cookies
- **Redirects**: Perform server-side redirects
- **Rewrites**: Internal URL rewrites
- **Direct Response**: Return response without hitting route

### Common Patterns

#### Authentication Check
```typescript
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
```

#### Header Modification
```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  response.headers.set('X-Custom-Header', 'value')
  response.headers.set('X-Pathname', request.nextUrl.pathname)
  
  return response
}
```

## Runtime Support

### Edge Runtime (Default)
- **Performance**: Fast startup, minimal latency
- **Limitations**: Subset of Node.js APIs
- **Ideal For**: Authentication, redirects, headers

### Node.js Runtime (v15.5+)
```typescript
export const config = {
  runtime: 'nodejs'
}
```

## Best Practices

### Performance Optimization
- **Precise Matching**: Use specific matchers to avoid unnecessary execution
- **Conditional Logic**: Handle different scenarios efficiently
- **Minimal Processing**: Keep middleware logic lightweight

### Security Considerations
- **Authentication**: Verify user credentials before route access
- **CSRF Protection**: Implement cross-site request forgery protection
- **Rate Limiting**: Control request frequency

### Error Handling
```typescript
export function middleware(request: NextRequest) {
  try {
    // Middleware logic
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/error', request.url))
  }
}
```

## Common Use Cases

1. **Authentication**: Protect routes and redirect unauthenticated users
2. **Logging**: Track requests and user behavior  
3. **A/B Testing**: Route users to different experiences
4. **Internationalization**: Handle locale-based routing
5. **Bot Detection**: Filter out unwanted traffic
6. **Feature Flags**: Enable/disable features dynamically

## API Reference

### NextRequest
- `nextUrl`: Parsed URL object
- `cookies`: Cookie management methods
- `headers`: Request headers
- `ip`: Client IP address

### NextResponse
- `redirect()`: Server-side redirects
- `rewrite()`: Internal URL rewrites  
- `next()`: Continue to next middleware/route
- `json()`: Return JSON response

## Migration Notes

- **App Router**: Full middleware support
- **Pages Router**: Compatible with App Router patterns
- **Edge Runtime**: Default, optimized for performance
- **Node.js Runtime**: Available for complex operations