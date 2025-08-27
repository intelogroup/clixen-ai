import { neonAuth } from "@/lib/neon-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log('Signout API called');
  
  try {
    // Get the current user
    const user = await neonAuth.getUser();
    
    if (user) {
      console.log(`Signing out user: ${user.primaryEmail}`);
      
      // Sign out the user using NeonAuth
      await neonAuth.signOut();
      console.log('User signed out successfully');
      
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    } else {
      console.log('No user to sign out');
      return NextResponse.json({ success: true, message: 'No user was logged in' });
    }
    
  } catch (error) {
    console.error('Error during signout:', error);
    
    // Even if there's an error, return success to allow client-side redirect
    return NextResponse.json({ success: true, message: 'Logout completed' });
  }
}

// Also handle GET requests for direct URL access - these should redirect
export async function GET() {
  try {
    const user = await neonAuth.getUser();
    if (user) {
      await neonAuth.signOut();
    }
  } catch (error) {
    console.error('GET signout error:', error);
  }
  
  // For GET requests, we can redirect since it's not a fetch call
  return NextResponse.redirect('/auth/signin');
}