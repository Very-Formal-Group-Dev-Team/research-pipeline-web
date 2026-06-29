'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FiClipboard } from 'react-icons/fi';

import AdminAuditListToolbar, {
  AUDIT_ACTION_OPTIONS,
  DEFAULT_ADMIN_AUDIT_FILTERS,
  isAdminAuditFiltersDirty,
  type AdminAuditFilterState,
} from '@/components/admin/AdminAuditListToolbar';
import Button from '@/components/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/layout/EmptyState';
import AdminAuditListSkeleton from '@/components/skeletons/AdminAuditListSkeleton';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { listAdminAuditLog, type AdminAuditEntry } from '@/lib/api/admin';

function formatActionLabel(action: string): string {
  const match = AUDIT_ACTION_OPTIONS.find((option) => option.value === action);
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

function sourceBadgeVariant(source: AdminAuditEntry['source']): 'primary' | 'default' {
  return source === 'project' ? 'primary' : 'default';
}

export default function AdminAuditPage() {
  const { user, handleLogout } = useDashboardUser('Admin');
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [listFilters, setListFilters] = useState<AdminAuditFilterState>(DEFAULT_ADMIN_AUDIT_FILTERS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const filtersActive = isAdminAuditFiltersDirty(listFilters);

  const handleFiltersChange = (next: AdminAuditFilterState) => {
    setPage(1);
    setListFilters(next);
  };

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const res = await listAdminAuditLog({
      action: listFilters.action || undefined,
      page,
      limit: 50,
    });
    if (res.data) {
      setEntries(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    }
    setLoading(false);
  }, [listFilters, page]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  return (
    <DashboardLayout role="admin" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Audit Log</h1>
            <p className="mt-1 text-neutral-600">
              Platform activity including logins, role changes, institution updates, and project events
            </p>
          </div>

          {!loading && (entries.length > 0 || filtersActive) ? (
            <AdminAuditListToolbar filters={listFilters} onFiltersChange={handleFiltersChange} />
          ) : null}
        </div>

        {loading ? (
          <AdminAuditListSkeleton />
        ) : entries.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FiClipboard />}
              title={filtersActive ? 'No matching entries' : 'No audit entries yet'}
              description={
                filtersActive
                  ? 'Try selecting a different action type filter.'
                  : 'Platform activity will appear here as users interact with Archivum.'
              }
              action={
                filtersActive
                  ? {
                      label: 'Reset filters',
                      onClick: () => handleFiltersChange(DEFAULT_ADMIN_AUDIT_FILTERS),
                    }
                  : undefined
              }
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">When</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Action</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Actor</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Details</th>
                    <th className="px-4 py-3 font-medium text-neutral-600 sm:px-6">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {entries.map((entry) => (
                    <tr key={`${entry.source}-${entry.id}`} className="hover:bg-neutral-50">
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-700 sm:px-6">
                        {formatTimestamp(entry.created_at)}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 sm:px-6">
                        {formatActionLabel(entry.action)}
                      </td>
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
                      <td className="px-4 py-3 text-neutral-700 sm:px-6">
                        <p>{describeEntry(entry)}</p>
                        {entry.institution_name ? (
                          <p className="text-xs text-neutral-500">{entry.institution_name}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <Badge variant={sourceBadgeVariant(entry.source)} size="sm" className="capitalize">
                          {entry.source}
                        </Badge>
                      </td>
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
