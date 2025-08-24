'use client';

/**
 * Telegram Linking Card Component
 * Handles secure Telegram account linking flow in the dashboard
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, CheckCircle, AlertCircle, Unlink } from 'lucide-react';

interface TelegramInfo {
  username?: string;
  firstName: string;
  linkedAt: string;
}

interface LinkingStatus {
  linked: boolean;
  telegramInfo?: TelegramInfo;
}

export function TelegramLinkingCard() {
  const [status, setStatus] = useState<LinkingStatus | null>(null);
  const [linkingToken, setLinkingToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Check initial linking status
  useEffect(() => {
    checkLinkingStatus();
  }, []);

  const checkLinkingStatus = async () => {
    try {
      const response = await fetch('/api/telegram/link');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        setError('Failed to check Telegram linking status');
      }
    } catch (err) {
      setError('Network error checking status');
    }
  };

  const generateLinkingToken = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/telegram/link', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setLinkingToken(data.linkingToken);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate linking token');
      }
    } catch (err) {
      setError('Network error generating token');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const unlinkAccount = async () => {
    if (!confirm('Are you sure you want to unlink your Telegram account?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/telegram/link', {
        method: 'DELETE',
      });

      if (response.ok) {
        setStatus({ linked: false });
        setLinkingToken(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to unlink account');
      }
    } catch (err) {
      setError('Network error unlinking account');
    } finally {
      setLoading(false);
    }
  };

  const openTelegram = () => {
    window.open('https://t.me/clixen_bot', '_blank');
  };

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse" />
            Telegram Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading Telegram status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            Telegram Integration
          </div>
          {status.linked && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Linked
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {status.linked && status.telegramInfo ? (
          // Linked State
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">
                  Account Successfully Linked
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-green-700">
                <p>
                  <strong>Name:</strong> {status.telegramInfo.firstName}
                  {status.telegramInfo.username && (
                    <span className="text-green-600"> (@{status.telegramInfo.username})</span>
                  )}
                </p>
                <p>
                  <strong>Linked:</strong> {new Date(status.telegramInfo.linkedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Ready to Use!</h4>
              <p className="text-sm text-gray-600">
                Your Telegram account is connected. You can now interact with our AI assistant
                directly through Telegram messages.
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={openTelegram}
                  className="flex-1"
                  variant="default"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Telegram Bot
                </Button>
                
                <Button
                  onClick={unlinkAccount}
                  variant="outline"
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Unlink
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Not Linked State
          <div className="space-y-4">
            {!linkingToken ? (
              <div>
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Connect Your Telegram Account
                  </h4>
                  <p className="text-sm text-gray-600">
                    Link your Telegram account to start using our AI assistant. 
                    You'll be able to send commands and receive responses directly in Telegram.
                  </p>
                </div>

                <Button
                  onClick={generateLinkingToken}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Generating...' : 'Generate Linking Code'}
                </Button>
              </div>
            ) : (
              // Show linking instructions
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Follow these steps to link your account:
                  </h4>
                  
                  <ol className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                      <span>Open Telegram and search for <strong>@clixen_bot</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                      <span>Send the command <code className="bg-blue-100 px-1 rounded">/start</code> or <code className="bg-blue-100 px-1 rounded">/link</code></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                      <span>Copy and paste the linking code below</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                      <span>Your account will be linked automatically!</span>
                    </li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Linking Code (expires in 10 minutes):
                  </label>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-gray-50 border rounded-lg font-mono text-sm text-gray-800 break-all">
                      {linkingToken}
                    </div>
                    
                    <Button
                      onClick={() => copyToClipboard(linkingToken)}
                      variant="outline"
                      size="sm"
                      className={copySuccess ? 'bg-green-50 border-green-200' : ''}
                    >
                      <Copy className="w-4 h-4" />
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={openTelegram}
                    className="flex-1"
                    variant="default"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Telegram Bot
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setLinkingToken(null);
                      checkLinkingStatus();
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Having trouble? Make sure you're signed in to Telegram and try refreshing this page.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}