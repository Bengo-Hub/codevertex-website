import { Fragment } from 'react';

// Tiny inline-markdown renderer for **bold** and `code` spans in static copy —
// avoids dangerouslySetInnerHTML for the handful of emphasis/code marks used
// in the platform-audit content.
export function renderInlineMd(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.86em] break-words">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
