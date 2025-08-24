"use client";

import { useUser, UserButton } from "@stackframe/stack";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserData, getAllUsers } from "@/app/actions";

export default function Dashboard() {
  const user = useUser({ or: "redirect" });
  const [userData, setUserData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [userResult, usersResult] = await Promise.all([
          getUserData(),
          getAllUsers()
        ]);
        setUserData(userResult);
        setAllUsers(usersResult);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }

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
              <span className="text-sm text-gray-700">
                Welcome, {user.displayName || user.primaryEmail}
              </span>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your Clixen AI workspace</p>
        </div>

        {/* User Info Card */}
        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{user.displayName || "No display name"}</p>
                      <p className="text-sm text-gray-600">{user.primaryEmail}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={user.primaryEmailVerified ? "default" : "secondary"}>
                          {user.primaryEmailVerified ? "Verified" : "Unverified"}
                        </Badge>
                        <Badge variant="outline">
                          Signed up: {new Date(user.signedUpAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {userData && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Database Record</h4>
                      <p className="text-sm text-gray-600">ID: {userData.id}</p>
                      <p className="text-sm text-gray-600">Created: {new Date(userData.created_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({allUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading users...</div>
            ) : (
              <div className="space-y-3">
                {allUsers.map((dbUser) => (
                  <div key={dbUser.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{dbUser.name || "No name"}</p>
                      <p className="text-sm text-gray-600">{dbUser.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(dbUser.created_at).toLocaleDateString()}
                      </p>
                      <Badge variant={dbUser.id === user.id ? "default" : "outline"}>
                        {dbUser.id === user.id ? "You" : "User"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Lead Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Start generating qualified leads with AI-powered targeting.</p>
              <Button className="w-full">Start Campaign</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View detailed insights and performance metrics.</p>
              <Button variant="outline" className="w-full">View Analytics</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Configure your account and automation preferences.</p>
              <Button variant="outline" className="w-full">Open Settings</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
