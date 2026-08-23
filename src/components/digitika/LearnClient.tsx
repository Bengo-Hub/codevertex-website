'use client';

import { useEffect, useState } from 'react';
import {
  GraduationCap, CheckCircle2, Circle, Lock, PlayCircle, FileText, Download,
  Award, Loader2, AlertCircle, Megaphone, MessagesSquare, Send, Wifi, WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Data saver — persisted locally. When on: prefer the low-bandwidth video variant
  // (if the lesson has one) and never preload video bytes until the student taps play.
  const [dataSaver, setDataSaver] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);

  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadBody, setNewThreadBody] = useState('');
  const [postingThread, setPostingThread] = useState(false);
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

  // --- Student ID gate -------------------------------------------------
  if (!verifiedStudentId) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 py-16 px-4 text-primary-foreground">
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center mx-auto mb-5">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{courseName}</h1>
            <p className="mt-3 text-primary-foreground/80 text-base max-w-md mx-auto leading-relaxed">
              Enter your Student ID to access your course content.
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-start justify-center px-4 py-12">
          <form onSubmit={handleLookup} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-medium">Student ID</label>
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="DGT-XXXXXXXX"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            {lookupError && (
              <p className="text-sm text-destructive flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> {lookupError}</p>
            )}
            <Button type="submit" disabled={lookupLoading} className="w-full">
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Access Course'}
            </Button>
          </form>
        </div>
      </main>
    );
  }

  if (!data) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></main>;

  const unansweredCount = threads?.filter((t) => t.replies.length === 0).length ?? 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold">{courseName}</h1>
              <button
                onClick={toggleDataSaver}
                title={dataSaver ? 'Data saver is on — video won\'t auto-load' : 'Turn on data saver for slower connections'}
                className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold border ${
                  dataSaver ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                }`}
              >
                {dataSaver ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                Data saver
              </button>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${data.progressPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{data.completedLessons}/{data.totalLessons} lessons complete ({data.progressPct}%)</p>
          </div>

          {!data.hasAccess && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-700 dark:text-amber-400">
              Only free-preview lessons are unlocked. Complete payment to unlock the full course.
            </div>
          )}

          {data.progressPct === 100 && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 space-y-2">
              <p className="text-xs font-medium flex items-center gap-1.5"><Award className="h-4 w-4" /> Course complete!</p>
              {certUrl ? (
                <a href={certUrl} className="text-xs underline underline-offset-2 text-emerald-700 dark:text-emerald-400">View your certificate →</a>
              ) : (
                <Button size="sm" disabled={busy} onClick={issueCertificate} className="w-full">Get Certificate</Button>
              )}
            </div>
          )}

          {/* Panel switcher */}
          <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
            <button
              onClick={() => setPanel('lessons')}
              className={`flex-1 px-2 py-1.5 ${panel === 'lessons' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'}`}
            >
              Lessons
            </button>
            <button
              onClick={() => setPanel('announcements')}
              className={`flex-1 px-2 py-1.5 flex items-center justify-center gap-1 ${panel === 'announcements' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'}`}
            >
              <Megaphone className="h-3 w-3" /> Updates{announcements && announcements.length > 0 ? ` (${announcements.length})` : ''}
            </button>
            <button
              onClick={() => setPanel('discussion')}
              className={`flex-1 px-2 py-1.5 flex items-center justify-center gap-1 ${panel === 'discussion' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'}`}
            >
              <MessagesSquare className="h-3 w-3" /> Q&A
            </button>
          </div>

          {panel === 'lessons' && data.modules.map((m) => (
            <div key={m.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{m.title}</p>
              <ul className="space-y-1">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <button
                      onClick={() => { setActiveLessonId(l.id); setQuizResult(null); setQuizAnswers({}); }}
                      disabled={l.locked}
                      className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm ${
                        l.id === activeLessonId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/60'
                      } ${l.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {l.locked ? <Lock className="h-3.5 w-3.5 shrink-0" /> :
                        l.completedAt ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> :
                        <Circle className="h-3.5 w-3.5 shrink-0" />}
                      <span className="truncate">{l.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {panel === 'announcements' && (
            <div className="space-y-2">
              {announcements === null ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : announcements.length === 0 ? (
                <p className="text-xs text-muted-foreground">No updates from the Codevertex team yet.</p>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">{new Date(a.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </aside>

        {/* Content */}
        <section className="rounded-2xl border border-border bg-card p-6 min-h-[400px]">
          {panel === 'discussion' ? (
            <div className="space-y-5">
              <h2 className="text-xl font-bold flex items-center gap-2"><MessagesSquare className="h-5 w-5" /> Course Q&A</h2>

              {!data.hasAccess ? (
                <p className="text-sm text-muted-foreground">Complete enrollment payment to ask questions and reply here.</p>
              ) : (
                <form onSubmit={postThread} className="rounded-lg border border-border p-3 space-y-2">
                  <input
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="Question title"
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2"
                  />
                  <textarea
                    value={newThreadBody}
                    onChange={(e) => setNewThreadBody(e.target.value)}
                    placeholder="Describe what you're stuck on…"
                    rows={3}
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2"
                  />
                  <Button type="submit" size="sm" disabled={postingThread}>
                    {postingThread ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post question'}
                  </Button>
                </form>
              )}

              {threadsLoading ? (
                <p className="text-sm text-muted-foreground">Loading discussion…</p>
              ) : !threads || threads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No questions yet — be the first to ask.</p>
              ) : (
                <div className="space-y-3">
                  {unansweredCount > 0 && (
                    <p className="text-xs text-muted-foreground">{unansweredCount} question{unansweredCount === 1 ? '' : 's'} still waiting on a reply.</p>
                  )}
                  {threads.map((t) => (
                    <div key={t.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{t.title}</p>
                        {t.pinned && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">Pinned</span>}
                        {t.isOwn && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">You</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{t.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">{t.authorName} · {new Date(t.createdAt).toLocaleDateString('en-GB')}</p>

                      {t.replies.length > 0 && (
                        <div className="mt-2 pl-3 border-l-2 border-border space-y-1.5">
                          {t.replies.map((r) => (
                            <div key={r.id} className="text-sm">
                              <span className={`font-medium ${r.isAdminReply ? 'text-primary' : ''}`}>{r.authorName}</span>
                              <span className="text-xs text-muted-foreground"> · {new Date(r.createdAt).toLocaleDateString('en-GB')}</span>
                              <p className="text-foreground/90 text-sm whitespace-pre-wrap">{r.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {data.hasAccess && (
                        <div className="mt-2 flex gap-2">
                          <input
                            value={replyDrafts[t.id] ?? ''}
                            onChange={(e) => setReplyDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                            placeholder="Write a reply…"
                            className="flex-1 text-xs rounded-lg border border-border bg-background px-2.5 py-1.5"
                          />
                          <button
                            onClick={() => postReply(t.id)}
                            disabled={replyingId === t.id}
                            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                          >
                            {replyingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !activeLesson ? (
            <p className="text-muted-foreground text-sm">Select a lesson to begin.</p>
          ) : activeLesson.locked ? (
            <div className="text-center py-16 space-y-3">
              <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">This lesson is locked. Complete enrollment payment to unlock it.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {activeLesson.type === 'VIDEO' && <PlayCircle className="h-5 w-5" />}
                {activeLesson.type === 'RESOURCE' && <Download className="h-5 w-5" />}
                {activeLesson.type === 'TEXT' && <FileText className="h-5 w-5" />}
                {activeLesson.title}
              </h2>

              {activeLesson.type === 'VIDEO' && activeLesson.videoUrl && (() => {
                const liteSrc = dataSaver && activeLesson.videoUrlSd ? activeLesson.videoUrlSd : activeLesson.videoUrl;
                if (!videoLoaded) {
                  return (
                    <button
                      onClick={() => setVideoLoaded(true)}
                      className="w-full aspect-video rounded-lg bg-black/90 flex flex-col items-center justify-center gap-2 text-white/90 hover:bg-black transition-colors"
                    >
                      <PlayCircle className="h-12 w-12" />
                      <span className="text-sm font-medium">
                        {dataSaver ? 'Tap to load video (data saver on' + (activeLesson.videoUrlSd ? ', lower quality)' : ')') : 'Tap to load video'}
                      </span>
                    </button>
                  );
                }
                return <video controls autoPlay preload="metadata" className="w-full rounded-lg bg-black" src={liteSrc ?? undefined} />;
              })()}

              {activeLesson.type === 'TEXT' && activeLesson.content && (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{activeLesson.content}</div>
              )}

              {activeLesson.type === 'RESOURCE' && activeLesson.resourceUrl && (
                <a href={activeLesson.resourceUrl} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/60">
                  <Download className="h-4 w-4" /> {activeLesson.resourceName ?? 'Download resource'}
                </a>
              )}

              {activeLesson.type === 'QUIZ' && activeLesson.quiz && (
                <div className="space-y-5">
                  {activeLesson.quiz.questions.map((q, qi) => (
                    <div key={q.id}>
                      <p className="text-sm font-medium mb-2">{qi + 1}. {q.prompt}</p>
                      <div className="space-y-1.5">
                        {q.options.map((opt, oi) => (
                          <label key={oi} className="flex items-center gap-2 text-sm rounded-lg border border-border px-3 py-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input
                              type="radio"
                              name={`q-${qi}`}
                              checked={quizAnswers[qi] === oi}
                              onChange={() => setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {quizResult && (
                    <p className={`text-sm font-medium ${quizResult.passed ? 'text-emerald-600' : 'text-destructive'}`}>
                      Score: {quizResult.scorePct}% — {quizResult.passed ? 'Passed!' : `Needs ${quizResult.passingScore}% to pass, try again.`}
                    </p>
                  )}
                  <Button onClick={submitQuiz} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Quiz'}</Button>
                </div>
              )}

              {activeLesson.type !== 'QUIZ' && !activeLesson.completedAt && (
                <Button onClick={() => markComplete(activeLesson.id)} disabled={busy} variant="outline">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark as complete'}
                </Button>
              )}
              {activeLesson.completedAt && activeLesson.type !== 'QUIZ' && (
                <p className="text-sm text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Completed</p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

