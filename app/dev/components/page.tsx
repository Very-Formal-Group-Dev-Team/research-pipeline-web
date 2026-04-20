'use client';

import React, { useState } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import Button from '@/components/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Dropdown from '@/components/ui/Dropdown';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import Table from '@/components/ui/Table';
import Avatar, { AvatarGroup } from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import EmptyState from '@/components/layout/EmptyState';
import { FiSearch, FiMail, FiUser, FiSettings, FiLogOut, FiFolder, FiPlus } from 'react-icons/fi';

export default function ComponentShowcasePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const tableData = [
    { id: 1, name: 'Project Alpha', status: 'In Progress', date: '2026-01-15' },
    { id: 2, name: 'Project Beta', status: 'Completed', date: '2026-01-10' },
    { id: 3, name: 'Project Gamma', status: 'Draft', date: '2026-01-08' },
  ];

  const tableColumns = [
    { key: 'name', header: 'Project Name' },
    { key: 'status', header: 'Status', render: (item: any) => <Badge variant="primary">{item.status}</Badge> },
    { key: 'date', header: 'Date' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-primary-700">Component Showcase</h1>
          <p className="text-neutral-600 mt-2">Design system components for the Student Research Portal</p>
        </div>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Buttons</h2>
          <Card>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="success">Success</Button>
                <Button variant="error">Error</Button>
                <Button variant="warning">Warning</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" size="xl">Extra Large</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" leftIcon={<FiPlus />}>With Left Icon</Button>
                <Button variant="primary" rightIcon={<FiPlus />}>With Right Icon</Button>
                <Button variant="primary" loading>Loading</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Badges</h2>
          <Card>
            <div className="flex flex-wrap gap-3">
              <Badge variant="draft">Draft</Badge>
              <Badge variant="in-review">In Review</Badge>
              <Badge variant="approved">Approved</Badge>
              <Badge variant="rejected">Rejected</Badge>
              <Badge variant="in-progress" dot>In Progress</Badge>
              <Badge variant="completed">Completed</Badge>
              <Badge variant="pending">Pending</Badge>
            </div>
          </Card>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Form Inputs</h2>
          <Card>
            <div className="space-y-4 max-w-md">
              <Input label="Email" type="email" placeholder="Enter your email" required />
              <Input 
                label="Search" 
                placeholder="Search projects..." 
                leftIcon={<FiSearch />}
              />
              <Input 
                label="Password" 
                type="password" 
                error="Password must be at least 8 characters"
              />
              <Input 
                label="Disabled Input" 
                value="This is disabled"
                disabled
              />
              <Select
                label="Project Status"
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'in-review', label: 'In Review' },
                  { value: 'approved', label: 'Approved' },
                ]}
                placeholder="Select a status"
              />
            </div>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
                <CardDescription>This is a basic card component</CardDescription>
              </CardHeader>
              <p className="text-neutral-600">Card content goes here...</p>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle>Hoverable Card</CardTitle>
                <CardDescription>Hover over this card</CardDescription>
              </CardHeader>
              <p className="text-neutral-600">This card has hover effects</p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card with Footer</CardTitle>
                <CardDescription>Has a footer section</CardDescription>
              </CardHeader>
              <p className="text-neutral-600">Main content</p>
              <CardFooter>
                <Button variant="outline" size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Modal */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Modal</h2>
          <Card>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Open Modal
            </Button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Example Modal"
            >
              <p className="text-neutral-700">This is a modal dialog. It can contain any content.</p>
              <ModalFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                  Confirm
                </Button>
              </ModalFooter>
            </Modal>
          </Card>
        </section>

        {/* Dropdown */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Dropdown</h2>
          <Card>
            <Dropdown
              trigger={<Button variant="outline">Open Menu</Button>}
              items={[
                { label: 'Profile', value: 'profile', icon: <FiUser /> },
                { label: 'Settings', value: 'settings', icon: <FiSettings /> },
                { label: '', value: 'divider', divider: true },
                { label: 'Logout', value: 'logout', icon: <FiLogOut />, danger: true },
              ]}
            />
          </Card>
        </section>

        {/* Tabs */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Tabs</h2>
          <Card>
            <Tabs
              tabs={[
                { label: 'Overview', value: 'overview', icon: <FiFolder /> },
                { label: 'Messages', value: 'messages', icon: <FiMail />, badge: 5 },
                { label: 'Settings', value: 'settings', icon: <FiSettings /> },
              ]}
              defaultValue="overview"
            >
              <TabPanel value="overview">
                <p className="text-neutral-700">Overview content</p>
              </TabPanel>
              <TabPanel value="messages">
                <p className="text-neutral-700">Messages content</p>
              </TabPanel>
              <TabPanel value="settings">
                <p className="text-neutral-700">Settings content</p>
              </TabPanel>
            </Tabs>
          </Card>
        </section>

        {/* Table */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Table</h2>
          <Table
            data={tableData}
            columns={tableColumns}
            keyExtractor={(item) => item.id}
            striped
            hover
          />
        </section>

        {/* Avatars */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Avatars</h2>
          <Card>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar name="John Doe" size="xs" />
                <Avatar name="Jane Smith" size="sm" />
                <Avatar name="Bob Johnson" size="md" />
                <Avatar name="Alice Brown" size="lg" />
                <Avatar name="Charlie Wilson" size="xl" />
              </div>
              <div className="flex items-center gap-4">
                <Avatar name="Online User" status="online" />
                <Avatar name="Offline User" status="offline" />
                <Avatar name="Busy User" status="busy" />
                <Avatar name="Away User" status="away" />
              </div>
              <AvatarGroup max={4}>
                <Avatar name="User 1" />
                <Avatar name="User 2" />
                <Avatar name="User 3" />
                <Avatar name="User 4" />
                <Avatar name="User 5" />
                <Avatar name="User 6" />
              </AvatarGroup>
            </div>
          </Card>
        </section>

        {/* Tags */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Tags</h2>
          <Card>
            <div className="flex flex-wrap gap-3">
              <Tag>Default Tag</Tag>
              <Tag variant="primary">Primary</Tag>
              <Tag variant="success">Success</Tag>
              <Tag variant="error">Error</Tag>
              <Tag variant="warning">Warning</Tag>
              <Tag onRemove={() => console.log('Removed')}>Removable</Tag>
            </div>
          </Card>
        </section>

        {/* Toast */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Toast Notifications</h2>
          <Card>
            <div className="flex flex-wrap gap-3">
              <Button variant="success" onClick={() => addToast('Success message!', 'success')}>
                Show Success
              </Button>
              <Button variant="error" onClick={() => addToast('Error occurred!', 'error')}>
                Show Error
              </Button>
              <Button variant="warning" onClick={() => addToast('Warning message!', 'warning')}>
                Show Warning
              </Button>
              <Button variant="primary" onClick={() => addToast('Info message!', 'info')}>
                Show Info
              </Button>
            </div>
          </Card>
        </section>

        {/* Empty State */}
        <section>
          <h2 className="text-2xl font-bold text-primary-700 mb-4">Empty State</h2>
          <Card>
            <EmptyState
              icon={<FiFolder />}
              title="No projects found"
              description="Get started by creating your first project"
              action={{
                label: 'Create Project',
                onClick: () => console.log('Create project'),
              }}
            />
          </Card>
        </section>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
