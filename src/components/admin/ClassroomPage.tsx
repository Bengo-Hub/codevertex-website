'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Megaphone, MessagesSquare, GraduationCap, Plus, Trash2, Pin, PinOff,
  Send, CheckCircle2, Loader2,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { toast } from 'sonner';

// This page intentionally lives in the general admin dashboard rather than a
// separate instructor portal/role — any admin/staff user with digitika.classroom
// permissions can post announcements, answer student questions, and review
// progress/quiz grades for a course. See src/lib/digitika-rbac-catalog.ts.

interface CourseOption { id: string; name: string }

interface Announcement { id: string; title: string; body: string; createdAt: string }

interface ThreadReply {
  id: string;
  body: string;
  createdAt: string;
  isAdminReply: boolean;
  authorName: string;
}

interface Thread {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  authorName: string;
  unanswered: boolean;
  replies: ThreadReply[];
}

interface QuizScore { lessonTitle: string; scorePct: number | null; passed: boolean }

interface RosterRow {
  studentId: string;
  fullName: string;
  email: string;
  completedLessons: number;
  totalLessons: number;
  progressPct: number;
  quizScores: QuizScore[];
}

type Tab = 'announcements' | 'qa' | 'grades';

const inputCls =
  'w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50';

export function ClassroomPage() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState('');
  const [tab, setTab] = useState<Tab>('announcements');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/courses?includeInactive=true');
      if (res.ok) {
        const data: CourseOption[] = await res.json();
        setCourses(data);
        if (data.length > 0) setCourseId(data[0].id);
      }
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPageHeader
        title="Classroom"
        description="Announcements, student Q&A, and progress/grades — per course."
        actions={
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={`${inputCls} w-64`}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        }
      />

      <div className="flex gap-1 mb-5 border-b border-border">
        {([
          { key: 'announcements', label: 'Announcements', icon: Megaphone },
          { key: 'qa', label: 'Q&A', icon: MessagesSquare },
          { key: 'grades', label: 'Grades', icon: GraduationCap },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {!courseId ? (
        <p className="text-sm text-muted-foreground">Select a course to continue.</p>
      ) : tab === 'announcements' ? (
        <AnnouncementsTab courseId={courseId} />
      ) : tab === 'qa' ? (
        <QaTab courseId={courseId} />
      ) : (
        <GradesTab courseId={courseId} />
      )}
    </div>
  );
}

// ── Announcements ────────────────────────────────────────────────────────

function AnnouncementsTab({ courseId }: { courseId: string }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/courses/${courseId}/announcements`);
    if (res.ok) setItems((await res.json()).announcements);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  async function post() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/admin/courses/${courseId}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('Announcement posted');
      setTitle('');
      setBody('');
      setShowForm(false);
      load();
    } else {
      toast.error('Failed to post announcement');
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Announcement removed');
      load();
    }
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New announcement
        </button>
      ) : (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2.5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={inputCls} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message to students…" rows={3} className={inputCls} />
          <div className="flex gap-2">
            <button onClick={post} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
              {saving ? 'Posting…' : 'Post'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-border">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No announcements yet for this course.</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="rounded-lg border border-border bg-card p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(a.createdAt).toLocaleString('en-GB')}</p>
              </div>
              <button onClick={() => remove(a.id)} className="shrink-0 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Q&A ───────────────────────────────────────────────────────────────────

function QaTab({ courseId }: { courseId: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/courses/${courseId}/threads`);
    if (res.ok) setThreads((await res.json()).threads);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  async function togglePin(id: string, pinned: boolean) {
    await fetch(`/api/admin/threads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !pinned }),
    });
    load();
  }

  async function reply(id: string) {
    const body = replyDrafts[id]?.trim();
    if (!body) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/threads/${id}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setBusyId(null);
    if (res.ok) {
      setReplyDrafts((d) => ({ ...d, [id]: '' }));
      load();
    } else {
      toast.error('Failed to post reply');
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (threads.length === 0) return <p className="text-sm text-muted-foreground">No questions posted for this course yet.</p>;

  return (
    <div className="space-y-3">
      {threads.map((t) => (
        <div key={t.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                {t.unanswered && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Unanswered
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{t.body}</p>
              <p className="text-xs text-muted-foreground mt-2">{t.authorName} · {new Date(t.createdAt).toLocaleString('en-GB')}</p>
            </div>
            <button onClick={() => togglePin(t.id, t.pinned)} className="shrink-0 p-1.5 rounded-md hover:bg-muted text-muted-foreground" title={t.pinned ? 'Unpin' : 'Pin'}>
              {t.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </button>
          </div>

          {t.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-border space-y-2">
              {t.replies.map((r) => (
                <div key={r.id} className="text-sm">
                  <span className={`font-medium ${r.isAdminReply ? 'text-primary' : 'text-foreground'}`}>{r.authorName}</span>
                  {r.isAdminReply && <CheckCircle2 className="inline h-3.5 w-3.5 ml-1 text-primary" />}
                  <span className="text-muted-foreground"> · {new Date(r.createdAt).toLocaleString('en-GB')}</span>
                  <p className="text-foreground/90 mt-0.5 whitespace-pre-wrap">{r.body}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <input
              value={replyDrafts[t.id] ?? ''}
              onChange={(e) => setReplyDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
              placeholder="Reply as Codevertex Team…"
              className={inputCls}
              onKeyDown={(e) => { if (e.key === 'Enter') reply(t.id); }}
            />
            <button
              onClick={() => reply(t.id)}
              disabled={busyId === t.id}
              className="shrink-0 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busyId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Grades ────────────────────────────────────────────────────────────────

function GradesTab({ courseId }: { courseId: string }) {
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/courses/${courseId}/grades`);
    if (res.ok) setRoster((await res.json()).roster);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (roster.length === 0) return <p className="text-sm text-muted-foreground">No paid-enrolled students for this course yet.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left font-semibold px-4 py-2.5">Student</th>
            <th className="text-left font-semibold px-4 py-2.5">Progress</th>
            <th className="text-left font-semibold px-4 py-2.5">Quiz scores</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((r) => (
            <tr key={r.studentId} className="border-t border-border">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{r.fullName}</p>
                <p className="text-xs text-muted-foreground">{r.email} · {r.studentId}</p>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 min-w-32">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${r.progressPct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{r.completedLessons}/{r.totalLessons}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                {r.quizScores.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No quizzes</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {r.quizScores.map((q, i) => (
                      <span
                        key={i}
                        title={q.lessonTitle}
                        className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                          q.scorePct === null
                            ? 'bg-muted text-muted-foreground'
                            : q.passed
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {q.scorePct === null ? '—' : `${q.scorePct}%`}
                      </span>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground px-4 py-2.5 bg-muted/20">
        To manually credit or reopen a specific lesson for a student, use the override endpoint from the student&apos;s record, or ask engineering to wire a per-lesson control here if this becomes a frequent need.
      </p>
    </div>
  );
}
