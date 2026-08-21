'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, ShieldOff, ShieldCheck, ExternalLink, Award } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { toast } from 'sonner';

interface Certificate {
  id: string;
  certificateNumber: string;
  verifyToken: string;
  studentName: string;
  courseName: string;
  courseId: string;
  issuedAt: string;
  revoked: boolean;
}

export function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ includeRevoked: String(includeRevoked) });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/certificates?${params}`);
    if (res.ok) setCertificates(await res.json());
    setLoading(false);
  }, [search, includeRevoked]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  async function toggleRevoke(cert: Certificate) {
    setBusyId(cert.id);
    const res = await fetch(`/api/admin/certificates/${cert.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revoked: !cert.revoked }),
    });
    if (res.ok) {
      toast.success(cert.revoked ? 'Certificate reinstated' : 'Certificate revoked');
      load();
    } else {
      toast.error('Update failed');
    }
    setBusyId(null);
  }

  return (
    <div>
      <AdminPageHeader
        title="Certificates"
        description="Every certificate issued to a Digitika graduate — search, verify, or revoke."
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, course, or certificate number"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeRevoked}
            onChange={(e) => setIncludeRevoked(e.target.checked)}
            className="rounded border-border"
          />
          Show revoked
        </label>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Student</th>
              <th className="text-left px-4 py-2.5 font-semibold">Course</th>
              <th className="text-left px-4 py-2.5 font-semibold">Certificate #</th>
              <th className="text-left px-4 py-2.5 font-semibold">Issued</th>
              <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-xs">
                  Loading…
                </td>
              </tr>
            ) : certificates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-xs">
                  <Award className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  No certificates found.
                </td>
              </tr>
            ) : (
              certificates.map((cert) => (
                <tr key={cert.id} className={cert.revoked ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-medium text-foreground">{cert.studentName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cert.courseName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cert.certificateNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(cert.issuedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        cert.revoked ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {cert.revoked ? 'Revoked' : 'Valid'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/certificates/${cert.verifyToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="View public certificate"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => toggleRevoke(cert)}
                        disabled={busyId === cert.id}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        title={cert.revoked ? 'Reinstate' : 'Revoke'}
                      >
                        {cert.revoked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
