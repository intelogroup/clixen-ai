'use client';

import { useState, useTransition } from 'react';
import { createTeam, generateApiKey, listApiKeys, revokeApiKey, getTeamData } from '@/app/actions';
import type { Team, TeamRole } from '@prisma/client';

interface TeamManagementProps {
  initialTeamData?: { 
    team: Team | null; 
    members: { id: string; email: string; displayName: string; role: TeamRole; lastActivityAt: Date; createdAt: Date; }[] 
  };
  initialApiKeys?: {
    id: string;
    keyPrefix: string;
    name: string;
    scopes: string[];
    lastUsedAt: Date | null;
    usageCount: number;
    expiresAt: Date | null;
    createdAt: Date;
  }[];
}

export function TeamManagement({ initialTeamData, initialApiKeys }: TeamManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [teamData, setTeamData] = useState(initialTeamData);
  const [apiKeys, setApiKeys] = useState(initialApiKeys || []);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const handleCreateTeam = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;

    startTransition(async () => {
      try {
        await createTeam(name, slug);
        // Refresh team data
        const updatedTeamData = await getTeamData();
        setTeamData(updatedTeamData);
        setShowCreateTeam(false);
      } catch (error) {
        console.error('Error creating team:', error);
        alert('Failed to create team: ' + (error as Error).message);
      }
    });
  };

  const handleCreateApiKey = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const scopes = (formData.get('scopes') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [];

    startTransition(async () => {
      try {
        const { key, keyData } = await generateApiKey(name, scopes);
        setNewApiKey(key);
        // Refresh API keys
        const updatedKeys = await listApiKeys();
        setApiKeys(updatedKeys);
        setShowCreateApiKey(false);
      } catch (error) {
        console.error('Error creating API key:', error);
        alert('Failed to create API key: ' + (error as Error).message);
      }
    });
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    startTransition(async () => {
      try {
        await revokeApiKey(keyId);
        // Refresh API keys
        const updatedKeys = await listApiKeys();
        setApiKeys(updatedKeys);
      } catch (error) {
        console.error('Error revoking API key:', error);
        alert('Failed to revoke API key: ' + (error as Error).message);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* New API Key Display */}
      {newApiKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-800 mb-2">API Key Created!</h3>
          <p className="text-sm text-green-700 mb-3">
            Save this key somewhere safe - you won't be able to see it again.
          </p>
          <div className="bg-white border rounded p-3 font-mono text-sm break-all">
            {newApiKey}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(newApiKey);
              alert('API key copied to clipboard!');
            }}
            className="mt-2 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
          >
            Copy to Clipboard
          </button>
          <button
            onClick={() => setNewApiKey(null)}
            className="mt-2 ml-2 text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Team Management Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
          {!teamData?.team && (
            <button
              onClick={() => setShowCreateTeam(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              disabled={isPending}
            >
              Create Team
            </button>
          )}
        </div>

        {teamData?.team ? (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">{teamData.team.name}</h3>
              <p className="text-sm text-gray-500">Team ID: {teamData.team.slug}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {teamData.team.teamTier.replace('TEAM_', '')}
                </span>
                <span>
                  Usage: {teamData.team.teamQuotaUsed}/{teamData.team.teamQuotaLimit === -1 ? '∞' : teamData.team.teamQuotaLimit}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Team Members ({teamData.members.length})</h4>
              <div className="space-y-2">
                {teamData.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div>
                      <div className="font-medium">{member.displayName || member.email}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                    <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Yet</h3>
            <p className="text-gray-500 mb-4">
              Create a team to collaborate with others and share automation quotas.
            </p>
          </div>
        )}

        {/* Create Team Form */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
              <form action={handleCreateTeam}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="My Awesome Team"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Slug (URL-friendly)
                  </label>
                  <input
                    type="text"
                    name="slug"
                    required
                    pattern="[a-z0-9-]+"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="my-awesome-team"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateTeam(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {isPending ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* API Keys Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
          <button
            onClick={() => setShowCreateApiKey(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            disabled={isPending}
          >
            Generate API Key
          </button>
        </div>

        {apiKeys.length > 0 ? (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{apiKey.name}</h3>
                    <p className="text-sm text-gray-500">clx_{apiKey.keyPrefix}...</p>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                      {apiKey.lastUsedAt && (
                        <span>Last used: {new Date(apiKey.lastUsedAt).toLocaleDateString()}</span>
                      )}
                      <span>Uses: {apiKey.usageCount}</span>
                    </div>
                    {apiKey.scopes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {apiKey.scopes.map((scope) => (
                          <span key={scope} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {scope}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRevokeApiKey(apiKey.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    disabled={isPending}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
            <p className="text-gray-500">
              Generate API keys to access Clixen AI programmatically from your applications.
            </p>
          </div>
        )}

        {/* Create API Key Form */}
        {showCreateApiKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Generate API Key</h3>
              <form action={handleCreateApiKey}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="My API Key"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scopes (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="scopes"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="weather,translate,email-scan"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Limit what this key can access
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateApiKey(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {isPending ? 'Generating...' : 'Generate Key'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}