'use client';

import React, { useCallback, useEffect, useState } from 'react';

import Button from '@/components/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { listAdminAuditLog, type AdminAuditEntry } from '@/lib/api/admin';

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'user.login', label: 'User login' },
  { value: 'user.role_assigned', label: 'Role assigned' },
  { value: 'user.role_changed', label: 'Role changed' },
  { value: 'user.activated', label: 'User activated' },
  { value: 'user.deactivated', label: 'User deactivated' },
  { value: 'institution.created', label: 'Institution created' },
  { value: 'institution.updated', label: 'Institution updated' },
  { value: 'project.stage_changed', label: 'Project stage changed' },
  { value: 'paper_version.uploaded', label: 'Paper version uploaded' },
  { value: 'evaluation.submitted', label: 'Evaluation submitted' },
];

function formatActionLabel(action: string): string {
  const match = ACTION_OPTIONS.find((option) => option.value === action);
  if (match) return match.label;
  return action.replace(/\./g, ' · ').replace(/_/g, ' ');
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function describeEntry(entry: AdminAuditEntry): string {
  const meta = entry.metadata || {};
  switch (entry.action) {
    case 'user.login':
      return `Signed in via ${String(meta.method || 'unknown')}`;
    case 'user.role_changed':
    case 'user.role_assigned':
      return meta.newRole
        ? `Role set to ${String(meta.newRole)}`
        : 'Role updated';
    case 'user.activated':
      return 'Account reactivated';
    case 'user.deactivated':
      return 'Account deactivated';
    case 'institution.created':
      return `Created ${String(meta.name || 'institution')}`;
    case 'institution.updated':
      return `Updated ${String(meta.name || 'institution')}`;
    case 'project.stage_changed':
      return `${String(meta.previousStage || '?')} → ${String(meta.newStage || '?')}`;
    case 'paper_version.uploaded':
      return `Version ${String(meta.versionNumber || '?')}: ${String(meta.fileName || 'document')}`;
    case 'evaluation.submitted':
      return `Panel evaluation for defense`;
    default:
      if (entry.project_title) return entry.project_title;
      if (entry.target_type && entry.target_id) {
        return `${entry.target_type} ${entry.target_id.slice(0, 8)}…`;
      }
      return '—';
  }
}

export default function AdminAuditPage() {
  const { user, handleLogout } = useDashboardUser('Admin');
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const res = await listAdminAuditLog({
      action: actionFilter || undefined,
      page,
      limit: 50,
    });
    if (res.data) {
      setEntries(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    }
    setLoading(false);
  }, [actionFilter, page]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  return (
    <DashboardLayout role="admin" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Audit Log</h1>
          <p className="mt-1 text-neutral-600">
            Platform activity including logins, role changes, institution updates, and project events
          </p>
        </div>

        <Card>
          <div className="max-w-sm">
            <Select
              label="Action type"
              value={actionFilter}
              onChange={(e) => {
                setPage(1);
                setActionFilter(e.target.value);
              }}
              options={ACTION_OPTIONS}
              fullWidth
            />
          </div>
        </Card>

        {loading ? (
          <Card>
            <div className="py-8 text-center text-neutral-500">Loading audit log…</div>
          </Card>
        ) : entries.length === 0 ? (
          <Card>
            <div className="py-8 text-center text-neutral-500">No audit entries yet.</div>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-100 text-sm">
                <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 sm:px-6">When</th>
                    <th className="px-4 py-3 sm:px-6">Action</th>
                    <th className="px-4 py-3 sm:px-6">Actor</th>
                    <th className="px-4 py-3 sm:px-6">Details</th>
                    <th className="px-4 py-3 sm:px-6">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {entries.map((entry) => (
                    <tr key={`${entry.source}-${entry.id}`} className="text-neutral-700">
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        {formatTimestamp(entry.created_at)}
                      </td>
                      <td className="px-4 py-3 sm:px-6">{formatActionLabel(entry.action)}</td>
                      <td className="px-4 py-3 sm:px-6">
                        <div>
                          <p className="font-medium text-neutral-800">
                            {entry.actor_name || 'System'}
                          </p>
                          {entry.actor_email ? (
                            <p className="text-xs text-neutral-500">{entry.actor_email}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <p>{describeEntry(entry)}</p>
                        {entry.institution_name ? (
                          <p className="text-xs text-neutral-500">{entry.institution_name}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 sm:px-6 capitalize">{entry.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-neutral-600">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
