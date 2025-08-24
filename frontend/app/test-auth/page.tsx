"use client";

import { useUser, UserButton, SignIn, SignUp } from "@stackframe/stack";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserData, getAllUsers } from "@/app/actions";

export default function TestAuthPage() {
  const user = useUser();
  const [userData, setUserData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          const [userResult, usersResult] = await Promise.all([
            getUserData(),
            getAllUsers()
          ]);
          setUserData(userResult);
          setAllUsers(usersResult);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
      setLoading(false);
    }

    loadData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Authentication Test Page
        </h1>

        {/* Authentication Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant={user ? "default" : "secondary"}>
                  {user ? "✅ Authenticated" : "❌ Not Authenticated"}
                </Badge>
                {user && <UserButton />}
              </div>
              
              {user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>User ID:</strong>
                    <p className="font-mono text-xs">{user.id}</p>
                  </div>
                  <div>
                    <strong>Display Name:</strong>
                    <p>{user.displayName || "Not set"}</p>
                  </div>
                  <div>
                    <strong>Email:</strong>
                    <p>{user.primaryEmail}</p>
                  </div>
                  <div>
                    <strong>Email Verified:</strong>
                    <Badge variant={user.primaryEmailVerified ? "default" : "secondary"}>
                      {user.primaryEmailVerified ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Authentication Forms */}
        {!user && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
              </CardHeader>
              <CardContent>
                <SignIn />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
              </CardHeader>
              <CardContent>
                <SignUp />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Database Integration Test */}
        {user && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Database Integration Test</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading database data...</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Your Database Record:</h4>
                    {userData ? (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div><strong>DB ID:</strong> {userData.id}</div>
                          <div><strong>Name:</strong> {userData.name || "Not set"}</div>
                          <div><strong>Email:</strong> {userData.email}</div>
                          <div><strong>Created:</strong> {new Date(userData.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-red-600">❌ No database record found</p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">All Users in Database ({allUsers.length}):</h4>
                    <div className="space-y-2">
                      {allUsers.map((dbUser) => (
                        <div key={dbUser.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{dbUser.name || "No name"}</p>
                              <p className="text-sm text-gray-600">{dbUser.email}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={dbUser.id === user.id ? "default" : "outline"}>
                                {dbUser.id === user.id ? "You" : "Other User"}
                              </Badge>
                              <p className="text-xs text-gray-500">
                                {new Date(dbUser.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user && (
                <div className="flex space-x-4">
                  <Button onClick={() => user.signOut()}>
                    Sign Out
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = "/profile"}>
                    Go to Profile
                  </Button>
                </div>
              )}
              
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => window.location.href = "/"}>
                  Back to Landing
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
