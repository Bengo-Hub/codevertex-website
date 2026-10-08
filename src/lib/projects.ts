// Shared helpers for the projects/events gallery (admin API + public pages).

// Photo bytes are never selected for lists — only id/caption/order. The browser loads
// each image itself from /api/projects/photos/[id].
export const photoSelect = { id: true, caption: true, sortOrder: true } as const;

export function serializeEvent<T extends { id: bigint; photos?: { id: bigint }[] }>(e: T) {
  return { ...e, id: e.id.toString(), photos: (e.photos ?? []).map((p) => ({ ...p, id: p.id.toString() })) };
}

export const photoUrl = (photoId: string | bigint) => `/api/projects/photos/${photoId.toString()}`;

export function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
