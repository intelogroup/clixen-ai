"use client";

import { useUser, UserButton } from "@stackframe/stack";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserData } from "@/app/actions";

export default function ProfilePage() {
  const user = useUser({ or: "redirect" });
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        const result = await getUserData();
        setUserData(result);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadUserData();
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
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Profile Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading profile...</div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  {user.profileImageUrl && (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-medium">
                      {user.displayName || "No display name set"}
                    </h3>
                    <p className="text-gray-600">{user.primaryEmail}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Status
                    </label>
                    <Badge variant={user.primaryEmailVerified ? "default" : "secondary"}>
                      {user.primaryEmailVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Created
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(user.signedUpAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password Status
                    </label>
                    <Badge variant={user.hasPassword ? "default" : "secondary"}>
                      {user.hasPassword ? "Set" : "Not Set"}
                    </Badge>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID
                    </label>
                    <p className="text-sm text-gray-900 font-mono">
                      {user.id}
                    </p>
                  </div>
                </div>

                {userData && (
                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Database Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Database ID:</span>
                          <p className="font-mono">{userData.id}</p>
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>
                          <p>{new Date(userData.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Updated:</span>
                          <p>{new Date(userData.updated_at).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Update Profile</h4>
                  <p className="text-sm text-gray-600">Change your display name and profile picture</p>
                </div>
                <Button variant="outline">Edit Profile</Button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Change Password</h4>
                  <p className="text-sm text-gray-600">Update your account password</p>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Sign Out</h4>
                  <p className="text-sm text-gray-600">Sign out of your account</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => user.signOut()}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
