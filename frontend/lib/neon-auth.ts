import { StackServerApp } from "@stackframe/stack";

// Neon Auth configuration using Stack framework
export const neonAuth = new StackServerApp({
  tokenStore: "nextjs-cookie", // Secure cookie-based tokens
  urls: {
    signIn: "/auth/signin",
    signUp: "/auth/signup", 
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    home: "/",
  }
});

// Export for backwards compatibility and clarity
export const stackServerApp = neonAuth;