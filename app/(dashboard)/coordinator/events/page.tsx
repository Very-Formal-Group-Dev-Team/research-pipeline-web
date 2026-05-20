'use client';

import React, { useEffect, useState } from 'react';
import { FiCalendar, FiMapPin, FiPlus, FiX } from 'react-icons/fi';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  cancelCoordinatorEvent,
  createCoordinatorEvent,
  getCoordinatorEvents,
  type InstitutionEvent,
} from '@/lib/api/events';
import { formatStatusLabel } from '@/lib/utils/formatStatus';

function formatDateTime(iso?: string | null) {
  if (!iso) return '-';
  const parsed = new Date(iso.replace(/Z$/i, ''));
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'scheduled':
      return 'default';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'warning';
  }
}

export default function CoordinatorEventsPage() {
  const { user, handleLogout } = useDashboardUser('Coordinator');
  const [events, setEvents] = useState<InstitutionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    modality: 'Online' as 'Online' | 'In-Person' | 'Hybrid',
  });

  async function loadEvents() {
    setLoading(true);
    const res = await getCoordinatorEvents();
    if (res.data) setEvents(res.data);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const start_time = `${form.date}T${form.startTime}:00`;
    const end_time = `${form.date}T${form.endTime}:00`;

    const res = await createCoordinatorEvent({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      start_time,
      end_time,
      location: form.location.trim(),
      modality: form.modality,
    });

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setShowModal(false);
    setForm({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      modality: 'Online',
    });
    await loadEvents();
  }

  async function handleCancel(eventId: string) {
    const res = await cancelCoordinatorEvent(eventId);
    if (!res.error) await loadEvents();
  }

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Institution Events</h1>
            <p className="text-neutral-600 mt-1">
              Schedule workshops, deadlines, and other institution-wide events
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <FiPlus className="mr-1" /> Create Event
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : events.length === 0 ? (
          <Card>
            <p className="text-sm text-neutral-600">No events scheduled yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Card key={event.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-primary-700">{event.title}</h3>
                      <Badge variant={statusVariant(event.status)}>
                        {formatStatusLabel(event.status)}
                      </Badge>
                    </div>
                    {event.description ? (
                      <p className="text-sm text-neutral-600 mb-2">{event.description}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                      <span className="inline-flex items-center gap-1">
                        <FiCalendar /> {formatDateTime(event.start_time)} – {formatDateTime(event.end_time)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FiMapPin /> {event.location}
                      </span>
                      <span>{event.modality}</span>
                    </div>
                    {event.created_by_name ? (
                      <p className="text-xs text-neutral-500 mt-1">Created by {event.created_by_name}</p>
                    ) : null}
                  </div>
                  {event.status === 'scheduled' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(event.id)}
                    >
                      <FiX className="mr-1" /> Cancel
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Institution Event"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error ? (
            <p className="text-sm text-error-600 bg-error-50 rounded-lg px-3 py-2">{error}</p>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              placeholder="e.g. Research Workshop"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Start</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">End</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
            <input
              required
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Room or online link"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Modality</label>
            <select
              value={form.modality}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  modality: e.target.value as 'Online' | 'In-Person' | 'Hybrid',
                }))
              }
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
