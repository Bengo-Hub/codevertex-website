'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Pencil, Trash2, X, GripVertical,
  Video, FileText, HelpCircle, Paperclip, Eye, EyeOff, Search,
  Layers, BookOpen, ListChecks,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────

type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'RESOURCE';

interface QuizQuestion {
  id?: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  sortOrder: number;
}

interface Quiz {
  id?: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: LessonType;
  content: string | null;
  videoUrl: string | null;
  videoUrlSd: string | null;
  durationSec: number | null;
  resourceUrl: string | null;
  resourceName: string | null;
  isPreview: boolean;
  sortOrder: number;
  quiz: Quiz | null;
}

interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: Lesson[];
}

interface CourseOption {
  id: string;
  name: string;
}

const LESSON_TYPE_ICON: Record<LessonType, typeof Video> = {
  VIDEO: Video,
  TEXT: FileText,
  QUIZ: HelpCircle,
  RESOURCE: Paperclip,
};

// Color-coded per type — lets you scan a module's mix of content at a glance.
const LESSON_TYPE_STYLE: Record<LessonType, { chip: string; icon: string; label: string }> = {
  VIDEO: { chip: 'bg-blue-500/10', icon: 'text-blue-600 dark:text-blue-400', label: 'Video' },
  TEXT: { chip: 'bg-slate-500/10', icon: 'text-slate-600 dark:text-slate-400', label: 'Text' },
  QUIZ: { chip: 'bg-amber-500/10', icon: 'text-amber-600 dark:text-amber-400', label: 'Quiz' },
  RESOURCE: { chip: 'bg-violet-500/10', icon: 'text-violet-600 dark:text-violet-400', label: 'Resource' },
};

const inputCls =
  'w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50';

function formatDuration(sec: number | null): string | null {
  if (!sec) return null;
  const m = Math.round(sec / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

// ── Quiz editor ──────────────────────────────────────────────────────────

function QuizEditor({
  lessonId,
  initial,
  onSave,
  onClose,
}: {
  lessonId: string;
  initial: Quiz | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? 'Quiz');
  const [passingScore, setPassingScore] = useState(initial?.passingScore ?? 70);
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initial?.questions?.length
      ? initial.questions
      : [{ prompt: '', options: ['', ''], correctIndex: 0, sortOrder: 0 }]
  );
  const [saving, setSaving] = useState(false);

  function updateQuestion(idx: number, patch: Partial<QuizQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }
  function updateOption(qIdx: number, oIdx: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q))
    );
  }
  function addOption(qIdx: number) {
    setQuestions((qs) => qs.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ''] } : q)));
  }
  function removeOption(qIdx: number, oIdx: number) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.filter((_, j) => j !== oIdx),
              correctIndex: q.correctIndex >= oIdx && q.correctIndex > 0 ? q.correctIndex - 1 : q.correctIndex,
            }
          : q
      )
    );
  }
  function addQuestion() {
    setQuestions((qs) => [...qs, { prompt: '', options: ['', ''], correctIndex: 0, sortOrder: qs.length }]);
  }
  function removeQuestion(idx: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!title.trim() || questions.length === 0 || questions.some((q) => !q.prompt.trim() || q.options.some((o) => !o.trim()))) {
      toast.error('Fill in the quiz title, every question, and every option before saving');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, passingScore, questions }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('Quiz saved');
      onSave();
      onClose();
    } else {
      toast.error('Failed to save quiz');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <HelpCircle className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">Edit Quiz</h2>
              <p className="text-xs text-muted-foreground">{questions.length} question{questions.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Quiz title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Passing score (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="space-y-3">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="rounded-xl border border-border bg-background p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {qIdx + 1}
                  </span>
                  <input
                    value={q.prompt}
                    onChange={(e) => updateQuestion(qIdx, { prompt: e.target.value })}
                    placeholder="Question prompt"
                    className={inputCls}
                  />
                  <button onClick={() => removeQuestion(qIdx)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 ml-8">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={q.correctIndex === oIdx}
                        onChange={() => updateQuestion(qIdx, { correctIndex: oIdx })}
                        title="Mark as correct answer"
                        className="accent-primary"
                      />
                      <input
                        value={opt}
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        placeholder={`Option ${oIdx + 1}`}
                        className={`flex-1 text-xs rounded-lg border px-2.5 py-1.5 text-foreground focus:outline-none ${
                          q.correctIndex === oIdx ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-muted'
                        }`}
                      />
                      {q.options.length > 2 && (
                        <button onClick={() => removeOption(qIdx, oIdx)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addOption(qIdx)} className="text-[10px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
                    <Plus className="h-2.5 w-2.5" /> Add option
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addQuestion}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 border border-dashed border-primary/30 rounded-xl px-3 py-2.5 w-full justify-center hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add question
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lesson form (inline add/edit) ───────────────────────────────────────

function LessonForm({
  moduleId,
  lesson,
  onSaved,
  onCancel,
}: {
  moduleId: string;
  lesson: Lesson | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [type, setType] = useState<LessonType>(lesson?.type ?? 'TEXT');
  const [content, setContent] = useState(lesson?.content ?? '');
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? '');
  const [videoUrlSd, setVideoUrlSd] = useState(lesson?.videoUrlSd ?? '');
  const [durationSec, setDurationSec] = useState(lesson?.durationSec?.toString() ?? '');
  const [resourceUrl, setResourceUrl] = useState(lesson?.resourceUrl ?? '');
  const [resourceName, setResourceName] = useState(lesson?.resourceName ?? '');
  const [isPreview, setIsPreview] = useState(lesson?.isPreview ?? false);
  const [sortOrder, setSortOrder] = useState(lesson?.sortOrder?.toString() ?? '0');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Lesson title is required');
      return;
    }
    setSaving(true);
    const body = {
      title,
      type,
      content: type === 'TEXT' ? content : undefined,
      videoUrl: type === 'VIDEO' ? videoUrl : undefined,
      videoUrlSd: type === 'VIDEO' ? videoUrlSd : undefined,
      durationSec: type === 'VIDEO' && durationSec ? Number(durationSec) : undefined,
      resourceUrl: type === 'RESOURCE' ? resourceUrl : undefined,
      resourceName: type === 'RESOURCE' ? resourceName : undefined,
      isPreview,
      sortOrder: Number(sortOrder) || 0,
    };
    const res = lesson
      ? await fetch(`/api/admin/lessons/${lesson.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch(`/api/admin/modules/${moduleId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
    setSaving(false);
    if (res.ok) {
      toast.success(lesson ? 'Lesson updated' : 'Lesson added');
      onSaved();
    } else {
      toast.error('Failed to save lesson');
    }
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          className={`${inputCls} col-span-2`}
        />
        <select value={type} onChange={(e) => setType(e.target.value as LessonType)} className={inputCls}>
          <option value="TEXT">Text</option>
          <option value="VIDEO">Video</option>
          <option value="QUIZ">Quiz</option>
          <option value="RESOURCE">Resource</option>
        </select>
      </div>

      {type === 'TEXT' && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Lesson body (markdown supported)"
          rows={4}
          className={inputCls}
        />
      )}
      {type === 'VIDEO' && (
        <div className="grid grid-cols-3 gap-2">
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Video URL"
            className={`${inputCls} col-span-2`}
          />
          <input
            type="number"
            value={durationSec}
            onChange={(e) => setDurationSec(e.target.value)}
            placeholder="Duration (sec)"
            className={inputCls}
          />
          <input
            value={videoUrlSd}
            onChange={(e) => setVideoUrlSd(e.target.value)}
            placeholder="Low-bandwidth video URL (optional — smaller file, used in Data Saver mode)"
            className={`${inputCls} col-span-3`}
          />
        </div>
      )}
      {type === 'RESOURCE' && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            placeholder="File name"
            className={inputCls}
          />
          <input
            value={resourceUrl}
            onChange={(e) => setResourceUrl(e.target.value)}
            placeholder="File URL"
            className={inputCls}
          />
        </div>
      )}
      {type === 'QUIZ' && (
        <p className="text-xs text-muted-foreground italic">
          Save this lesson first, then use &ldquo;Edit quiz&rdquo; on the lesson row to add questions.
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} className="rounded border-border accent-primary" />
          Free preview (visible without enrollment)
        </label>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lesson row ───────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  onEdit,
  onDeleted,
  onEditQuiz,
}: {
  lesson: Lesson;
  onEdit: () => void;
  onDeleted: () => void;
  onEditQuiz: () => void;
}) {
  const Icon = LESSON_TYPE_ICON[lesson.type];
  const style = LESSON_TYPE_STYLE[lesson.type];
  const [deleting, setDeleting] = useState(false);
  const duration = formatDuration(lesson.durationSec);

  async function handleDelete() {
    if (!confirm(`Delete lesson "${lesson.title}"? This can't be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Lesson deleted');
      onDeleted();
    } else {
      toast.error('Delete failed');
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 group transition-colors">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 cursor-grab" />
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.chip}`}>
        <Icon className={`h-3.5 w-3.5 ${style.icon}`} />
      </span>
      <span className="text-sm text-foreground flex-1 truncate font-medium">{lesson.title}</span>
      {duration && <span className="text-[11px] font-mono text-muted-foreground shrink-0">{duration}</span>}
      {lesson.isPreview ? (
        <span title="Free preview"><Eye className="h-3 w-3 text-primary shrink-0" /></span>
      ) : (
        <span title="Requires enrollment"><EyeOff className="h-3 w-3 text-muted-foreground/30 shrink-0" /></span>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {lesson.type === 'QUIZ' && (
          <button onClick={onEditQuiz} className="text-[10px] px-2 py-1 rounded-md bg-secondary text-secondary-foreground font-semibold">
            {lesson.quiz ? 'Edit quiz' : 'Add questions'}
          </button>
        )}
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
          <Pencil className="h-3 w-3" />
        </button>
        <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ── Module block ─────────────────────────────────────────────────────────

function ModuleBlock({
  module: mod,
  index,
  isLast,
  onReload,
}: {
  module: CourseModule;
  index: number;
  isLast: boolean;
  onReload: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(mod.title);
  const [addingLesson, setAddingLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);

  async function saveTitle() {
    if (!title.trim() || title === mod.title) {
      setEditingTitle(false);
      return;
    }
    const res = await fetch(`/api/admin/modules/${mod.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      toast.success('Module renamed');
      onReload();
    } else {
      toast.error('Failed to rename module');
    }
    setEditingTitle(false);
  }

  async function deleteModule() {
    if (!confirm(`Delete module "${mod.title}" and all its lessons? This can't be undone.`)) return;
    const res = await fetch(`/api/admin/modules/${mod.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Module deleted');
      onReload();
    } else {
      toast.error('Delete failed');
    }
  }

  const videoCount = mod.lessons.filter((l) => l.type === 'VIDEO').length;
  const quizCount = mod.lessons.filter((l) => l.type === 'QUIZ').length;

  return (
    <div className="relative flex gap-4">
      {/* Timeline rail — modules are a real ordered sequence, so numbering carries meaning here */}
      <div className="flex flex-col items-center shrink-0 pt-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
          {index + 1}
        </span>
        {!isLast && <span className="mt-1.5 w-px flex-1 bg-border" />}
      </div>

      <div className="flex-1 min-w-0 pb-6">
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3.5 bg-muted/30">
            <button onClick={() => setExpanded((e) => !e)} className="text-muted-foreground hover:text-foreground shrink-0">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                className="flex-1 text-sm font-bold bg-background rounded-lg px-2 py-1 border border-primary/40 focus:outline-none"
              />
            ) : (
              <button onClick={() => setEditingTitle(true)} className="flex-1 min-w-0 text-left text-sm font-bold text-foreground hover:text-primary truncate">
                {mod.title}
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              {videoCount > 0 && (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-full px-2 py-0.5">
                  {videoCount} video{videoCount === 1 ? '' : 's'}
                </span>
              )}
              {quizCount > 0 && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5">
                  {quizCount} quiz{quizCount === 1 ? '' : 'zes'}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{mod.lessons.length} lesson{mod.lessons.length === 1 ? '' : 's'}</span>
            <button onClick={deleteModule} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive shrink-0">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {expanded && (
            <div className="p-3 space-y-1">
              {mod.lessons.length === 0 && !addingLesson && (
                <p className="px-3 py-4 text-xs text-muted-foreground text-center">No lessons in this module yet.</p>
              )}
              {mod.lessons.map((lesson) =>
                editingLesson?.id === lesson.id ? (
                  <LessonForm
                    key={lesson.id}
                    moduleId={mod.id}
                    lesson={lesson}
                    onSaved={() => {
                      setEditingLesson(null);
                      onReload();
                    }}
                    onCancel={() => setEditingLesson(null)}
                  />
                ) : (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    onEdit={() => setEditingLesson(lesson)}
                    onDeleted={onReload}
                    onEditQuiz={() => setQuizLesson(lesson)}
                  />
                )
              )}

              {addingLesson ? (
                <LessonForm
                  moduleId={mod.id}
                  lesson={null}
                  onSaved={() => {
                    setAddingLesson(false);
                    onReload();
                  }}
                  onCancel={() => setAddingLesson(false)}
                />
              ) : (
                <button
                  onClick={() => setAddingLesson(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 border border-dashed border-primary/30 rounded-xl px-3 py-2.5 w-full justify-center mt-1 hover:bg-primary/5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add lesson
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {quizLesson && (
        <QuizEditor
          lessonId={quizLesson.id}
          initial={quizLesson.quiz}
          onSave={onReload}
          onClose={() => setQuizLesson(null)}
        />
      )}
    </div>
  );
}

// ── Course sidebar ───────────────────────────────────────────────────────

function CourseSidebar({
  courses,
  selectedId,
  onSelect,
  moduleCounts,
}: {
  courses: CourseOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  moduleCounts: Record<string, number>;
}) {
  const [query, setQuery] = useState('');
  const filtered = courses.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="w-full lg:w-72 shrink-0">
      <div className="sticky top-4 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses…"
              className="w-full text-sm rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-xs text-muted-foreground text-center">No courses match.</p>
          ) : (
            filtered.map((c) => {
              const isActive = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-primary/15' : 'bg-muted'}`}>
                    <BookOpen className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {moduleCounts[c.id] != null && (
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{moduleCounts[c.id]}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────

export function ContentPage() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/courses?includeInactive=true');
      if (res.ok) {
        const data: CourseOption[] = await res.json();
        setCourses(data);
        if (data.length > 0) setSelectedCourseId(data[0].id);
      }
    })();
  }, []);

  const loadModules = useCallback(async () => {
    if (!selectedCourseId) return;
    setLoadingModules(true);
    const res = await fetch(`/api/admin/courses/${selectedCourseId}/modules`);
    if (res.ok) {
      const data: CourseModule[] = await res.json();
      setModules(data);
      setModuleCounts((prev) => ({ ...prev, [selectedCourseId]: data.length }));
    }
    setLoadingModules(false);
  }, [selectedCourseId]);

  useEffect(() => { loadModules(); }, [loadModules]);

  const stats = useMemo(() => {
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const totalQuizzes = modules.reduce((sum, m) => sum + m.lessons.filter((l) => l.type === 'QUIZ').length, 0);
    return { totalModules: modules.length, totalLessons, totalQuizzes };
  }, [modules]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  async function addModule() {
    if (!newModuleTitle.trim()) return;
    const res = await fetch(`/api/admin/courses/${selectedCourseId}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newModuleTitle, sortOrder: modules.length }),
    });
    if (res.ok) {
      toast.success('Module added');
      setNewModuleTitle('');
      setAddingModule(false);
      loadModules();
    } else {
      toast.error('Failed to add module');
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Course Content"
        description="Build out modules, lessons, and quizzes for each Digitika course."
      />

      <div className="flex flex-col lg:flex-row gap-6 mt-2">
        <CourseSidebar
          courses={courses}
          selectedId={selectedCourseId}
          onSelect={setSelectedCourseId}
          moduleCounts={moduleCounts}
        />

        <div className="flex-1 min-w-0">
          {!selectedCourse ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <Layers className="h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">Pick a course on the left to start building its curriculum.</p>
            </div>
          ) : (
            <>
              {/* Header + stats bar */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-foreground truncate">{selectedCourse.name}</h2>
                  <p className="text-xs text-muted-foreground">Curriculum outline</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-foreground">{stats.totalModules}</span> modules
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-foreground">{stats.totalLessons}</span> lessons
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <ListChecks className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-foreground">{stats.totalQuizzes}</span> quizzes
                  </span>
                </div>
              </div>

              {loadingModules ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/50" />
                  ))}
                </div>
              ) : modules.length === 0 && !addingModule ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">This course has no modules yet.</p>
                  <button
                    onClick={() => setAddingModule(true)}
                    className="mt-4 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" /> Add the first module
                  </button>
                </div>
              ) : (
                <div>
                  {modules.map((mod, i) => (
                    <ModuleBlock key={mod.id} module={mod} index={i} isLast={i === modules.length - 1 && !addingModule} onReload={loadModules} />
                  ))}

                  {addingModule ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3 ml-12">
                      <input
                        autoFocus
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addModule()}
                        placeholder="Module title, e.g. Module 1: Getting Started"
                        className={inputCls}
                      />
                      <button onClick={addModule} className="px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-semibold shrink-0">
                        Add
                      </button>
                      <button onClick={() => setAddingModule(false)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    modules.length > 0 && (
                      <button
                        onClick={() => setAddingModule(true)}
                        disabled={!selectedCourseId}
                        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 border border-dashed border-primary/30 rounded-2xl px-4 py-3 w-full justify-center disabled:opacity-50 hover:bg-primary/5 transition-colors ml-12"
                        style={{ width: 'calc(100% - 3rem)' }}
                      >
                        <Plus className="h-4 w-4" /> Add module
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}