import type { Metadata } from 'next';
import { ShieldCheck, Mail, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security',
  description: 'How to report a security vulnerability to Codevertex Africa Limited.',
};

export default function SecurityPage() {
  return (
    <div className="pt-20">
      <section className="bg-foreground py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Security</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white dark:text-foreground tracking-tight">
            Vulnerability disclosure
          </h1>
          <p className="text-white/60 dark:text-muted-foreground mt-3 text-sm">
            We run security audits for our customers — here&apos;s how to report an issue with our own systems.
          </p>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary">
          <p>
            If you believe you&apos;ve found a security vulnerability in any Codevertex Africa Limited product —
            this website, the Power Suite platform, or any service under <code>*.codevertexafrica.com</code> —
            we want to hear about it before anyone else does.
          </p>

          <div className="not-prose grid sm:grid-cols-3 gap-4 my-8">
            <div className="rounded-xl border border-border bg-card p-5">
              <Mail className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-bold text-foreground mb-1">Report privately</p>
              <p className="text-xs text-muted-foreground">
                Email{' '}
                <a href="mailto:security@codevertexafrica.com" className="text-primary underline">
                  security@codevertexafrica.com
                </a>
                . Don&apos;t open a public issue or post about it before we&apos;ve responded.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <Clock className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-bold text-foreground mb-1">Response time</p>
              <p className="text-xs text-muted-foreground">
                We aim to acknowledge reports within 3 business days and keep you updated as we investigate.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <ShieldCheck className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-bold text-foreground mb-1">Good faith</p>
              <p className="text-xs text-muted-foreground">
                Testing done in good faith, without accessing or modifying data beyond what&apos;s needed to
                demonstrate the issue, won&apos;t be treated as unauthorized access on our end.
              </p>
            </div>
          </div>

          <h2>What to include</h2>
          <ul>
            <li>The product/service and URL or endpoint affected.</li>
            <li>Steps to reproduce, or a proof-of-concept.</li>
            <li>What you think the impact is (data exposure, privilege escalation, etc.).</li>
          </ul>

          <h2>What we ask you not to do</h2>
          <ul>
            <li>Don&apos;t access, modify, or delete data that isn&apos;t yours.</li>
            <li>Don&apos;t run automated scanning that could degrade service for real customers.</li>
            <li>Don&apos;t publicly disclose an issue until we&apos;ve confirmed a fix is out.</li>
          </ul>

          <h2>Machine-readable contact</h2>
          <p>
            This policy is also published at{' '}
            <a href="/.well-known/security.txt">/.well-known/security.txt</a> per{' '}
            <a href="https://www.rfc-editor.org/rfc/rfc9116" target="_blank" rel="noreferrer">
              RFC 9116
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
