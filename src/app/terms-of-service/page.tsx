import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing your use of Codevertex Africa Limited services, website, and Digitika Academy programmes.',
};

const LAST_UPDATED = '25 June 2026';

export default function TermsOfServicePage() {
  return (
    <div className="pt-20">
      <section className="bg-foreground py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white dark:text-foreground tracking-tight">
            Terms of Service
          </h1>
          <p className="text-white/60 dark:text-muted-foreground mt-3 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the website, software products, and
            Digitika Academy training programmes provided by Codevertex Africa Limited (&ldquo;Codevertex&rdquo;,
            &ldquo;we&rdquo;, &ldquo;us&rdquo;). By using our services or enrolling in a course, you agree to these Terms.
          </p>

          <h2>Enrolment &amp; eligibility</h2>
          <p>
            Course enrolment is confirmed once your application is accepted and the required payment (or first
            instalment) is received. Some courses have age ranges or prerequisites, which are stated on each
            course page and must be met.
          </p>

          <h2>Fees &amp; payment</h2>
          <ul>
            <li>Course fees are displayed in Kenyan Shillings (KES) on each course page.</li>
            <li>Where instalment plans are offered, you agree to pay each instalment by its due date.</li>
            <li>Payments are processed by third-party providers (e.g. Paystack, M-Pesa); their terms also apply.</li>
          </ul>

          <h2>Refunds &amp; cancellations</h2>
          <p>
            If a cohort is cancelled by us, you are entitled to a full refund or a transfer to a future cohort.
            Requests for refunds initiated by a learner are considered on a case-by-case basis depending on how
            much of the programme has been delivered. Contact us to discuss your situation.
          </p>

          <h2>Acceptable use</h2>
          <p>
            You agree not to misuse our services, including attempting to disrupt them, infringing intellectual
            property, or sharing course materials without authorisation. Course content, materials, and software
            remain the property of Codevertex or its licensors.
          </p>

          <h2>Certificates</h2>
          <p>
            Certificates are awarded on satisfactory completion of a programme&rsquo;s requirements. Where a course
            includes an external certification (such as ICDL or Cisco), award of that certification is subject to
            the relevant awarding body&rsquo;s rules.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            Our services are provided on a reasonable-effort basis. To the extent permitted by law, Codevertex is
            not liable for indirect or consequential losses arising from use of the website or services.
          </p>

          <h2>Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of our services after an update constitutes
            acceptance of the revised Terms.
          </p>

          <h2>Contact us</h2>
          <p>
            Questions about these Terms? Email{' '}
            <a href="mailto:codevertexitsolutions@gmail.com">codevertexitsolutions@gmail.com</a> or visit our{' '}
            <a href="/contact">contact page</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
