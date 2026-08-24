'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, MessagesSquare, GraduationCap, Plus, Trash2, Pin, PinOff,
  Send, CheckCircle2, Loader2, Users,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { authedFetch } from '@/lib/auth/authed-fetch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  'w-full h-10 text-sm rounded-lg border border-input bg-background px-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background';

function timeAgo(iso: string) {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function ClassroomPage() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState('');
  const [tab, setTab] = useState<Tab>('announcements');

  useEffect(() => {
    (async () => {
      const res = await authedFetch('/api/admin/courses?includeInactive=true')
      if (res.ok) {
        const data: CourseOption[] = await res.json();
        setCourses(data);
        if (data.length > 0) setCourseId(data[0].id);
      }
    })();
  }, []);

  const tabs = [
    { key: 'announcements' as const, label: 'Announcements', icon: Megaphone },
    { key: 'qa' as const, label: 'Q&A', icon: MessagesSquare },
    { key: 'grades' as const, label: 'Grades', icon: GraduationCap },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPageHeader
        title="Classroom"
        description="Announcements, student Q&A, and progress/grades — per course."
      />

      <div className="mt-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-card p-1 gap-1 w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                tab === key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="h-10 w-full sm:w-64 rounded-lg border border-input bg-card px-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {!courseId ? (
        <p className="text-sm text-muted-foreground">Select a course to continue.</p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {tab === 'announcements' && <AnnouncementsTab courseId={courseId} />}
            {tab === 'qa' && <QaTab courseId={courseId} />}
            {tab === 'grades' && <GradesTab courseId={courseId} />}
          </motion.div>
        </AnimatePresence>
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
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> New announcement
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={inputCls} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message to students…"
            rows={3}
            className="w-full text-sm rounded-lg border border-input bg-background px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <Button onClick={post} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
            </Button>
            <Button onClick={() => setShowForm(false)} size="sm" variant="ghost">Cancel</Button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Megaphone className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No announcements yet for this course.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Megaphone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{a.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                  <p className="text-[11px] text-muted-foreground mt-2 font-medium">{timeAgo(a.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={() => remove(a.id)}
                className="shrink-0 p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
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
  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <MessagesSquare className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No questions posted for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((t) => (
        <div key={t.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-foreground">{t.title}</p>
                {t.unanswered && <Badge variant="warning">Unanswered</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap leading-relaxed">{t.body}</p>
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">{t.authorName} · {timeAgo(t.createdAt)}</p>
            </div>
            <button
              onClick={() => togglePin(t.id, t.pinned)}
              className="shrink-0 p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              title={t.pinned ? 'Unpin' : 'Pin'}
            >
              {t.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </button>
          </div>

          {t.replies.length > 0 && (
            <div className="mt-3 pl-3.5 border-l-2 border-border space-y-2.5">
              {t.replies.map((r) => (
                <div key={r.id} className="text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className={cn('font-semibold', r.isAdminReply ? 'text-primary' : 'text-foreground')}>{r.authorName}</span>
                    {r.isAdminReply && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                    <span className="text-[11px] text-muted-foreground font-medium">· {timeAgo(r.createdAt)}</span>
                  </span>
                  <p className="text-foreground/90 mt-0.5 whitespace-pre-wrap leading-relaxed">{r.body}</p>
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
            <Button
              size="icon"
              variant="secondary"
              onClick={() => reply(t.id)}
              disabled={busyId === t.id}
              className="shrink-0 h-10 w-10"
            >
              {busyId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
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
  if (roster.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <Users className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No paid-enrolled students for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="text-left font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Student</th>
              <th className="text-left font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Progress</th>
              <th className="text-left font-bold text-xs uppercase tracking-wider text-muted-foreground px-4 py-3">Quiz scores</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roster.map((r) => (
              <tr key={r.studentId} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-foreground">{r.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.email} · {r.studentId}</p>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5 min-w-36">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', r.progressPct === 100 ? 'bg-emerald-500' : 'bg-primary')}
                        style={{ width: `${r.progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground shrink-0">{r.completedLessons}/{r.totalLessons}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {r.quizScores.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No quizzes</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {r.quizScores.map((q, i) => (
                        <span
                          key={i}
                          title={q.lessonTitle}
                          className={cn(
                            'text-[11px] font-bold px-2 py-1 rounded-md',
                            q.scorePct === null
                              ? 'bg-muted text-muted-foreground'
                              : q.passed
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-destructive/10 text-destructive'
                          )}
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
      </div>
      <p className="text-xs text-muted-foreground px-4 py-3 bg-muted/20 border-t border-border">
        To manually credit or reopen a specific lesson for a student, use the override endpoint from the student&apos;s record, or ask engineering to wire a per-lesson control here if this becomes a frequent need.
      </p>
    </div>
  );
}
