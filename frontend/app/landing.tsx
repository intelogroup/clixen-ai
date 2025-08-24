"use client";

import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const user = useUser();

  const handleSignIn = () => {
    setAuthMode("signin");
    setShowAuth(true);
  };

  const handleSignUp = () => {
    setAuthMode("signup");
    setShowAuth(true);
  };

  // If user is logged in, redirect to dashboard
  if (user) {
    window.location.href = "/dashboard";
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Clixen AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button onClick={handleSignUp}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Lead Generation
            <span className="text-blue-600 block">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your business with intelligent automation. Generate qualified leads, 
            engage prospects, and scale your sales pipeline with advanced AI technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleSignUp} className="px-8 py-3">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={handleSignIn}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful Features for Modern Businesses
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-blue-600 text-xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Targeting</h3>
              <p className="text-gray-600">AI-powered prospect identification and segmentation for maximum conversion rates.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-green-600 text-xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Automated Outreach</h3>
              <p className="text-gray-600">Scale your outreach with personalized messaging and intelligent follow-ups.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
              <p className="text-gray-600">Track performance and optimize campaigns with detailed analytics and reporting.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ✅ Full Auth System Ready
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Stack Auth + Neon Database integration is now fully operational!
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-semibold mb-2">🔐 Auth Features:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• User registration & login</li>
                <li>• Protected routes</li>
                <li>• Session management</li>
                <li>• Database user sync</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-semibold mb-2">🚀 Ready for:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• User onboarding</li>
                <li>• Dashboard access</li>
                <li>• Profile management</li>
                <li>• Bot integration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        defaultMode={authMode}
      />
    </div>
  );
}
