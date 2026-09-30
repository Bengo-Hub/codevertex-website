// Content for /careers/attachment. Edit this file to change tracks, steps or FAQs
// without touching the page layout.

export type TrackGroup = 'Engineering' | 'Design, data & content' | 'Business & operations';

export interface AttachmentTrack {
  id: string;
  title: string;
  group: TrackGroup;
  forStudents: string;
  tasks: string;
  deliverable: string;
}

export const ATTACHMENT_TRACKS: AttachmentTrack[] = [
  // Engineering
  { id: 'frontend', group: 'Engineering', title: 'Frontend developer',
    forStudents: 'Computer Science, IT, Software Engineering',
    tasks: 'Build pages and components in Next.js and Tailwind, fix accessibility issues and improve page speed.',
    deliverable: 'Shipped pages with before and after Lighthouse scores' },
  { id: 'backend', group: 'Engineering', title: 'Backend developer',
    forStudents: 'Computer Science, IT, Software Engineering',
    tasks: 'Write API routes with validation, work with PostgreSQL and Prisma, and add rate limiting.',
    deliverable: 'Documented and tested API endpoints' },
  { id: 'payments', group: 'Engineering', title: 'Payments & integrations developer',
    forStudents: 'Computer Science, IT, Business IT',
    tasks: 'Work on M-Pesa and Paystack flows, webhooks, receipts and reconciliation.',
    deliverable: 'Payment test suite and a flow diagram' },
  { id: 'mobile', group: 'Engineering', title: 'Mobile app developer',
    forStudents: 'Computer Science, IT, Software Engineering',
    tasks: 'Build Android and iOS features in React Native or Flutter, connect APIs and test on real devices.',
    deliverable: 'A working app feature on a test build, with a demo' },
  { id: 'qa', group: 'Engineering', title: 'QA & test automation',
    forStudents: 'Any IT or Computer Science programme',
    tasks: 'Write automated tests, run manual test cycles and log bugs clearly.',
    deliverable: 'A test suite running in CI and a test plan' },
  { id: 'devops', group: 'Engineering', title: 'DevOps & cloud',
    forStudents: 'Computer Science, IT, Networking',
    tasks: 'Work with Docker, GitHub Actions, monitoring, backups and restore drills.',
    deliverable: 'A working pipeline and a runbook' },
  { id: 'security', group: 'Engineering', title: 'Cybersecurity',
    forStudents: 'Cybersecurity, Computer Security, IT',
    tasks: 'Review web forms and APIs against the OWASP Top 10, audit dependencies and harden headers.',
    deliverable: 'A written security assessment with fixes tracked' },
  { id: 'network-iot', group: 'Engineering', title: 'Network, IoT & hardware technician',
    forStudents: 'Electrical and Electronic Engineering, Telecommunications, Networking, IT',
    tasks: 'Router provisioning, camera and sensor integration, site surveys and hardware support.',
    deliverable: 'A network diagram and a site installation checklist' },
  // Design, data & content
  { id: 'design', group: 'Design, data & content', title: 'UI/UX & graphic design',
    forStudents: 'Design, Multimedia, Computer Science',
    tasks: 'Design Figma prototypes, run usability tests and produce social and brand graphics.',
    deliverable: 'A Figma file and a tested prototype' },
  { id: 'data-ai', group: 'Design, data & content', title: 'Data & AI',
    forStudents: 'Data Science, Statistics, Computer Science',
    tasks: 'Evaluate chatbot answers, build analytics dashboards and produce funnel reports.',
    deliverable: 'An evaluation report and a dashboard' },
  { id: 'writer', group: 'Design, data & content', title: 'Technical writer',
    forStudents: 'Communication, IT, Journalism',
    tasks: 'Update documentation, write API guides and user tutorials, and edit blog posts.',
    deliverable: 'A refreshed documentation set' },
  { id: 'marketing', group: 'Design, data & content', title: 'Digital marketing & SEO',
    forStudents: 'Marketing, Communication, Business',
    tasks: 'Keyword research, blog content, email campaigns, social media and analytics reporting.',
    deliverable: 'A content calendar and a monthly performance report' },
  { id: 'learning', group: 'Design, data & content', title: 'Digitika learning support',
    forStudents: 'Education, IT, or any subject expert',
    tasks: 'Support live classes, prepare course material, mark assignments and answer student queries.',
    deliverable: 'One course module built or improved' },
  // Business & operations
  { id: 'support', group: 'Business & operations', title: 'Customer support & success',
    forStudents: 'Business, IT, Communication',
    tasks: 'Handle chat and email queries, run onboarding calls and write FAQ answers.',
    deliverable: 'An FAQ and a support playbook' },
  { id: 'bizdev', group: 'Business & operations', title: 'Business development & sales',
    forStudents: 'Business, Marketing, Commerce',
    tasks: 'Lead research, proposal drafts, demo scheduling and outreach to schools and SMEs.',
    deliverable: 'A qualified lead list and a pipeline report' },
  { id: 'finance', group: 'Business & operations', title: 'Finance & accounting',
    forStudents: 'Accounting, Finance, Commerce',
    tasks: 'Test the books and treasury modules with real scenarios and document the workflows.',
    deliverable: 'Test scenarios and a user guide' },
  { id: 'analyst', group: 'Business & operations', title: 'Project & business analyst',
    forStudents: 'Business IT, Information Systems, Project Management',
    tasks: 'Write user stories, run sprint meetings, track tasks and gather requirements.',
    deliverable: 'A requirements pack and a sprint report' },
];

export const TRACK_GROUPS: TrackGroup[] = ['Engineering', 'Design, data & content', 'Business & operations'];

export const ATTACHMENT_STEPS = [
  { title: 'Apply', text: 'Fill in the short form below with your course, dates and the track you want.' },
  { title: 'Short chat', text: 'We review applications on a rolling basis and invite shortlisted students for a short conversation.' },
  { title: 'Placement', text: 'You start with a named mentor, weekly goals and real project work on a staging environment.' },
  { title: 'Demo & sign-off', text: 'You present your work, and we complete your logbook and your institution\'s assessment form.' },
];

export const ATTACHMENT_BENEFITS = [
  'A named mentor and a weekly goal',
  'Real projects, on staging systems with no access to customer data',
  'Logbook sign-off and your institution\'s supervisor assessment form',
  'A certificate of completion',
  'A place in our talent pool for future openings',
];

export const ATTACHMENT_FAQ = [
  { q: 'Who can apply?',
    a: 'Students at universities, colleges and TVET institutions who need an industrial attachment or internship, and recent graduates looking for experience.' },
  { q: 'How long is the placement?',
    a: 'Usually 8 to 12 weeks. If your institution requires a different length, tell us in the application and we will plan around it.' },
  { q: 'Do I need an introduction letter?',
    a: 'Yes. Once we accept you, we will ask for the introduction letter from your institution. You do not need it to apply.' },
  { q: 'Is the placement paid?',
    a: 'Any stipend or allowance depends on the track and the intake, and we confirm it in writing with your offer. Feel free to ask during your chat with us.' },
  { q: 'Can I work remotely?',
    a: 'Most placements are at Pioneer House in Kisumu. Some tracks can be hybrid, so mention your preference in your note.' },
];

export const ATTACHMENT_SERVICE_LABEL = 'Attachment Application';

export const YEAR_OPTIONS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5 or above', 'Recent graduate'];
export const DURATION_OPTIONS = ['8 weeks', '10 weeks', '12 weeks', '16 weeks', 'Other (explain in note)'];

export interface AttachmentApplication {
  institution: string;
  course: string;
  year: string;
  trackId: string;
  startDate: string;
  duration: string;
  link?: string;
  note?: string;
}

// The application is saved through the existing /api/contact endpoint (no new tables), so
// every detail goes into the message body, one per line, where admins can read it.
export function buildAttachmentMessage(a: AttachmentApplication): string {
  const track = ATTACHMENT_TRACKS.find((t) => t.id === a.trackId)?.title ?? a.trackId;
  return [
    'ATTACHMENT APPLICATION',
    `Institution: ${a.institution}`,
    `Course / programme: ${a.course}`,
    `Year of study: ${a.year}`,
    `Preferred track: ${track}`,
    `Placement start: ${a.startDate}`,
    `Duration: ${a.duration}`,
    `CV / GitHub / portfolio link: ${a.link?.trim() || 'Not provided'}`,
    `Note: ${a.note?.trim() || 'None'}`,
  ].join('\n');
}
