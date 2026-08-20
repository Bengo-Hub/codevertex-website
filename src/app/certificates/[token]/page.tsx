import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle, Download } from 'lucide-react';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Verify Certificate | Digitika — Codevertex',
  robots: { index: false, follow: false },
};

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const cert = await prisma.certificate.findUnique({ where: { verifyToken: token } });
  const valid = Boolean(cert && !cert.revoked);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center space-y-5">
        {valid && cert ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <div>
              <h1 className="text-xl font-bold">Certificate Verified</h1>
              <p className="text-sm text-muted-foreground mt-1">
                This is a genuine Digitika Academy certificate.
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-left text-sm space-y-1.5">
              <p><span className="text-muted-foreground">Student:</span> <span className="font-medium">{cert.studentName}</span></p>
              <p><span className="text-muted-foreground">Course:</span> <span className="font-medium">{cert.courseName}</span></p>
              <p><span className="text-muted-foreground">Certificate No:</span> <span className="font-mono">{cert.certificateNumber}</span></p>
              <p><span className="text-muted-foreground">Issued:</span> {cert.issuedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <a
              href={`/api/certificates/${token}/pdf`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>
          </>
        ) : (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h1 className="text-xl font-bold">Certificate Not Found</h1>
              <p className="text-sm text-muted-foreground mt-1">
                This certificate link is invalid, expired, or has been revoked.
              </p>
            </div>
            <Link href="/digitika" className="text-primary text-sm underline underline-offset-2">
              Browse Digitika courses →
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
