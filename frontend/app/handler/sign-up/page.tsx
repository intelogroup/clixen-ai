"use client";

import { SignUp } from "@stackframe/stack";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Get Started</h1>
          <p className="text-gray-600 mt-2">Create your Clixen AI account</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <SignUp />
        </div>
        
        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = "/"}
            className="text-blue-600"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
