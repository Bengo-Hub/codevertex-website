// A plain-language fact-check of a platform roadmap review someone did against this site,
// checked against what's actually true across the wider Codevertex platform. Written for
// anyone curious about the story, not as an engineering changelog.

export type FindingStatus = 'missing' | 'partial' | 'ok' | 'outrepo' | 'bizdep';

export const STATUS_LABEL: Record<FindingStatus, string> = {
  missing: 'Still a real gap',
  partial: 'More going on than it looks',
  ok: 'Already sorted',
  outrepo: 'Lives somewhere else',
  bizdep: 'Not really ours to decide',
};

export interface Finding {
  num: string;
  title: string;
  why: string;
  entries: { status: FindingStatus; body: string[] }[];
}

export interface AuditSection {
  id: string;
  number: string;
  title: string;
  note: string;
  findings: Finding[];
}

export const OVERVIEW_STATS = [
  { n: '23', label: 'gaps that were genuinely real', tone: 'default' as const },
  { n: '7', label: 'more nuanced than they first looked', tone: 'partial' as const },
  { n: '6', label: 'already built — just needed wiring up', tone: 'ok' as const },
  { n: '2', label: 'belong to a different part of the platform', tone: 'outrepo' as const },
];

export const AUDIT_SECTIONS: AuditSection[] = [
  {
    id: 's1',
    number: '01',
    title: 'Digitika Academy',
    note: 'Fair to call this the highest-leverage area to fix — but "just a checkout page" undersells what\'s already there.',
    findings: [
      {
        num: '1.1', title: 'Actual course content', why: 'video lessons, quizzes, downloadable material',
        entries: [{ status: 'missing', body: [
          'This one\'s right. There\'s no lesson or quiz model anywhere — the course pages are marketing copy about what you\'ll learn, not a place to actually learn it. A student who pays today lands on a success page and a portal link with nothing behind it yet.',
        ] }],
      },
      {
        num: '1.2', title: 'Progress tracking', why: 'how far along is each student, per course',
        entries: [{ status: 'missing', body: [
          "Also right, and it can't really be built before the content itself exists — there's nothing yet to measure progress against.",
        ] }],
      },
      {
        num: '1.3', title: 'Certificates you can verify', why: 'the whole point of a certification programme',
        entries: [{ status: 'partial', body: [
          "This is really two different problems wearing one name. For courses Digitika teaches and grades itself, yes — there's no certificate system, just a sample PDF sitting in the marketing assets.",
          "But for the ICDL and Cisco tracks, Codevertex was never going to be the one issuing those certificates anyway — ICDL Foundation and Cisco's own Networking Academy do that, after their own exams. What's actually missing there is a much smaller thing: somewhere to record that a student passed and link to their real certificate, not a system that manufactures one.",
        ] }],
      },
      {
        num: '1.4', title: 'Cohort scheduling', why: 'so admins can run and expose intake batches',
        entries: [{ status: 'partial', body: [
          'This one\'s already further along than it looked — cohorts exist, admins manage them, and students already pick one when they enrol. What\'s genuinely missing is the next layer: tracking who showed up to which live session once they\'re already enrolled.',
        ] }],
      },
      {
        num: '1.5', title: 'A place for students to ask questions', why: 'keeps people engaged, takes load off support',
        entries: [{ status: 'missing', body: ["Nothing here at all — no forum, no course-level Q&A."] }],
      },
      {
        num: '1.6', title: 'Somewhere for instructors to work', why: 'grading, announcements, that kind of thing',
        entries: [{ status: 'missing', body: [
          'Also missing, and it shows up even in the permissions system — there\'s no instructor role defined anywhere yet, just staff and admin.',
        ] }],
      },
      {
        num: '1.7', title: 'A lighter video player for low-bandwidth users', why: 'a lot of students are on constrained data plans',
        entries: [{ status: 'missing', body: ["Moot until there's actual video to play — this naturally comes after 1.1, not before it."] }],
      },
      {
        num: '1.8', title: 'Reminding students about payments by SMS, not just email', why: 'a lot of people miss email but never miss a text',
        entries: [{ status: 'ok', body: [
          "Turns out the SMS side was basically already built — the notification system the whole platform shares already knows how to send SMS in Kenya. The site just never asked it to. That's fixed now: reminders go out by SMS and email together.",
        ] }],
      },
      {
        num: '1.9', title: 'A referral programme', why: 'cheap way to grow when people vouch for you',
        entries: [{ status: 'missing', body: [
          '"How did you hear about us" has a Referral option in the dropdown and that\'s it — no codes, no tracking, no reward. There\'s a general discount-code system already in place that this could probably grow out of rather than starting from nothing.',
        ] }],
      },
      {
        num: '1.10', title: 'A jobs board for alumni', why: 'turn "we\'ve trained 200+ people" into something graduates can actually use',
        entries: [
          { status: 'ok', body: [
            "Half of this was easier than expected — Codevertex already runs a full careers/hiring system for itself elsewhere on the platform, so the site's own careers page now pulls from that instead of a fixed list someone has to update by hand.",
          ] },
          { status: 'bizdep', body: [
            "The other half — showing jobs from partner companies — assumes those companies are running their hiring through the platform too. We checked the real records: none of the usual training partners named in this idea actually are, today. So this isn't something to build yet; it's a conversation to have with those partners first.",
          ] },
        ],
      },
    ],
  },
  {
    id: 's2',
    number: '02',
    title: 'Vera, the AI assistant',
    note: "The chatbot doesn't actually live in this codebase at all — it's a separate service the site just embeds. A few of these findings were really pointed at the wrong address.",
    findings: [
      {
        num: '2.1', title: 'Rate limiting on the chat endpoint', why: 'an open door to a paid AI API is an expensive thing to leave unlocked',
        entries: [{ status: 'outrepo', body: [
          "There's no chat endpoint here to rate-limit — the widget on the site talks straight to a separate AI service. Wherever that lives is where this belongs, and the rate-limiting tools to do it already exist and are used elsewhere on the platform.",
        ] }],
      },
      {
        num: '2.2', title: 'Grounding answers in the real course catalog', why: 'so Vera doesn\'t make things up about what\'s in a course',
        entries: [{ status: 'outrepo', body: ["Same story — this would live in the AI service itself, not here. Not something this pass looked into."] }],
      },
      {
        num: '2.3', title: 'Scoring how promising a lead is', why: 'so the sales team knows who to call first',
        entries: [{ status: 'missing', body: ["At least on this site, a lead is just \"new\" or not — there's no scoring at all."] }],
      },
      {
        num: '2.4', title: 'Talking to Vera over WhatsApp', why: "WhatsApp reaches more people here than a web widget ever will",
        entries: [{ status: 'partial', body: [
          "Right now it's just a click-to-chat link, nothing conversational. Interestingly, the platform's notification system already knows how to send WhatsApp messages — just not this kind of back-and-forth conversation, so it's not a direct fix, but it's a useful head start.",
        ] }],
      },
      {
        num: '2.5', title: 'Understanding Swahili and Sheng', why: 'a real differentiator for a Kenyan audience',
        entries: [{ status: 'missing', body: ["Genuinely new work, and it belongs in the AI service, not here."] }],
      },
    ],
  },
  {
    id: 's3',
    number: '03',
    title: 'Trust and security',
    note: 'One thing in this section mattered more than everything else combined — see below.',
    findings: [
      {
        num: '3.1', title: 'Making sure only admins can reach admin endpoints', why: "the basic promise of an admin panel",
        entries: [{ status: 'ok', body: [
          "This was real, and more widespread than a single endpoint — a handful of admin routes weren't actually checking who was calling them. It's fixed now, using the same permission check the properly-guarded routes already had. Not going into more detail than that here, on purpose.",
        ] }],
      },
      {
        num: '3.2', title: 'A record of who changed what in the admin area', why: "matters once more than one person has admin access",
        entries: [{ status: 'partial', body: [
          "Depends which part of the platform you're asking about — some services already keep a full record of admin actions, others have the storage built but nothing is writing to it yet. Not a blanket yes or no.",
        ] }],
      },
      {
        num: '3.3', title: 'A cookie banner and a proper data-protection page', why: 'the site says "GDPR-aware" without much to back it up',
        entries: [{ status: 'missing', body: [
          "No cookie banner anywhere. The privacy policy covers similar ground to GDPR but never actually mentions Kenya's own Data Protection Act, which is the law that actually applies here.",
        ] }],
      },
      {
        num: '3.4', title: 'Two-factor login for admins', why: 'the natural next layer once access control is solid',
        entries: [{ status: 'ok', body: [
          "This already exists platform-wide — proper 2FA, backup codes, all of it. It's really just a question of whether it's switched on for this site's admin accounts specifically, which is a settings change, not something to build.",
        ] }],
      },
      {
        num: '3.5', title: 'A public status page', why: 'enterprise buyers tend to expect one',
        entries: [{ status: 'missing', body: ["Doesn't exist yet. Real, but not urgent."] }],
      },
      {
        num: '3.6', title: 'A security contact / disclosure page', why: 'feels odd to sell security audits without one',
        entries: [{ status: 'missing', body: ["Fair point, and an easy one to add whenever it's prioritised."] }],
      },
    ],
  },
  {
    id: 's4',
    number: '04',
    title: 'For bigger customers',
    note: "The big one here: the developer-docs site this section was asking for basically already exists — just not on this domain.",
    findings: [
      {
        num: '4.1', title: 'Case studies with real numbers', why: '"200+ trained" reads as a claim until there\'s proof behind it',
        entries: [{ status: 'missing', body: ["Genuinely missing — the closest thing is a placeholder blog post with no real detail page behind it."] }],
      },
      {
        num: '4.2', title: 'Somewhere to try the product before buying', why: 'shortens the sales conversation',
        entries: [{ status: 'partial', body: [
          "Nothing built for prospects specifically, but there's already a demo environment used internally for testing that could reasonably become that — worth a conversation before building something new from zero.",
        ] }],
      },
      {
        num: '4.3', title: 'A pricing page people can actually trust', why: 'so the numbers scale without someone updating a spreadsheet',
        entries: [{ status: 'ok', body: [
          'This was true when the review was written — the pricing page was a fixed list of numbers with no connection to what customers are actually charged. It\'s live now: the page pulls real, current prices straight from the platform\'s own billing system.',
        ] }],
      },
      {
        num: '4.4', title: 'A dashboard showing customers their own usage', why: 'makes the "one login for everything" pitch stickier',
        entries: [{ status: 'missing', body: ["Doesn't exist. Real gap, lower priority than the others in this section."] }],
      },
      {
        num: '4.5', title: 'Developer documentation', why: 'if this is a platform, developers need docs, not just a login screen',
        entries: [{ status: 'ok', body: [
          "This didn't need to be built here at all — a real developer-docs site already exists elsewhere in the platform, this site already links to it, and it just needed a couple more services documented properly. That's done now.",
        ] }],
      },
    ],
  },
  {
    id: 's5',
    number: '05',
    title: 'The unglamorous infrastructure stuff',
    note: 'Every item in this section was exactly as described — sometimes a little worse.',
    findings: [
      {
        num: '5.1', title: 'sitemap.xml and robots.txt', why: 'basic search-engine hygiene',
        entries: [{ status: 'missing', body: ["Neither exists. Quick to add, real impact on how the site gets found."] }],
      },
      {
        num: '5.2', title: 'Structured data for search results', why: 'the difference between a plain blue link and a rich Google result',
        entries: [{ status: 'missing', body: ["Not present anywhere on the site."] }],
      },
      {
        num: '5.3', title: 'Smaller image files', why: 'big images are slow on the mobile connections most visitors actually use',
        entries: [{ status: 'missing', body: ["About 11MB spread across 63 images — confirmed, worth a proper pass."] }],
      },
      {
        num: '5.4', title: 'Checks before anything ships', why: 'catching a broken build before it reaches customers, not after',
        entries: [{ status: 'missing', body: [
          "Worse than expected, honestly — the deploy pipeline runs a security scan on the container, but nothing checks the actual code (no lint, no type-check, no tests) before it goes live.",
        ] }],
      },
      {
        num: '5.5', title: 'Automated tests', why: 'especially anywhere near payments',
        entries: [{ status: 'missing', body: ["There genuinely aren't any yet, on a site that handles real payment flows."] }],
      },
      {
        num: '5.6', title: 'Knowing when something breaks in production', why: 'rather than finding out from a customer',
        entries: [{ status: 'missing', body: ["The error-monitoring piece is a stub — it keeps a couple of background jobs alive, nothing more."] }],
      },
      {
        num: '5.7', title: 'A ready-made environment file for new contributors', why: 'the docs already tell people to copy one that doesn\'t exist',
        entries: [{ status: 'missing', body: ["Confirmed missing — a small, easy fix for anyone joining the project."] }],
      },
    ],
  },
  {
    id: 's6',
    number: '06',
    title: 'Growth and community',
    note: 'One item here is a much smaller job than it sounds.',
    findings: [
      {
        num: '6.1', title: 'A real blog', why: 'content is what actually drives organic traffic',
        entries: [{ status: 'partial', body: [
          "Better news than it looks — there's already a proper database model for blog posts, it's just not connected to the page yet, which is showing a fixed list of six posts. This is a wiring job, not a from-scratch build.",
        ] }],
      },
      {
        num: '6.2', title: 'A page for upcoming events', why: 'turn a one-off hackathon into something recurring',
        entries: [{ status: 'missing', body: [
          "There's plenty of proof a past hackathon happened — photos, mentions across the site — but nothing letting someone see or sign up for the next one.",
        ] }],
      },
      {
        num: '6.3', title: 'Showcasing what students have built', why: 'reinforces the whole talent-pipeline story',
        entries: [{ status: 'missing', body: ["Wasn't looked into deeply this time, but nothing turned up — likely a real gap."] }],
      },
      {
        num: '6.4', title: 'A newsletter signup', why: 'a cheap way to stay in front of people who aren\'t ready to buy yet',
        entries: [{ status: 'missing', body: ["Doesn't exist anywhere on the site."] }],
      },
    ],
  },
];
