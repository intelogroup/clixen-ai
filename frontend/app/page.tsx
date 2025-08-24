"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"signin" | "signup">("signin");

  const handleSignIn = () => {
    setModalType("signin");
    setShowModal(true);
  };

  const handleSignUp = () => {
    setModalType("signup");
    setShowModal(true);
  };

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

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Lead Generation?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of businesses already using Clixen AI to grow their sales pipeline.
          </p>
          <Button size="lg" onClick={handleSignUp} className="px-8 py-3">
            Start Your Free Trial Today
          </Button>
        </div>
      </section>

      {/* Simple Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-center">
                {modalType === "signin" ? "Sign In" : "Sign Up"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-gray-600">
                <p>Authentication system is being set up.</p>
                <p className="text-sm mt-2">This will redirect to the auth flow.</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    // This will be replaced with actual auth logic
                    window.location.href = modalType === "signin" ? "/handler/sign-in" : "/handler/sign-up";
                  }}
                >
                  Continue
                </Button>
              </div>
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setModalType(modalType === "signin" ? "signup" : "signin")}
                >
                  {modalType === "signin" 
                    ? "Need an account? Sign up" 
                    : "Have an account? Sign in"
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
