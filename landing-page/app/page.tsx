'use client'

import { useState, useEffect } from 'react'
import Hero from '../components/Hero'
import AuthModal from '../components/AuthModal'

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')

  useEffect(() => {
    console.log('🏠 Home page loaded successfully')
    console.log('🌐 Current URL:', window.location.href)
    console.log('📱 User Agent:', navigator.userAgent)
  }, [])

  const handleGetStarted = () => {
    setAuthMode('signup')
    setShowAuthModal(true)
  }

  const handleSignIn = () => {
    setAuthMode('signin')
    setShowAuthModal(true)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Hero 
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
      />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </main>
  )
}