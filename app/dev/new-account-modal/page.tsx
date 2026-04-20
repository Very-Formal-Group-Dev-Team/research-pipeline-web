'use client';

import React, { useState } from 'react';
import NewAccountConfigModal from '@/components/NewAccountConfigModal';
import Button from '@/components/Button';
import Card from '@/components/ui/Card';

export default function NewAccountModalDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState('demo-user-001');
  const [userEmail, setUserEmail] = useState('demo@university.edu');
  const [googleDisplayName, setGoogleDisplayName] = useState('Demo User');
  const [googlePhotoUrl, setGooglePhotoUrl] = useState('');

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const scenarios = [
    {
      title: 'First-Time User (No Google Data)',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'newuser@example.com',
      googleDisplayName: null,
      googlePhotoUrl: null
    },
    {
      title: 'Google Sign-In User',
      userId: '234e5678-e89b-12d3-a456-426614174001',
      email: 'googleuser@gmail.com',
      googleDisplayName: 'John Doe',
      googlePhotoUrl: 'https://lh3.googleusercontent.com/a/default-user'
    },
    {
      title: 'Current Authenticated User',
      userId: userId || 'auth-user-id',
      email: userEmail || 'auth@example.com',
      googleDisplayName: googleDisplayName || null,
      googlePhotoUrl: googlePhotoUrl || null
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">
            New Account Configuration Modal Demo
          </h1>
          <p className="text-neutral-600">
            Test the first-time user onboarding flow with different scenarios
          </p>
        </div>

        {/* Test Scenarios */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario, index) => (
            <Card key={index} className="p-6 space-y-4">
              <h3 className="font-semibold text-lg text-neutral-900">
                {scenario.title}
              </h3>
              
              <div className="space-y-2 text-sm text-neutral-600">
                <p><strong>User ID:</strong></p>
                <p className="text-xs font-mono bg-neutral-100 p-2 rounded break-all">
                  {scenario.userId}
                </p>
                
                <p><strong>Email:</strong></p>
                <p className="truncate">{scenario.email}</p>
                
                <p><strong>Google Name:</strong></p>
                <p>{scenario.googleDisplayName || 'None'}</p>
                
                <p><strong>Google Photo:</strong></p>
                <p className="truncate text-xs">
                  {scenario.googlePhotoUrl || 'None'}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => {
                  setUserId(scenario.userId);
                  setUserEmail(scenario.email);
                  setGoogleDisplayName(scenario.googleDisplayName || '');
                  setGooglePhotoUrl(scenario.googlePhotoUrl || '');
                  openModal();
                }}
              >
                Test This Scenario
              </Button>
            </Card>
          ))}
        </div>

        {/* Custom Test Form */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">
            Custom Test Configuration
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter user ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Google Display Name (Optional)
              </label>
              <input
                type="text"
                value={googleDisplayName}
                onChange={(e) => setGoogleDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Google Photo URL (Optional)
              </label>
              <input
                type="text"
                value={googlePhotoUrl}
                onChange={(e) => setGooglePhotoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://..."
              />
            </div>
          </div>

          <Button
            variant="primary"
            onClick={openModal}
            disabled={!userId || !userEmail}
          >
            Open Modal with Custom Data
          </Button>
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-warning-50 border-warning-200">
          <h3 className="font-semibold text-warning-900 mb-2">
            Testing Instructions
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-warning-800">
            <li>Select a test scenario or use custom configuration</li>
            <li>Fill in the required fields (Role and Display Name)</li>
            <li>Optionally upload an avatar image or use Google photo</li>
            <li>Click "Complete Setup" to trigger the profile completion flow</li>
            <li>Check browser console for API calls and responses</li>
            <li>Verify RLS policies are configured in Supabase before testing</li>
          </ul>
        </Card>
      </div>

      {/* Modal */}
      <NewAccountConfigModal
        isOpen={isModalOpen}
        onClose={closeModal}
        userId={userId}
        userEmail={userEmail}
        googleDisplayName={googleDisplayName || null}
        googlePhotoUrl={googlePhotoUrl || null}
      />
    </div>
  );
}
