'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Images, MapPin, Calendar, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from './AdminPageHeader';
import { authedFetch } from '@/lib/auth/authed-fetch';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { slugify } from '@/lib/projects';

interface Photo { id: string; caption: string | null; sortOrder: number }
interface ProjectEvent {
  id: string;
  slug: string;
  title: string;
  venue: string;
  description: string;
  eventDate: string;
  published: boolean;
  photos: Photo[];
}

const inputCls =
  'w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50';

const MAX_DIMENSION = 1600;

/** Draft events aren't served by the public image endpoint, so admin previews fetch with the SSO token. */
function AuthImage({ eventId, photoId, alt, className }: { eventId: string; photoId: string; alt: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    authedFetch(`/api/admin/projects/${eventId}/photos/${photoId}`)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (b && !cancelled) { url = URL.createObjectURL(b); setSrc(url); }
      })
      .catch(() => {});
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [eventId, photoId]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={alt} className={className} /> : <div className={`${className ?? ''} bg-muted animate-pulse`} />;
}

/** Downsize in the browser so phone photos (4–8 MB) become ~200–400 KB before upload. */
async function resizeImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // unreadable here — let the server validate it
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

function EventForm({
  initial,
  onClose,
  onChanged,
}: {
  initial: ProjectEvent | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [event, setEvent] = useState<ProjectEvent | null>(initial);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [venue, setVenue] = useState(initial?.venue ?? '');
  const [eventDate, setEventDate] = useState(initial ? toDateInput(initial.eventDate) : new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [published, setPublished] = useState(initial?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSave() {
    if (!title.trim() || !slug.trim() || !venue.trim() || !description.trim() || !eventDate) {
      toast.error('Title, slug, venue, date and description are required');
      return;
    }
    setSaving(true);
    const body = { title, slug, venue, description, eventDate, published };
    const res = event
      ? await authedFetch(`/api/admin/projects/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await authedFetch('/api/admin/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error?.[0]?.message ?? 'Failed to save event');
      return;
    }
    if (!event) {
      // Photos need an event id, so stay open after the first save and unlock the photo section.
      setEvent({ ...data, photos: [] });
      toast.success('Event saved — now add photos');
    } else {
      toast.success('Event updated');
    }
    onChanged();
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !event) return;
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) {
      toast.error('Please choose image files (JPG, PNG or WebP)');
      return;
    }
    setUploading({ done: 0, total: list.length });
    let failed = 0;
    const added: Photo[] = [];
    for (let i = 0; i < list.length; i++) {
      const fd = new FormData();
      fd.append('file', await resizeImage(list[i]));
      const res = await authedFetch(`/api/admin/projects/${event.id}/photos`, { method: 'POST', body: fd });
      if (res.ok) added.push(await res.json());
      else {
        failed++;
        const data = await res.json().catch(() => ({}));
        toast.error(`${list[i].name}: ${data.error ?? 'upload failed'}`);
      }
      setUploading({ done: i + 1, total: list.length });
    }
    setUploading(null);
    if (fileRef.current) fileRef.current.value = '';
    if (added.length) {
      setEvent((prev) => (prev ? { ...prev, photos: [...prev.photos, ...added] } : prev));
      toast.success(`${added.length} photo${added.length === 1 ? '' : 's'} uploaded${failed ? `, ${failed} failed` : ''}`);
      onChanged();
    }
  }

  async function deletePhoto(photoId: string) {
    if (!event) return;
    const res = await authedFetch(`/api/admin/projects/${event.id}/photos/${photoId}`, { method: 'DELETE' });
    if (res.ok) {
      setEvent((prev) => (prev ? { ...prev, photos: prev.photos.filter((p) => p.id !== photoId) } : prev));
      onChanged();
    } else {
      toast.error('Could not delete photo');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{event ? 'Edit project / event' : 'New project / event'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
            <input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. Kisumu County ICT Stakeholders Meeting" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Venue</label>
              <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Imperial Hotel, Kisumu" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">URL slug</label>
            <input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="What was the meeting about, who attended, and what did Codevertex take part in?"
              className={inputCls}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded border-border" />
            Published (visible on the website)
          </label>

          {/* Photos — unlocked once the event exists */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Photos {event ? `(${event.photos.length})` : ''}
              </p>
              {event && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted font-semibold disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? `Uploading ${uploading.done}/${uploading.total}…` : 'Add photos'}
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {!event ? (
              <p className="text-xs text-muted-foreground">Save the event details first, then you can add photos.</p>
            ) : event.photos.length === 0 ? (
              <p className="text-xs text-muted-foreground">No photos yet. Photos are resized automatically before upload.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {event.photos.map((p) => (
                  <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                    <AuthImage eventId={event.id} photoId={p.id} alt={p.caption ?? ''} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => deletePhoto(p.id)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      title="Delete photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {event && !published && (
              <p className="text-[11px] text-muted-foreground mt-2">
                This event is a draft — tick &ldquo;Published&rdquo; and save to show it on the website.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">
            {event ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading !== null}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : event ? 'Save changes' : 'Save event'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectsAdminPage() {
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProjectEvent | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectEvent | null>(null);

  const load = useCallback(async () => {
    const res = await authedFetch('/api/admin/projects');
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePublished(e: ProjectEvent) {
    const res = await authedFetch(`/api/admin/projects/${e.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !e.published }),
    });
    if (res.ok) {
      toast.success(e.published ? 'Unpublished' : 'Published');
      load();
    } else {
      toast.error('Update failed');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await authedFetch(`/api/admin/projects/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Event deleted');
      load();
    } else {
      toast.error('Delete failed');
    }
    setDeleteTarget(null);
  }

  return (
    <div>
      <AdminPageHeader
        title="Projects & events"
        description="Meetings and events the team attends — photos, venue and description shown on the public /projects page."
        actions={
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New event
          </button>
        }
      />

      {loading ? (
        <p className="py-16 text-center text-muted-foreground text-xs">Loading…</p>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground text-xs">
          <Images className="h-6 w-6 mx-auto mb-2 opacity-40" />
          No events yet. Add your first meeting with photos.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
              <div className="relative h-40 bg-muted">
                {e.photos[0] ? (
                  <AuthImage eventId={e.id} photoId={e.photos[0].id} alt={e.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground"><Images className="h-6 w-6 opacity-40" /></div>
                )}
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${e.published ? 'bg-primary text-primary-foreground' : 'bg-black/70 text-white'}`}>
                  {e.published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="font-semibold text-foreground text-sm leading-snug">{e.title}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5"><MapPin className="h-3 w-3" />{e.venue}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {new Date(e.eventDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })} · {e.photos.length} photo{e.photos.length === 1 ? '' : 's'}
                </p>
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-border">
                  <button onClick={() => togglePublished(e)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title={e.published ? 'Unpublish' : 'Publish'}>
                    {e.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => setEditing(e)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(e)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EventForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onChanged={load}
        />
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.title}"?`}
        description="The event and all its photos will be removed. This can't be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
