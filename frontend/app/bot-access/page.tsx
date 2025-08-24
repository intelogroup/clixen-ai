"use client";

import { useUser, UserButton } from "@stackframe/stack";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BotAccessPage() {
  const user = useUser({ or: "redirect" });

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleTelegramLink = () => {
    // This would typically generate a unique link for the user
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "clixen_bot";
    const startParam = `user_${user.id}`;
    const telegramUrl = `https://t.me/${botUsername}?start=${startParam}`;
    window.open(telegramUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Clixen AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.location.href = "/dashboard"}>
                Dashboard
              </Button>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bot Access</h1>
          <p className="text-gray-600 mt-2">Connect with the Clixen AI Telegram bot</p>
        </div>

        {/* Bot Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Telegram Bot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Clixen AI Bot</h3>
                  <p className="text-gray-600">Get instant access to lead generation tools via Telegram</p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-3">Bot Features</h4>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Generate leads on-demand
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Real-time campaign updates
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Quick analytics and reports
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Direct message automation
                  </li>
                </ul>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-3">Getting Started</h4>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li>1. Click the "Connect to Bot" button below</li>
                  <li>2. You'll be redirected to Telegram</li>
                  <li>3. Start a conversation with the bot</li>
                  <li>4. Begin using AI-powered lead generation tools</li>
                </ol>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleTelegramLink}
                  className="px-8"
                >
                  Connect to Bot
                </Button>
                <Button variant="outline">
                  View Instructions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Your Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Account Status</h4>
                  <p className="text-sm text-gray-600">Your account is ready for bot integration</p>
                </div>
                <Badge variant="default">Ready</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">User ID</h4>
                  <p className="text-sm text-gray-600 font-mono">{user.id}</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Bot Access Level</h4>
                  <p className="text-sm text-gray-600">Full access to all features</p>
                </div>
                <Badge variant="default">Premium</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
