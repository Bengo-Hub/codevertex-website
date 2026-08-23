'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Newspaper } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/auth/authed-fetch';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  author: string;
  coverImage: string | null;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

const inputCls =
  'w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50';

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function PostForm({
  post,
  onSaved,
  onCancel,
}: {
  post: BlogPost | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [author, setAuthor] = useState(post?.author ?? 'Codevertex Team');
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? '');
  const [tags, setTags] = useState(post?.tags.join(', ') ?? '');
  const [published, setPublished] = useState(post?.published ?? false);
  const [saving, setSaving] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSave() {
    if (!title.trim() || !slug.trim() || !content.trim() || !author.trim()) {
      toast.error('Title, slug, content, and author are required');
      return;
    }
    setSaving(true);
    const body = {
      title,
      slug,
      excerpt: excerpt || undefined,
      content,
      author,
      coverImage: coverImage || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      published,
    };
    const res = post
      ? await authedFetch(`/api/admin/blog/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await authedFetch('/api/admin/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
    setSaving(false);
    if (res.ok) {
      toast.success(post ? 'Post updated' : 'Post created');
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error?.[0]?.message ?? 'Failed to save post');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{post ? 'Edit Post' : 'New Post'}</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
            <input value={title} onChange={(e) => handleTitleChange(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Slug</label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Author</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Excerpt</label>
            <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="One-line summary shown on the blog list" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Content (Markdown)</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className={`${inputCls} font-mono`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Cover image URL</label>
              <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="/images/blog/..." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tags (comma separated)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Product, Engineering" className={inputCls} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none pt-1">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded border-border" />
            Published
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save post'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authedFetch('/api/admin/blog?includeUnpublished=true');
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePublished(post: BlogPost) {
    const res = await authedFetch(`/api/admin/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !post.published }),
    });
    if (res.ok) {
      toast.success(post.published ? 'Unpublished' : 'Published');
      load();
    } else {
      toast.error('Update failed');
    }
  }

  async function handleDelete(post: BlogPost) {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    const res = await authedFetch(`/api/admin/blog/${post.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Post deleted');
      load();
    } else {
      toast.error('Delete failed');
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Blog"
        description="Posts shown on the public /blog page."
        actions={
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New post
          </button>
        }
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Title</th>
              <th className="text-left px-4 py-2.5 font-semibold">Author</th>
              <th className="text-left px-4 py-2.5 font-semibold">Tags</th>
              <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-xs">Loading…</td></tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-xs">
                  <Newspaper className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  No posts yet.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{post.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{post.author}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{post.tags.join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${post.published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => togglePublished(post)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                        title={post.published ? 'Unpublish' : 'Publish'}
                      >
                        {post.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => setEditing(post)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(post)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <PostForm
          post={editing === 'new' ? null : editing}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
