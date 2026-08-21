import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Codevertex Africa Limited collects, uses, and protects your personal data.',
};

const LAST_UPDATED = '20 August 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-20">
      <section className="bg-foreground py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white dark:text-foreground tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-white/60 dark:text-muted-foreground mt-3 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary">
          <p>
            Codevertex Africa Limited (&ldquo;Codevertex&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy and is
            committed to protecting the personal data you share with us through this website, our Digitika
            Academy programmes, and our software products. This policy explains what we collect, why, and the
            choices you have.
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li><strong>Information you provide</strong> — your name, email, phone number, date of birth, and
              related details when you contact us, enrol in a course, or request a service.</li>
            <li><strong>Payment information</strong> — enrolment and billing details are processed by our
              payment partners (e.g. Paystack and M-Pesa). We do not store full card details on our servers.</li>
            <li><strong>Usage information</strong> — basic technical data such as pages visited and device type,
              collected to keep the site secure and improve it.</li>
          </ul>

          <h2>How we use your information</h2>
          <ul>
            <li>To process course enrolments, payments, and certifications.</li>
            <li>To respond to enquiries and provide customer support.</li>
            <li>To send you information about your enrolment and, where you have opted in, relevant updates.</li>
            <li>To meet our legal, accounting, and regulatory obligations.</li>
          </ul>

          <h2>Sharing your information</h2>
          <p>
            We do not sell your personal data. We share it only with service providers who help us operate
            (such as payment processors and communication providers), and where required by law. These parties
            are permitted to use your data only to perform services on our behalf.
          </p>

          <h2>Data retention &amp; security</h2>
          <p>
            We keep personal data only for as long as necessary for the purposes described above or as required
            by law, and we apply appropriate technical and organisational measures to protect it.
          </p>

          <h2>Your rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data, and you may withdraw
            consent to marketing communications at any time. To exercise these rights, contact us using the
            details below.
          </p>

          <h2>Kenya Data Protection Act, 2019</h2>
          <p>
            As a data controller and processor operating in Kenya, Codevertex Africa Limited processes personal
            data in accordance with the Kenya Data Protection Act, 2019 and the regulations issued under it. In
            addition to the rights described above, this means you may:
          </p>
          <ul>
            <li>request confirmation of whether we hold personal data about you, and obtain a copy of it;</li>
            <li>object to processing that is not based on your consent or another lawful basis;</li>
            <li>lodge a complaint with the Office of the Data Protection Commissioner (ODPC) if you believe
              your data has been mishandled.</li>
          </ul>
          <p>
            We rely on consent, contractual necessity (e.g. enrolling you in a course or delivering a service
            you requested), and legal obligation as our lawful bases for processing, depending on the activity.
          </p>

          <h2>Cookies</h2>
          <p>
            We use a small number of cookies: strictly necessary cookies that keep the site and admin panel
            working (e.g. session state), and optional analytics cookies that help us understand how the site
            is used. On your first visit, a cookie banner lets you accept or decline the optional cookies —
            strictly necessary cookies cannot be disabled, as the site cannot function without them. You can
            change your choice at any time via the &ldquo;Cookie settings&rdquo; link in the site footer.
          </p>

          <h2>Contact us</h2>
          <p>
            For any privacy questions or requests, email{' '}
            <a href="mailto:codevertexitsolutions@gmail.com">codevertexitsolutions@gmail.com</a> or reach us via
            our <a href="/contact">contact page</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
