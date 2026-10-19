'use client';

import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authedFetch } from '@/lib/auth/authed-fetch';

export interface AccessHolder {
  id: string;
  fullName: string;
  email: string;
  ssoUserId?: string | null;
  guardianName?: string | null;
  guardianEmail?: string | null;
  guardianSsoUserId?: string | null;
}

/**
 * Sends a learner's or parent's portal credentials again. The server issues a new temporary
 * password and the notice goes out by email and WhatsApp. It only works until the person has
 * replaced the first password.
 */
export function ResendAccessDialog({ student, onClose }: { student: AccessHolder; onClose: () => void }) {
  const [busy, setBusy] = useState<'student' | 'parent' | null>(null);
  const hasStudent = !!student.ssoUserId && !!student.email && !student.email.endsWith('.invalid');
  const hasParent = !!student.guardianSsoUserId && !!student.guardianEmail;

  async function resend(who: 'student' | 'parent') {
    setBusy(who);
    const res = await authedFetch(`/api/admin/students/${encodeURIComponent(student.id)}/resend-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ who }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) {
      toast.success('Access sent by email and WhatsApp');
      onClose();
    } else {
      toast.error(typeof body?.error === 'string' ? body.error : 'Could not resend access');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-sm font-bold text-foreground">Resend portal access</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Issues a new temporary password and sends it again. It only works while the person has not yet chosen their own password.
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-2">
          <Button className="w-full justify-between" variant="outline" disabled={!hasStudent || busy !== null} onClick={() => resend('student')}>
            <span>{student.fullName}</span>
            <span className="text-xs text-muted-foreground">{hasStudent ? student.email : 'No student account'}</span>
          </Button>
          <Button className="w-full justify-between" variant="outline" disabled={!hasParent || busy !== null} onClick={() => resend('parent')}>
            <span>{student.guardianName || 'Parent or guardian'}</span>
            <span className="text-xs text-muted-foreground">{hasParent ? student.guardianEmail : 'No parent account'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
