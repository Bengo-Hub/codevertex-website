'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, CheckCircle2, Lock, PlayCircle, FileText, Download,
  Award, Loader2, AlertCircle, Megaphone, MessagesSquare, Send, Wifi, WifiOff,
  ChevronRight, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
}

interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'RESOURCE';
  isPreview: boolean;
  durationSec: number | null;
  locked: boolean;
  completedAt: string | null;
  content: string | null;
  videoUrl: string | null;
  videoUrlSd: string | null;
  resourceUrl: string | null;
  resourceName: string | null;
  quiz: { id: string; title: string; passingScore: number; questions: QuizQuestion[] } | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  lessons: Lesson[];
}

interface ContentResponse {
  hasAccess: boolean;
  modules: Module[];
  progressPct: number;
  completedLessons: number;
  totalLessons: number;
}

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
  isOwn: boolean;
  replies: ThreadReply[];
}

type SidePanel = 'lessons' | 'announcements' | 'discussion';

const DATA_SAVER_KEY = 'digitika-data-saver';

const LESSON_ICON: Record<Lesson['type'], typeof PlayCircle> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  RESOURCE: Download,
  QUIZ: Sparkles,
};

function formatDuration(sec: number | null) {
  if (!sec) return null;
  const m = Math.round(sec / 60);
  return m < 1 ? '<1 min' : `${m} min`;
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function LearnClient({ courseId, courseName }: { courseId: string; courseName: string }) {
  const [studentId, setStudentId] = useState('');
  const [verifiedStudentId, setVerifiedStudentId] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [data, setData] = useState<ContentResponse | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ scorePct: number; passed: boolean; passingScore: number } | null>(null);
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [panel, setPanel] = useState<SidePanel>('lessons');

  const [dataSaver, setDataSaver] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);

  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadBody, setNewThreadBody] = useState('');
  const [postingThread, setPostingThread] = useState(false);
  const [showAskForm, setShowAskForm] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(DATA_SAVER_KEY) : null;
    if (saved === '1') setDataSaver(true);
  }, []);

  function toggleDataSaver() {
    setDataSaver((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') window.localStorage.setItem(DATA_SAVER_KEY, next ? '1' : '0');
      return next;
    });
    setVideoLoaded(false);
  }

  async function loadContent(sid: string) {
    const res = await fetch(`/api/students/${encodeURIComponent(sid)}/courses/${courseId}/content`);
    if (!res.ok) {
      setLookupError('Could not load course content for this Student ID.');
      return;
    }
    const json: ContentResponse = await res.json();
    setData(json);
    const firstUnlocked = json.modules.flatMap((m) => m.lessons).find((l) => !l.locked);
    setActiveLessonId((prev) => prev ?? firstUnlocked?.id ?? null);
  }

  async function loadAnnouncements(sid: string) {
    const res = await fetch(`/api/students/${encodeURIComponent(sid)}/courses/${courseId}/announcements`);
    if (res.ok) setAnnouncements((await res.json()).announcements);
  }

  async function loadThreads(sid: string) {
    setThreadsLoading(true);
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(sid)}/courses/${courseId}/threads`);
      if (res.ok) setThreads((await res.json()).threads);
    } finally {
      setThreadsLoading(false);
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const sid = studentId.trim().toUpperCase();
    if (!sid) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      await loadContent(sid);
      setVerifiedStudentId(sid);
      loadAnnouncements(sid);
    } finally {
      setLookupLoading(false);
    }
  }

  useEffect(() => {
    if (verifiedStudentId) {
      const cert = localStorage.getItem(`digitika-cert-${courseId}-${verifiedStudentId}`);
      if (cert) setCertUrl(cert);
    }
  }, [verifiedStudentId, courseId]);

  useEffect(() => {
    if (panel === 'discussion' && verifiedStudentId && threads === null) {
      loadThreads(verifiedStudentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel, verifiedStudentId]);

  const activeLesson = data?.modules.flatMap((m) => m.lessons).find((l) => l.id === activeLessonId) ?? null;

  useEffect(() => { setVideoLoaded(false); }, [activeLessonId]);

  async function markComplete(lessonId: string) {
    if (!verifiedStudentId) return;
    setBusy(true);
    try {
      await fetch(`/api/students/${verifiedStudentId}/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      await loadContent(verifiedStudentId);
    } finally {
      setBusy(false);
    }
  }

  async function submitQuiz() {
    if (!verifiedStudentId || !activeLesson?.quiz) return;
    const answers = activeLesson.quiz.questions.map((_, i) => quizAnswers[i] ?? -1);
    if (answers.some((a) => a === -1)) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/students/${verifiedStudentId}/lessons/${activeLesson.id}/quiz-attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      setQuizResult(json);
      if (json.passed) await loadContent(verifiedStudentId);
    } finally {
      setBusy(false);
    }
  }

  async function issueCertificate() {
    if (!verifiedStudentId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/students/${verifiedStudentId}/courses/${courseId}/certificate`, { method: 'POST' });
      if (res.ok) {
        const cert = await res.json();
        const url = `/certificates/${cert.verifyToken}`;
        localStorage.setItem(`digitika-cert-${courseId}-${verifiedStudentId}`, url);
        setCertUrl(url);
      }
    } finally {
      setBusy(false);
    }
  }

  async function postThread(e: React.FormEvent) {
    e.preventDefault();
    if (!verifiedStudentId || !newThreadTitle.trim() || !newThreadBody.trim()) return;
    setPostingThread(true);
    try {
      const res = await fetch(`/api/students/${verifiedStudentId}/courses/${courseId}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newThreadTitle, body: newThreadBody }),
      });
      if (res.ok) {
        setNewThreadTitle('');
        setNewThreadBody('');
        setShowAskForm(false);
        await loadThreads(verifiedStudentId);
      }
    } finally {
      setPostingThread(false);
    }
  }

  async function postReply(threadId: string) {
    if (!verifiedStudentId) return;
    const body = replyDrafts[threadId]?.trim();
    if (!body) return;
    setReplyingId(threadId);
    try {
      const res = await fetch(`/api/students/${verifiedStudentId}/threads/${threadId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setReplyDrafts((d) => ({ ...d, [threadId]: '' }));
        await loadThreads(verifiedStudentId);
      }
    } finally {
      setReplyingId(null);
    }
  }

  // ── Student ID gate ──────────────────────────────────────────────────
  if (!verifiedStudentId) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 py-20 px-4 text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" />
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center relative z-10"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{courseName}</h1>
            <p className="mt-3 text-primary-foreground/80 text-base max-w-md mx-auto leading-relaxed">
              Enter your Student ID to access your course content, track progress, and earn your certificate.
            </p>
          </motion.div>
        </div>
        <div className="flex-1 flex items-start justify-center px-4 py-12">
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            onSubmit={handleLookup}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm space-y-4"
          >
            <div>
              <label className="text-sm font-semibold text-foreground">Student ID</label>
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="DGT-XXXXXXXX"
                className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-3.5 text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">Sent to you by email after enrollment.</p>
            </div>
            {lookupError && (
              <p className="text-sm text-destructive flex items-center gap-1.5"><AlertCircle className="h-4 w-4 shrink-0" /> {lookupError}</p>
            )}
            <Button type="submit" disabled={lookupLoading} size="lg" className="w-full">
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Access Course <ChevronRight className="h-4 w-4" /></>}
            </Button>
          </motion.form>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading your course…</span>
      </main>
    );
  }

  const unansweredCount = threads?.filter((t) => t.replies.length === 0).length ?? 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[320px_1fr] gap-6">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Course</p>
                <h1 className="text-lg font-black text-foreground leading-tight mt-0.5 truncate">{courseName}</h1>
              </div>
              <button
                onClick={toggleDataSaver}
                title={dataSaver ? 'Data saver on — video needs a tap to load' : 'Turn on data saver for slower connections'}
                className={cn(
                  'shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-colors',
                  dataSaver ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {dataSaver ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                Data saver
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-foreground">{data.progressPct}% complete</span>
                <span className="text-muted-foreground">{data.completedLessons}/{data.totalLessons} lessons</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${data.progressPct}%` }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            {!data.hasAccess && (
              <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Only free-preview lessons are unlocked. Complete payment to unlock the full course.</span>
              </div>
            )}

            {data.progressPct === 100 && (
              <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 space-y-2">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Award className="h-4 w-4" /> Course complete!
                </p>
                {certUrl ? (
                  <a href={certUrl} className="text-xs font-semibold underline underline-offset-2 text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                    View your certificate <ChevronRight className="h-3 w-3" />
                  </a>
                ) : (
                  <Button size="sm" disabled={busy} onClick={issueCertificate} className="w-full">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Certificate'}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Panel switcher */}
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { key: 'lessons' as const, label: 'Lessons', icon: FileText },
              { key: 'announcements' as const, label: 'Updates', icon: Megaphone, count: announcements?.length },
              { key: 'discussion' as const, label: 'Q&A', icon: MessagesSquare },
            ]).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setPanel(key)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition-colors',
                  panel === key
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}{count ? ` (${count})` : ''}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {panel === 'lessons' && (
              <motion.div key="lessons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {data.modules.map((m) => (
                  <div key={m.id}>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">{m.title}</p>
                    <ul className="space-y-1">
                      {m.lessons.map((l) => {
                        const Icon = LESSON_ICON[l.type];
                        const duration = formatDuration(l.durationSec);
                        return (
                          <li key={l.id}>
                            <button
                              onClick={() => { setActiveLessonId(l.id); setQuizResult(null); setQuizAnswers({}); }}
                              disabled={l.locked}
                              className={cn(
                                'w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors',
                                l.id === activeLessonId ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/60 text-foreground',
                                l.locked && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {l.locked ? (
                                <Lock className="h-3.5 w-3.5 shrink-0" />
                              ) : l.completedAt ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              ) : (
                                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <span className="truncate flex-1">{l.title}</span>
                              {duration && <span className="text-[10px] text-muted-foreground shrink-0">{duration}</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </motion.div>
            )}

            {panel === 'announcements' && (
              <motion.div key="announcements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {announcements === null ? (
                  <p className="text-xs text-muted-foreground px-1">Loading…</p>
                ) : announcements.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-5 text-center">
                    <Megaphone className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">No updates from the Codevertex team yet.</p>
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className="rounded-xl border border-border bg-card p-3.5">
                      <p className="text-sm font-bold text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-2 font-medium">{timeAgo(a.createdAt)}</p>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* ── Content ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-7 min-h-[420px]">
          <AnimatePresence mode="wait">
            {panel === 'discussion' ? (
              <motion.div key="qa" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                      <MessagesSquare className="h-5 w-5 text-primary" /> Course Q&amp;A
                    </h2>
                    {unansweredCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{unansweredCount} question{unansweredCount === 1 ? '' : 's'} waiting on a reply</p>
                    )}
                  </div>
                  {data.hasAccess && !showAskForm && (
                    <Button size="sm" onClick={() => setShowAskForm(true)}>Ask a question</Button>
                  )}
                </div>

                {!data.hasAccess ? (
                  <p className="text-sm text-muted-foreground">Complete enrollment payment to ask questions and reply here.</p>
                ) : showAskForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={postThread}
                    className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2.5"
                  >
                    <input
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      placeholder="Question title"
                      className="w-full h-10 text-sm rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <textarea
                      value={newThreadBody}
                      onChange={(e) => setNewThreadBody(e.target.value)}
                      placeholder="Describe what you're stuck on…"
                      rows={3}
                      className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={postingThread}>
                        {postingThread ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post question'}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowAskForm(false)}>Cancel</Button>
                    </div>
                  </motion.form>
                )}

                {threadsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading discussion…</div>
                ) : !threads || threads.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                    <MessagesSquare className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No questions yet — be the first to ask.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {threads.map((t) => (
                      <div key={t.id} className="rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-foreground">{t.title}</p>
                          {t.pinned && <Badge variant="default">Pinned</Badge>}
                          {t.isOwn && <Badge variant="outline">You</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap leading-relaxed">{t.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">{t.authorName} · {timeAgo(t.createdAt)}</p>

                        {t.replies.length > 0 && (
                          <div className="mt-3 pl-3.5 border-l-2 border-border space-y-2.5">
                            {t.replies.map((r) => (
                              <div key={r.id} className="text-sm">
                                <span className="flex items-center gap-1.5">
                                  <span className={cn('font-semibold', r.isAdminReply ? 'text-primary' : 'text-foreground')}>{r.authorName}</span>
                                  {r.isAdminReply && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                                  <span className="text-[10px] text-muted-foreground font-medium">· {timeAgo(r.createdAt)}</span>
                                </span>
                                <p className="text-foreground/90 mt-0.5 whitespace-pre-wrap leading-relaxed">{r.body}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {data.hasAccess && (
                          <div className="mt-3 flex gap-2">
                            <input
                              value={replyDrafts[t.id] ?? ''}
                              onChange={(e) => setReplyDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                              placeholder="Write a reply…"
                              className="flex-1 text-xs h-9 rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                              onKeyDown={(e) => { if (e.key === 'Enter') postReply(t.id); }}
                            />
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => postReply(t.id)}
                              disabled={replyingId === t.id}
                              className="h-9 w-9 shrink-0"
                            >
                              {replyingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : !activeLesson ? (
              <motion.p key="empty" className="text-muted-foreground text-sm">Select a lesson to begin.</motion.p>
            ) : activeLesson.locked ? (
              <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-3">
                <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">This lesson is locked. Complete enrollment payment to unlock it.</p>
              </motion.div>
            ) : (
              <motion.div key={activeLesson.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {(() => { const Icon = LESSON_ICON[activeLesson.type]; return <Icon className="h-4.5 w-4.5" />; })()}
                  </span>
                  <h2 className="text-xl font-black text-foreground leading-tight">{activeLesson.title}</h2>
                </div>

                {activeLesson.type === 'VIDEO' && activeLesson.videoUrl && (() => {
                  const liteSrc = dataSaver && activeLesson.videoUrlSd ? activeLesson.videoUrlSd : activeLesson.videoUrl;
                  if (!videoLoaded) {
                    return (
                      <button
                        onClick={() => setVideoLoaded(true)}
                        className="group w-full aspect-video rounded-xl bg-gradient-to-br from-neutral-900 to-black flex flex-col items-center justify-center gap-3 text-white/90 hover:from-neutral-800 transition-colors"
                      >
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/15 group-hover:scale-105 transition-all">
                          <PlayCircle className="h-8 w-8" />
                        </span>
                        <span className="text-sm font-semibold">
                          {dataSaver ? `Tap to load video (data saver on${activeLesson.videoUrlSd ? ', lower quality' : ''})` : 'Tap to play'}
                        </span>
                      </button>
                    );
                  }
                  return <video controls autoPlay preload="metadata" className="w-full rounded-xl bg-black aspect-video" src={liteSrc ?? undefined} />;
                })()}

                {activeLesson.type === 'TEXT' && activeLesson.content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-foreground/90">{activeLesson.content}</div>
                )}

                {activeLesson.type === 'RESOURCE' && activeLesson.resourceUrl && (
                  <a
                    href={activeLesson.resourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-semibold hover:bg-muted/60 transition-colors"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Download className="h-4 w-4" /></span>
                    {activeLesson.resourceName ?? 'Download resource'}
                  </a>
                )}

                {activeLesson.type === 'QUIZ' && activeLesson.quiz && (
                  <div className="space-y-6">
                    {activeLesson.quiz.questions.map((q, qi) => (
                      <div key={q.id}>
                        <p className="text-sm font-bold text-foreground mb-2.5">{qi + 1}. {q.prompt}</p>
                        <div className="space-y-1.5">
                          {q.options.map((opt, oi) => (
                            <label
                              key={oi}
                              className={cn(
                                'flex items-center gap-2.5 text-sm rounded-xl border px-3.5 py-2.5 cursor-pointer transition-colors',
                                quizAnswers[qi] === oi ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                              )}
                            >
                              <input
                                type="radio"
                                name={`q-${qi}`}
                                checked={quizAnswers[qi] === oi}
                                onChange={() => setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
                                className="accent-primary"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {quizResult && (
                      <div className={cn(
                        'rounded-xl border p-3.5 text-sm font-semibold flex items-center gap-2',
                        quizResult.passed ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-destructive/20 bg-destructive/10 text-destructive'
                      )}>
                        {quizResult.passed ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                        Score: {quizResult.scorePct}% — {quizResult.passed ? 'Passed!' : `Needs ${quizResult.passingScore}% to pass, try again.`}
                      </div>
                    )}
                    <Button onClick={submitQuiz} disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Quiz'}
                    </Button>
                  </div>
                )}

                {activeLesson.type !== 'QUIZ' && !activeLesson.completedAt && (
                  <Button onClick={() => markComplete(activeLesson.id)} disabled={busy} variant="outline">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark as complete'}
                  </Button>
                )}
                {activeLesson.completedAt && activeLesson.type !== 'QUIZ' && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Completed
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
