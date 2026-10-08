/**
 * Digitika Academy: course seed data (initial catalog).
 *
 * The DATABASE is the source of truth for course content; admins edit it from
 * /admin/courses. This file only seeds rows: prisma/seed.ts creates missing courses,
 * applies an entry over an existing row ONLY when the entry's seedVersion is higher than
 * the row's metadata._seedVersion, and otherwise just backfills missing metadata keys.
 * To push a one-time content revision for a course, edit its entry here AND bump its
 * seedVersion; otherwise admin edits are preserved.
 *
 * This file must stay self-contained (no imports from src/): the production image
 * only ships the prisma/ folder for the seed step (see Dockerfile).
 *
 * Cover images: /public/images/courses/*.jpg (real photos, Unsplash License, or our own)
 */

// ---------------------------------------------------------------------------
// Shared shapes (mirror src/types/course.ts; duplicated on purpose, see above)
// ---------------------------------------------------------------------------
interface InstallmentPlan {
  label: string;
  payments: { amount: number; label: string }[];
  totalAmount: number;
  badge?: string;
}

interface WeeklyModule {
  week: number | string;
  title: string;
  topics: string[];
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
}

// --- Installment plan factory ---
// Generates upfront + 2-installment + 3-installment options for a given course price.
// weekLabels: [midpointLabel, finalLabel] — defaults to 'Midway' and 'Final week'.
function makeInstallmentPlans(
  price: number,
  weekLabels: [string, string] = ['Midway', 'Final week']
): InstallmentPlan[] {
  // 2 installments: 60% / 40% rounded to nearest 500
  const p2_1 = Math.round((price * 0.6) / 500) * 500;
  const p2_2 = price - p2_1;

  // 3 installments: 40% / 33% / 27% rounded to nearest 500
  const p3_1 = Math.round((price * 0.4) / 500) * 500;
  const p3_2 = Math.round((price * 0.33) / 500) * 500;
  const p3_3 = price - p3_1 - p3_2;

  const plans: InstallmentPlan[] = [
    {
      label: 'Upfront',
      payments: [{ amount: price, label: 'Full payment' }],
      totalAmount: price,
    },
    {
      label: '2 Installments',
      payments: [
        { amount: p2_1, label: 'At enrollment' },
        { amount: p2_2, label: weekLabels[0] },
      ],
      totalAmount: price,
      badge: 'Popular',
    },
  ];

  // Only offer 3-installment plan when third installment is meaningful (≥ 1,000 KES)
  if (p3_3 >= 1000) {
    plans.push({
      label: '3 Installments',
      payments: [
        { amount: p3_1, label: 'At enrollment' },
        { amount: p3_2, label: weekLabels[0] },
        { amount: p3_3, label: weekLabels[1] },
      ],
      totalAmount: price,
    });
  }

  return plans;
}

// --- Code-Starter curriculum ---
const CODE_STARTER_CURRICULUM: WeeklyModule[] = [
  { week: 1, title: 'Developer Setup & Git Mastery', topics: ['Dev environment setup', 'Git init, commit, push, pull', 'GitHub account & first repo', 'Command line basics'] },
  { week: 2, title: 'Web Foundations — HTML & CSS', topics: ['HTML5 semantics', 'CSS box model & layouts', 'Flexbox & responsive design', 'Build: personal profile page'] },
  { week: 3, title: 'CSS Frameworks', topics: ['Bootstrap 5 grid system', 'Tailwind CSS utility-first approach', 'Responsive breakpoints', 'Build: redesign with framework'] },
  { week: 4, title: 'Portfolio Project Week', topics: ['Multi-page portfolio site', 'GitHub Pages deployment', 'Code review session', 'ICDL Module 1 prep'] },
  { week: 5, title: 'Python Foundations', topics: ['Variables, data types, loops', 'Functions & modules', 'File I/O', 'Build: text-based quiz game'] },
  { week: 6, title: 'Python Applications', topics: ['Data structures (lists, dicts)', 'APIs with requests', 'Automation scripts', 'Build: weather CLI tool'] },
  { week: 7, title: 'JavaScript & DOM', topics: ['JS syntax & ES6+', 'DOM manipulation', 'Event listeners', 'Build: interactive to-do app'] },
  { week: 8, title: 'AI Tools & Prompt Engineering', topics: ['ChatGPT & Claude for developers', 'Prompt engineering patterns', 'AI-assisted coding workflow', 'Code review with AI'] },
  { week: 9, title: 'Capstone Project', topics: ['Full project brief', 'Plan, build, debug', 'Peer code review', 'Deploy to GitHub Pages / Heroku'] },
  { week: 10, title: 'ICDL Exams & Graduation', topics: ['ICDL Core Module exam', 'ICDL Advanced revision', 'Portfolio presentations', 'Alumni network onboarding & career roadmap'] },
];

// Code-Starter uses hand-crafted installments with specific week labels
const CODE_STARTER_INSTALLMENTS: InstallmentPlan[] = [
  {
    label: 'Upfront',
    payments: [{ amount: 30000, label: 'Full payment' }],
    totalAmount: 30000,
  },
  {
    label: '2 Installments',
    payments: [
      { amount: 18000, label: 'Week 1 (enroll)' },
      { amount: 12000, label: 'Week 6' },
    ],
    totalAmount: 30000,
    badge: 'Popular',
  },
  {
    label: '3 Installments',
    payments: [
      { amount: 12000, label: 'Week 1 (enroll)' },
      { amount: 10000, label: 'Week 4' },
      { amount: 8000, label: 'Week 7' },
    ],
    totalAmount: 30000,
  },
];

const CODE_STARTER_TESTIMONIALS: Testimonial[] = [
  {
    name: 'Ryan Mwakala',
    role: 'ICT Manager',
    company: 'Danka Africa',
    quote: "The Code-Starter programme gave me the practical skills I needed to transition into tech. Within 6 months of graduating I landed my first ICT management role.",
  },
  {
    name: 'Brandon Odhiambo',
    role: 'Software Developer',
    company: 'Boxcraft',
    quote: "I came in knowing nothing about coding. The curriculum is intense but the instructors make it digestible. I'm now writing production code every day.",
  },
  {
    name: 'Christine Kerubo',
    role: 'CS Tutor & Graduate',
    company: 'Maseno University',
    quote: "As a CS student I thought I knew enough. This programme showed me what real-world software engineering looks like. The Git and Linux modules alone were worth it.",
  },
  {
    name: 'Tricia Adhiambo',
    role: 'Emerging Tech Talent',
    company: 'Maseno University',
    quote: "The hybrid format was perfect for me — I could attend Zoom sessions when I couldn't make it in person. The community of learners keeps you accountable.",
  },
];

// ---------------------------------------------------------------------------
// Course data type
// ---------------------------------------------------------------------------
export interface CourseSeed {
  id: string;
  categoryId: string;
  name: string;
  shortName?: string | null;
  slug: string;
  duration: string;
  mode: string;
  price: number;
  currency: string;
  description: string;
  longDescription?: string;
  level: string;
  audience?: string;
  stack?: string;
  coverImage: string;
  outcomes: string[];
  prerequisites: string[];
  careerPaths: string[];
  includes: string[];
  featured?: boolean;
  sortOrder: number;
  installmentsEnabled?: boolean;
  isActive?: boolean;
  /** Explicit plans; otherwise generated from price + INSTALLMENT_WEEKS. */
  installmentPlans?: InstallmentPlan[];
  /** Course page content stored in Course.metadata (CourseMetadata in src/types/course.ts). */
  metadata?: Record<string, unknown>;
  /**
   * Content revision. When higher than the row's metadata._seedVersion the entry is applied
   * once over the existing (possibly admin-edited) row. Default 0 = never overwrite; only
   * missing metadata keys are backfilled. Bump it only for deliberate catalog changes.
   */
  seedVersion?: number;
}

// ---------------------------------------------------------------------------
// Deprecated IDs (old slugs → remove before upserting new ones)
// ---------------------------------------------------------------------------
export const DEPRECATED_COURSE_IDS = [
  'icdl-core', 'icdl-advanced', 'icdl-professional', 'icdl-digital-citizen',
  'icdl-l45', 'icdl-citizen', // replaced by the Levels 1–5 progression (icdl-l4 / icdl-l5)
  'scratch-python', 'web-design-teens', 'game-dev', 'devops-cloud', 'cybersecurity',
  'ccna-exam-prep', 'ai-for-business',
  'data-powerbi', 'data-sql', 'data-advanced',
];

// ---------------------------------------------------------------------------
// Course catalog — IDs MUST match src/config/courses.ts
// Cover images use /images/courses/<id>.jpg (real photos, Unsplash License)
// ---------------------------------------------------------------------------
const RAW_COURSES: CourseSeed[] = [

  // ── SOFTWARE ENGINEERING ───────────────────────────────────────────────────
  {
    id: 'code-starter',
    categoryId: 'software',
    name: 'Code-Starter — Introduction to Software Engineering',
    shortName: 'Code-Starter',
    slug: 'code-starter',
    duration: '10 weeks',
    mode: 'Hybrid (Kisumu + Online)',
    price: 30000,
    currency: 'KES',
    level: 'beginner',
    featured: true,
    sortOrder: 1,
    coverImage: '/images/courses/code-starter.jpg',
    audience: 'Adults (complete beginners welcome)',
    description:
      "The ultimate beginner-to-employable bootcamp. 10 weeks, 2 ICDL certifications, 3+ GitHub projects, and a career roadmap — in a hybrid Kisumu + Zoom format.",
    longDescription:
      "Code-Starter is Digitika's flagship programme — a 10-week intensive bootcamp that takes complete beginners to job-ready developers. You'll cover web development, Python, JavaScript, and AI tools while earning 2 ICDL certifications along the way. Sessions are hybrid: in-person at our Kisumu hub with live Zoom access for remote learners.",
    outcomes: [
      'HTML, CSS & responsive design',
      'Python fundamentals & automation',
      'JavaScript & DOM manipulation',
      'Git, GitHub & collaboration',
      'AI-assisted development workflow',
      '2 ICDL certifications',
      '3+ GitHub portfolio projects',
      'Career roadmap session',
    ],
    prerequisites: ['Basic computer literacy', 'Access to a laptop'],
    careerPaths: ['Junior Developer', 'Freelance Web Developer', 'ICT Support', 'Tech Entrepreneur'],
    includes: [
      '10 weeks of instructor-led sessions',
      '2 ICDL certification exams',
      '3+ real GitHub projects',
      'Hybrid: in-person + Zoom access',
      'Career roadmap session',
      'Alumni network access',
      'GitHub portfolio review',
      'Certificate of completion',
    ],
    stack: 'HTML, CSS, Tailwind, Python, JavaScript, Git, GitHub, VS Code, AI tools',
    installmentPlans: CODE_STARTER_INSTALLMENTS,
    metadata: {
      curriculum: CODE_STARTER_CURRICULUM,
      testimonials: CODE_STARTER_TESTIMONIALS,
      showAlumni: true,
      location: 'Pioneer House, 2nd Floor, Room 204A, Kisumu',
      cohortSize: 20,
    },
  },
  {
    id: 'fullstack',
    categoryId: 'software',
    name: 'Full-Stack Web Development',
    shortName: 'Full-Stack Dev',
    slug: 'fullstack',
    duration: '12 weeks',
    mode: 'In-person / Online',
    price: 45000,
    currency: 'KES',
    level: 'intermediate',
    sortOrder: 2,
    coverImage: '/images/courses/fullstack.jpg',
    audience: 'Adults',
    description:
      'Build modern web applications from frontend to backend with real-world projects and production-ready code.',
    longDescription:
      "A comprehensive 12-week programme covering everything from React frontends to Node.js backends and PostgreSQL databases. You'll ship 4+ production-quality projects and leave with a portfolio that gets you hired.",
    outcomes: [
      'React frontends',
      'Node.js backends',
      'PostgreSQL databases',
      'REST & GraphQL APIs',
      'Authentication & security',
      'Cloud deployment',
      'Testing fundamentals',
    ],
    prerequisites: ['Basic HTML/CSS knowledge', 'Some programming experience recommended', 'Laptop required'],
    careerPaths: ['Full-Stack Developer', 'Frontend Engineer', 'Backend Developer', 'Software Engineer'],
    includes: ['12 weeks instruction', '4 capstone projects', 'Code review sessions', 'Alumni certificate'],
    stack: 'HTML, CSS, JavaScript, React, Node.js, Express, PostgreSQL, Git, Docker',
  },
  {
    id: 'mobile-dev',
    categoryId: 'software',
    name: 'Mobile App Development',
    shortName: 'Mobile Dev',
    slug: 'mobile-dev',
    duration: '10 weeks',
    mode: 'Online / Hybrid',
    price: 38000,
    currency: 'KES',
    level: 'intermediate',
    sortOrder: 3,
    coverImage: '/images/courses/mobile-dev.jpg',
    audience: 'Adults',
    description: 'Cross-platform mobile app development for Android and iOS with React Native & Flutter.',
    longDescription:
      'Build real mobile apps for both Android and iOS using React Native and Flutter. Covers UI design, state management, push notifications, camera integration, and deploying to the App Store and Google Play.',
    outcomes: [
      'React Native apps',
      'Flutter basics',
      'Push notifications',
      'App Store deployment',
      'Firebase integration',
      'Mobile UI/UX',
    ],
    prerequisites: ['JavaScript fundamentals', 'Basic programming experience'],
    careerPaths: ['Mobile Developer', 'React Native Developer', 'Flutter Developer'],
    includes: ['10 weeks instruction', '3 mobile projects', 'Play Store deployment guide', 'Alumni certificate'],
    stack: 'React Native, Flutter, Dart, Firebase, REST APIs, Expo',
  },
  {
    id: 'devops',
    categoryId: 'software',
    name: 'Cloud Engineering & DevOps',
    shortName: 'Cloud & DevOps',
    slug: 'devops-cloud',
    duration: '10 weeks',
    mode: 'Online',
    price: 42000,
    currency: 'KES',
    level: 'intermediate',
    sortOrder: 4,
    coverImage: '/images/courses/devops.jpg',
    audience: 'Adults',
    description: 'Modern DevOps practices: CI/CD, containerisation, Kubernetes, and cloud-native architecture.',
    longDescription:
      'Learn the tools and practices that power modern software delivery — Docker, Kubernetes, CI/CD pipelines, infrastructure as code, and cloud platforms.',
    outcomes: [
      'Docker & Kubernetes',
      'CI/CD pipelines',
      'AWS / GCP basics',
      'Infrastructure as Code',
      'Monitoring & logging',
      'GitOps workflows',
    ],
    prerequisites: ['Linux command line basics', 'Some programming experience'],
    careerPaths: ['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer', 'Platform Engineer'],
    includes: ['10 weeks instruction', 'Cloud lab environments', 'Terraform templates', 'Alumni certificate'],
    stack: 'Docker, Kubernetes, GitHub Actions, AWS, GCP, Terraform, Nginx',
  },
  {
    id: 'cybersec',
    categoryId: 'software',
    name: 'Cybersecurity Fundamentals',
    shortName: 'Cybersecurity',
    slug: 'cybersecurity',
    duration: '6 weeks',
    mode: 'In-person / Online',
    price: 28000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 5,
    coverImage: '/images/courses/cybersec.jpg',
    audience: 'Adults',
    description:
      'Foundations of information security, ethical hacking, and compliance for the modern digital landscape.',
    longDescription:
      'Understand how attackers think and how to defend against them. Covers network security, vulnerability assessment, penetration testing basics, and security compliance frameworks.',
    outcomes: [
      'Network security',
      'Ethical hacking basics',
      'Vulnerability assessment',
      'Security compliance',
      'Incident response',
      'OWASP Top 10',
    ],
    prerequisites: ['Basic networking concepts', 'Linux basics helpful but not required'],
    careerPaths: ['Security Analyst', 'Ethical Hacker', 'IT Security Officer', 'Penetration Tester'],
    includes: ['6 weeks instruction', 'Kali Linux lab environment', 'Capture-the-Flag challenges', 'Certificate'],
    stack: 'Kali Linux, Wireshark, Metasploit, OWASP tools, Nmap',
    metadata: { brochure: '/brochures/IT-SUPPORT-BROCHURE.pdf' },
  },
  {
    id: 'teens-web',
    categoryId: 'software',
    name: 'Web Design for Teens',
    shortName: 'Teen Web Design',
    slug: 'web-design-teens',
    duration: '8 weeks',
    mode: 'In-person / Online',
    price: 12000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 7,
    coverImage: '/images/courses/teens-web.jpg',
    audience: 'Teens (Age 13–17)',
    description: 'Teens aged 13–17 build their own websites and web apps using real industry tools.',
    longDescription:
      'A practical introduction to web development for teenagers. Students design and build real websites using industry-standard tools, and graduate with a live website they built themselves.',
    outcomes: ['HTML & CSS', 'JavaScript basics', 'Responsive design', 'Deploy a live site', 'Portfolio project'],
    prerequisites: ['Basic computer skills', 'Parental consent form required'],
    careerPaths: ['Pathway to adult software engineering programmes', 'Portfolio for tech applications'],
    includes: ['8 weeks instruction', 'Live portfolio website', 'Graduation showcase', 'Certificate'],
    stack: 'HTML5, CSS3, JavaScript, VS Code, GitHub Pages',
  },

  // ── DIGITIKA KIDS & TEENS (ages 6-16) ─────────────────────────────────────
  // Module mix benchmarked against Kenyan kids-tech providers (iLabAfrica, Pixel
  // Academy, MindHub, DigiAsk) and the KICD coding / digital literacy strands:
  // computational thinking, block-to-text coding, game design, robotics/IoT, safe AI.
  {
    id: 'kids-scratch', // id kept so existing links and enrollments keep working
    seedVersion: 2, // v2: no robotics kits on offer yet (virtual robots only)
    categoryId: 'kids',
    name: 'Tech Explorers: Digital Creativity & Coding (Ages 6-10)',
    shortName: 'Tech Explorers',
    slug: 'tech-explorers',
    duration: '8 weeks',
    mode: 'In-person (Kisumu)',
    price: 8000,
    currency: 'KES',
    level: 'beginner',
    featured: true,
    sortOrder: 1,
    coverImage: '/images/courses/kids-scratch.jpg',
    audience: 'Kids (Age 6-10)',
    description:
      'Digital play, creativity and first steps into tech. Kids aged 6-10 learn to use computers safely, create digital art and stories, and code their first games in ScratchJr and Scratch.',
    longDescription:
      'Tech Explorers turns screen time into creative time. Through unplugged games, ScratchJr and Scratch, children build computational thinking (sequences, loops, events, debugging), the same skills found in the KICD coding and digital literacy strands, while making animations, digital art and games of their own. A virtual-robot coding challenge and a kid-friendly introduction to AI show them how the technology around them works, and every child presents a finished project to parents on Showcase Day.',
    outcomes: [
      'Confident, safe computer and internet use',
      'Computational thinking: sequences, loops, events',
      'Digital art, animation and storytelling',
      'ScratchJr and Scratch games',
      'Coding virtual robots',
      'Understanding the AI around us',
      'Teamwork and presentation skills',
    ],
    prerequisites: ['No prior experience needed', 'Able to read simple words', 'Parental consent form required'],
    careerPaths: ['Next step: Young Innovators (ages 10-16)', 'CBC digital literacy and STEM enrichment'],
    includes: [
      '8 weekly 3-hour sessions',
      'Lab computers provided',
      'Weekly progress updates on the parent portal',
      'Digital portfolio of projects',
      'Showcase Day and certificate of completion',
    ],
    stack: 'ScratchJr, Scratch 3, Code.org, virtual robot simulators, Teachable Machine (demo)',
    installmentPlans: makeInstallmentPlans(8000, ['Week 4', 'Week 7']),
    metadata: {
      ageRange: '6-10',
      schedule: 'Saturdays 9:00am-12:00pm, or a daily 2-week bootcamp during the April, August and December school holidays',
      location: 'Pioneer House, 2nd Floor, Room 204A, Kisumu',
      cohortSize: 15,
      requirements: ['Snack and water bottle', 'Headphones (optional)'],
      highlights: ['Small classes of up to 15', 'Learning through play', 'Parent Showcase Day'],
      curriculum: [
        { week: 1, title: 'Hello, Computer!', topics: ['Parts of a computer', 'Mouse and keyboard skills', 'Staying safe and kind online', 'Unplugged: robot directions game'] },
        { week: 2, title: 'Thinking Like a Coder (Unplugged)', topics: ['Sequences and algorithms', 'Spotting patterns', 'Debugging games', 'Code.org puzzles'] },
        { week: 3, title: 'ScratchJr Stories', topics: ['Characters and backgrounds', 'Motion and looks blocks', 'Build: my first animated story'] },
        { week: 4, title: 'Digital Art & Creativity', topics: ['Drawing and editing pictures', 'Scratch paint editor', 'Adding sounds and music', 'Build: animated greeting card'] },
        { week: 5, title: 'Scratch Games I', topics: ['Events and loops', 'Sprites and costumes', 'Build: catch-the-fruit game'] },
        { week: 6, title: 'Scratch Games II', topics: ['If-then decisions', 'Score and timer variables', 'Build: maze game', 'Playtest a friend\'s game'] },
        { week: 7, title: 'Robots & AI Around Us', topics: ['Code a virtual robot', 'What is AI?', 'Teach a computer with pictures and sounds', 'AI safety: who to trust online'] },
        { week: 8, title: 'Showcase Day', topics: ['Finish and polish my project', 'Present to parents', 'Certificate and portfolio'] },
      ],
    },
  },
  {
    id: 'kids-games', // id kept so existing links and enrollments keep working
    seedVersion: 1, // Kids & Teens relaunch (Oct 2026): replaces the old kids course content
    categoryId: 'kids',
    name: 'Young Innovators: Game Development & Python (Ages 10-16)',
    shortName: 'Young Innovators: Games & Python',
    slug: 'young-innovators-games-python',
    duration: '8 weeks',
    mode: 'In-person (Kisumu)',
    price: 15000,
    currency: 'KES',
    level: 'beginner',
    featured: true,
    sortOrder: 2,
    coverImage: '/images/courses/kids-games.jpg',
    audience: 'Kids & Teens (Age 10-16)',
    description:
      'From block code to real Python. Learners aged 10-16 design and build their own 2D games, master logic and Python fundamentals, and design a web page to showcase their work.',
    longDescription:
      'Young Innovators bridges the jump from Scratch to text-based programming. Learners master logic and Python fundamentals, then use Pygame Zero to build playable 2D games with levels, scoring and sound, playtesting each other\'s games every week. A web and design module teaches HTML and CSS so each learner builds a showcase page for their games, and a guided session on AI coding assistants teaches how to use AI to learn, not to copy. Aligned to the KICD coding strand and a head start for Computer Studies and the CBC Pre-Technical pathway.',
    outcomes: [
      'Logic and computational thinking',
      'Python fundamentals: variables, loops, functions, lists',
      '2D game development with Pygame Zero',
      'Game design: mechanics, levels and playtesting',
      'Web and design basics: HTML and CSS',
      'Using AI coding assistants responsibly',
      'Portfolio of 3+ playable games',
    ],
    prerequisites: ['Comfortable using a computer', 'Scratch experience helpful but not required', 'Parental consent form required'],
    careerPaths: [
      'Foundation for software and game development careers',
      'Head start for Computer Studies and CBC Pre-Technical studies',
      'Next step: Web Design for Teens or Code-Starter',
    ],
    includes: [
      '8 weekly 3-hour sessions',
      'Lab computers provided',
      'Weekly progress updates on the parent portal',
      '3+ playable games in a portfolio',
      'Demo Day and certificate of completion',
    ],
    stack: 'Python 3, Pygame Zero, Thonny / VS Code, HTML5, CSS3, Scratch (bridge), AI coding assistants (guided)',
    installmentPlans: makeInstallmentPlans(15000, ['Week 3', 'Week 6']),
    metadata: {
      ageRange: '10-16',
      schedule: 'Saturdays 1:00pm-4:00pm, or a daily 2-week bootcamp during the April, August and December school holidays',
      location: 'Pioneer House, 2nd Floor, Room 204A, Kisumu',
      cohortSize: 15,
      requirements: ['Own laptop optional (lab computers provided)', 'Notebook and pen'],
      highlights: ['Real Python, not just blocks', 'Weekly playtesting', 'Parent Demo Day'],
      curriculum: [
        { week: 1, title: 'Logic & Problem Solving', topics: ['Algorithms and flowcharts', 'From Scratch blocks to Python', 'The debugging mindset'] },
        { week: 2, title: 'Python Basics', topics: ['print, input and variables', 'Maths with Python', 'Turtle drawings'] },
        { week: 3, title: 'Decisions & Loops', topics: ['if / elif / else', 'for and while loops', 'Build: guess-the-number game'] },
        { week: 4, title: 'Functions & Lists', topics: ['Writing functions', 'Lists and random', 'Build: text adventure game'] },
        { week: 5, title: 'Game Dev with Pygame Zero I', topics: ['The game loop', 'Sprites and movement', 'Collisions and scoring'] },
        { week: 6, title: 'Game Dev with Pygame Zero II', topics: ['Levels and game states', 'Sound and lives', 'Playtesting and feedback'] },
        { week: 7, title: 'Web & Design', topics: ['HTML page structure', 'CSS colour, fonts and layout', 'Design principles', 'Build: my game showcase page'] },
        { week: 8, title: 'AI & Demo Day', topics: ['Using AI assistants to learn, not copy', 'Polish the final game', 'Demo Day for parents', 'Certificate'] },
      ],
    },
  },
  {
    id: 'kids-robotics-ai',
    seedVersion: 2, // v2: no robotics kits on offer yet, hardware work runs in simulators
    categoryId: 'kids',
    name: 'Young Innovators: Robotics, IoT & AI (Ages 10-16)',
    shortName: 'Young Innovators: Robotics & AI',
    slug: 'young-innovators-robotics-ai',
    duration: '8 weeks',
    mode: 'In-person (Kisumu)',
    price: 15000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 3,
    coverImage: '/images/courses/kids-robotics-ai.jpg',
    audience: 'Kids & Teens (Age 10-16)',
    description:
      'Design and program robots and smart devices. Learners build circuits, code micro:bit and Arduino projects in simulators, and train simple AI models to solve problems in their community.',
    longDescription:
      'A hands-on engineering lab for curious builders, run on free browser-based simulators so no hardware is needed. Learners build circuits in Tinkercad, program BBC micro:bit and Arduino boards in their simulators, read virtual sensors, drive motors and code a robot car that avoids obstacles. They connect devices into a simple Internet-of-Things prototype (smart farm or smart home), train image and sound models with Teachable Machine, and finish with a team Innovation Challenge that tackles a real local problem.',
    outcomes: [
      'Electronics basics: circuits, LEDs, sensors and motors',
      'micro:bit programming from MakeCode blocks to MicroPython (simulator)',
      'Arduino basics and wiring',
      'Design and code a virtual robot car',
      'IoT: collect, send and display sensor data',
      'AI literacy: train image and sound models',
      'Engineering design and teamwork',
    ],
    prerequisites: ['Comfortable using a computer', 'No electronics experience or hardware needed', 'Parental consent form required'],
    careerPaths: [
      'Foundation for engineering, robotics and AI careers',
      'CBC STEM pathway and science-fair projects',
      'Next step: AI Fundamentals or Code-Starter',
    ],
    includes: [
      '8 weekly 3-hour sessions',
      'Lab computers with circuit and robot simulators',
      'Weekly progress updates on the parent portal',
      'Team Innovation Challenge',
      'Demo Day and certificate of completion',
    ],
    stack: 'Tinkercad Circuits, BBC micro:bit (MakeCode simulator), MicroPython, Arduino (Wokwi simulator), Teachable Machine',
    installmentPlans: makeInstallmentPlans(15000, ['Week 3', 'Week 6']),
    metadata: {
      ageRange: '10-16',
      schedule: 'Saturdays 1:00pm-4:00pm, or a daily 2-week bootcamp during the April, August and December school holidays',
      location: 'Pioneer House, 2nd Floor, Room 204A, Kisumu',
      cohortSize: 12,
      requirements: ['Notebook and pen'],
      highlights: ['No hardware needed: simulators', 'Code a robot car', 'Solve a local problem with tech'],
      curriculum: [
        { week: 1, title: 'How Machines Think', topics: ['Inputs, processing and outputs', 'Circuits in Tinkercad', 'Lab safety'] },
        { week: 2, title: 'micro:bit Basics', topics: ['LEDs and buttons', 'MakeCode blocks', 'Build: reaction-time game'] },
        { week: 3, title: 'Sensors & Data', topics: ['Light, temperature and motion sensors', 'Logging data', 'Build: mini weather station'] },
        { week: 4, title: 'Arduino & Electronics', topics: ['Breadboards, LEDs and resistors (simulated)', 'Buzzers and buttons', 'Build: traffic-light controller'] },
        { week: 5, title: 'Robots in Motion', topics: ['Motors and wheels', 'Code a robot car in the simulator', 'Obstacle avoidance'] },
        { week: 6, title: 'Smart Devices (IoT)', topics: ['Radio messaging between devices', 'Smart farm or smart home prototype', 'Moving to MicroPython'] },
        { week: 7, title: 'AI Lab', topics: ['What AI is and is not', 'Train image and sound models', 'AI-controlled virtual robot', 'AI ethics and safety'] },
        { week: 8, title: 'Innovation Challenge & Demo Day', topics: ['Team build for a local problem', 'Pitch to parents', 'Certificate'] },
      ],
    },
  },

  // ── ICDL (Levels 1–5 progression) ───────────────────────────────────────────
  // Pricing: L1=15k | L2=20k | L3=24k | L4=28k | L5=32k
  {
    id: 'icdl-l1',
    categoryId: 'icdl',
    name: 'ICDL Level 1 — Digital Literacy Foundation',
    shortName: 'ICDL Level 1',
    slug: 'icdl-l1',
    duration: '4 weeks',
    mode: 'In-person / Online',
    price: 15000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 1,
    coverImage: '/images/courses/icdl-l1.jpg',
    stack: 'ICDL Modules: Computer & Online Essentials (intro), Digital Citizen, Digital Citizen Plus, Tablet Essentials',
    description:
      'Foundational digital literacy for absolute beginners — using computers and devices safely, online communication, and being a confident digital citizen. Globally recognised entry point to the ICDL pathway.',
    longDescription:
      'The entry tier of the ICDL pathway, built on the ICDL Digital Citizen programme. Designed for complete beginners, it removes computer anxiety and covers using computers, tablets and smartphones, basic file management, safe and effective internet use, email and online communication, social media literacy, and staying safe with mobile money and e-commerce.',
    outcomes: [
      'Using computers, tablets & smartphones',
      'Files, folders & basic operations',
      'Safe & effective internet use',
      'Email & online communication',
      'Social media literacy',
      'Mobile money & e-commerce safety',
      'Digital well-being',
    ],
    prerequisites: ['No prior experience required', 'Willingness to learn'],
    careerPaths: ['First-time computer user', 'Foundation for all further digital qualifications', 'Everyday workplace readiness'],
    includes: [
      '4 weeks instruction',
      'Official ICDL exam voucher',
      'Exam practice software',
      'ICDL Level 1 certificate',
    ],
    metadata: { brochure: '/brochures/Codevertex_Digitika_Program_Cert_Samples.pdf' },
  },
  {
    id: 'icdl-l2',
    categoryId: 'icdl',
    name: 'ICDL Level 2 — Core Workplace Essentials',
    shortName: 'ICDL Level 2',
    slug: 'icdl-l2',
    duration: '4 weeks',
    mode: 'In-person / Online',
    price: 20000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 2,
    coverImage: '/images/courses/icdl-l2.jpg',
    stack: 'ICDL Modules: Computer & Online Essentials, Documents, Application Essentials, Information & Collaboration Essentials',
    description: 'Everyday workplace computing: operating systems, file management, word-processed documents, online collaboration and information handling.',
    longDescription:
      'Level 2 establishes the core skills every modern workplace expects, drawing on the ICDL Core and Digital Student essentials. Learners master operating systems and file management, produce professional word-processed documents, work effectively online, and collaborate and share information using digital tools.',
    outcomes: [
      'Operating system & file management',
      'Word processing & document production',
      'Web browsing & online search',
      'Email & online collaboration',
      'Information & data handling',
      'Working effectively online',
    ],
    prerequisites: ['ICDL Level 1 or basic computer familiarity'],
    careerPaths: ['Office Administrator', 'Data Entry Clerk', 'Customer Service Agent', 'Receptionist'],
    includes: [
      '4 weeks instruction',
      'Official ICDL exam voucher',
      'Exam materials',
      'ICDL Level 2 certificate',
    ],
  },
  {
    id: 'icdl-l3',
    categoryId: 'icdl',
    name: 'ICDL Level 3 — Productivity & Standard Office',
    shortName: 'ICDL Level 3',
    slug: 'icdl-l3',
    duration: '5 weeks',
    mode: 'In-person / Online',
    price: 24000,
    currency: 'KES',
    level: 'intermediate',
    sortOrder: 3,
    coverImage: '/images/courses/icdl-l3.jpg',
    stack: 'ICDL Modules: Spreadsheets, Presentation, Using Databases, Image Editing, Cyber Security, AI Essentials',
    description: 'The classic office toolkit plus modern essentials: spreadsheets, presentations, databases, image editing, cyber security and AI essentials.',
    longDescription:
      'Level 3 delivers the productivity skills most Kenyan employers associate with "the ICDL course", upgraded for today. Learners build spreadsheet models with formulas, charts and pivot tables, design compelling presentations, work with databases and edit images — and add the modern essentials of cyber security and responsible use of AI tools.',
    outcomes: [
      'Spreadsheets: formulas, charts & pivot tables',
      'Presentations & visual communication',
      'Database fundamentals',
      'Image editing for print & web',
      'Cyber security awareness',
      'AI Essentials & responsible AI use',
    ],
    prerequisites: ['ICDL Level 2 or equivalent productivity skills'],
    careerPaths: ['Finance Assistant', 'Data Entry Analyst', 'Accounts Clerk', 'Operations Coordinator', 'Office Manager'],
    includes: [
      '5 weeks instruction',
      'Official ICDL exam voucher',
      'Exam materials',
      'ICDL Level 3 certificate',
    ],
  },
  {
    id: 'icdl-l4',
    categoryId: 'icdl',
    name: 'ICDL Level 4 — Advanced Professional Skills',
    shortName: 'ICDL Level 4',
    slug: 'icdl-l4',
    duration: '8 weeks',
    mode: 'Hybrid',
    price: 28000,
    currency: 'KES',
    level: 'advanced',
    sortOrder: 4,
    coverImage: '/images/courses/icdl-l4.jpg',
    stack: 'ICDL Modules: Advanced Documents/Spreadsheets/Presentation, Data Analytics, Project Planning, Teamwork, Digital Marketing, E-Commerce, Data Protection',
    description:
      'Advanced productivity and applied business skills: advanced Word/Excel/PowerPoint, data analytics, project planning, digital marketing, e-commerce and data protection.',
    longDescription:
      'Level 4 maps to the ICDL Professional programme for technology-dependent roles. It covers advanced document, spreadsheet and presentation techniques, hands-on data analytics and visualisation, project planning, teamwork on collaboration platforms, digital marketing, e-commerce, and managing personal data in line with data-protection (GDPR-style) requirements.',
    outcomes: [
      'Advanced Documents, Spreadsheets & Presentation',
      'Data analytics & visualisation',
      'Project planning & delivery',
      'Teamwork & collaboration platforms',
      'Digital marketing campaigns',
      'E-commerce fundamentals',
      'Data protection & compliance',
    ],
    prerequisites: ['ICDL Level 3 or strong general computer skills'],
    careerPaths: ['IT Officer', 'Project Manager', 'Systems Analyst', 'Finance Manager', 'Marketing Officer'],
    includes: [
      '8 weeks instruction',
      '2 ICDL exam vouchers',
      'Project toolkit',
      'ICDL Level 4 certificate',
    ],
  },
  {
    id: 'icdl-l5',
    categoryId: 'icdl',
    name: 'ICDL Level 5 — Specialist & Emerging Technologies',
    shortName: 'ICDL Level 5',
    slug: 'icdl-l5',
    duration: '8 weeks',
    mode: 'Hybrid',
    price: 32000,
    currency: 'KES',
    level: 'advanced',
    sortOrder: 5,
    coverImage: '/images/courses/icdl-l5.jpg',
    stack: 'ICDL Modules: Coding Principles, Cloud Computing, Big Data, Blockchain, Internet of Things, 3D Design',
    description:
      'The specialist tier: coding principles, cloud computing, big data, blockchain, the Internet of Things and 3D design — the emerging technologies shaping the future of work.',
    longDescription:
      'Level 5 is the highest ICDL Professional tier, equipping learners with specialist and emerging-technology competencies. It covers computational thinking and coding principles, cloud computing, big data concepts, blockchain, the Internet of Things (IoT), and 3D design with computer-aided design tools — the differentiators for IT professionals and innovators.',
    outcomes: [
      'Coding principles & computational thinking',
      'Cloud computing concepts',
      'Big data fundamentals',
      'Blockchain technology',
      'Internet of Things (IoT)',
      '3D design with CAD tools',
    ],
    prerequisites: ['ICDL Level 4 or equivalent advanced ICT skills'],
    careerPaths: ['Technical Administrator', 'Cloud/IoT Specialist', 'Innovation Lead', 'Pathway to software & data engineering'],
    includes: [
      '8 weeks instruction',
      '2 ICDL exam vouchers',
      'Emerging-tech lab access',
      'ICDL Level 5 certificate',
    ],
  },

  // ── CCNA ──────────────────────────────────────────────────────────────────
  {
    id: 'ccna-1',
    categoryId: 'ccna',
    name: 'CCNA v7 Part 1 — Introduction to Networks',
    shortName: 'CCNA Part 1',
    slug: 'ccna-1',
    duration: '8 weeks',
    mode: 'In-person / Online',
    price: 22000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 1,
    coverImage: '/images/courses/ccna-1.jpg',
    description:
      'OSI model, TCP/IP, IPv4/IPv6 addressing, Ethernet fundamentals, and Cisco IOS basics.',
    longDescription:
      "The first module of the Cisco CCNA curriculum. Build a solid foundation in how networks work — from the physical layer to application protocols — and practice configuring Cisco routers and switches in simulated labs.",
    outcomes: [
      'OSI & TCP/IP models',
      'IPv4/IPv6 addressing',
      'Ethernet & LAN basics',
      'Cisco IOS CLI',
      'Subnetting',
      'Basic router configuration',
    ],
    prerequisites: ['Basic computer skills', 'Interest in networking'],
    careerPaths: ['Network Technician', 'IT Support', 'Network Engineer (with Parts 2 & 3)'],
    includes: ['8 weeks instruction', 'Cisco Packet Tracer labs', 'CCNA Part 1 exam prep', 'Certificate'],
    stack: 'Cisco Packet Tracer, IOS CLI',
  },
  {
    id: 'ccna-2',
    categoryId: 'ccna',
    name: 'CCNA v7 Part 2 — Switching, Routing & Wireless',
    shortName: 'CCNA Part 2',
    slug: 'ccna-2',
    duration: '8 weeks',
    mode: 'In-person / Online',
    price: 22000,
    currency: 'KES',
    level: 'intermediate',
    sortOrder: 2,
    coverImage: '/images/courses/ccna-2.jpg',
    description:
      'VLANs, inter-VLAN routing, STP, EtherChannel, OSPF, DHCP, NAT, and wireless LANs.',
    longDescription:
      'Dive deeper into enterprise networking — configure VLANs for network segmentation, implement OSPF routing, set up DHCP and NAT, and design wireless LAN solutions. Heavy focus on practical Packet Tracer labs.',
    outcomes: [
      'VLANs & trunking',
      'OSPF routing',
      'Wireless LAN setup',
      'NAT & DHCP',
      'STP & EtherChannel',
      'Inter-VLAN routing',
    ],
    prerequisites: ['CCNA Part 1 or equivalent knowledge'],
    careerPaths: ['Network Engineer', 'Systems Administrator', 'IT Infrastructure Specialist'],
    includes: ['8 weeks instruction', 'Advanced Packet Tracer labs', 'CCNA Part 2 exam prep', 'Certificate'],
    stack: 'Cisco Packet Tracer, IOS CLI',
  },
  {
    id: 'ccna-3',
    categoryId: 'ccna',
    name: 'CCNA v7 Part 3 — Enterprise Networking, Security & Automation',
    shortName: 'CCNA Part 3',
    slug: 'ccna-3',
    duration: '8 weeks',
    mode: 'In-person / Online',
    price: 22000,
    currency: 'KES',
    level: 'advanced',
    sortOrder: 3,
    coverImage: '/images/courses/ccna-3.jpg',
    description:
      'WAN technologies, network security, QoS, and network automation with Python and REST APIs.',
    longDescription:
      'Complete the CCNA curriculum with WAN technologies, network security, QoS, and network automation with Python and REST APIs. Prepares you for the Cisco CCNA 200-301 exam.',
    outcomes: [
      'WAN & VPN technologies',
      'QoS policies',
      'Network automation with Python',
      'REST API integration',
      'CCNA 200-301 exam preparation',
    ],
    prerequisites: ['CCNA Parts 1 and 2 or equivalent'],
    careerPaths: ['Network Engineer', 'Network Automation Engineer', 'CCNA-certified Professional'],
    includes: ['8 weeks instruction', 'Final Packet Tracer labs', 'CCNA Part 3 exam voucher', 'Certificate'],
    stack: 'Cisco Packet Tracer, Python, REST APIs',
  },
  {
    id: 'ccna-cert',
    categoryId: 'ccna',
    name: 'CCNA Exam Prep Bootcamp',
    shortName: 'CCNA Exam Prep',
    slug: 'ccna-exam-prep',
    duration: '4 weeks',
    mode: 'Online Intensive',
    price: 15000,
    currency: 'KES',
    level: 'advanced',
    sortOrder: 4,
    coverImage: '/images/courses/ccna-cert.jpg',
    description:
      'Intensive exam preparation for the Cisco CCNA 200-301 certification. Practice exams, lab simulations, and targeted topic review.',
    outcomes: [
      'Master all CCNA exam objectives',
      'Complete timed practice exams',
      'Identify and close knowledge gaps',
      'Pass the CCNA 200-301 certification',
    ],
    prerequisites: ['Completed CCNA Parts 1–3 or equivalent experience'],
    careerPaths: ['CCNA-certified Network Engineer', 'Network Administrator'],
    includes: ['4 weeks intensive prep', '10+ practice exams', 'Lab simulation bank', 'Study guide PDF'],
    stack: 'Cisco Packet Tracer, Python, REST APIs',
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  {
    id: 'ai-fundamentals',
    categoryId: 'ai',
    name: 'AI Fundamentals',
    shortName: 'AI Fundamentals',
    slug: 'ai-fundamentals',
    duration: '6 weeks',
    mode: 'Online & In-person',
    price: 14000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 1,
    coverImage: '/images/courses/ai-fundamentals.jpg',
    description:
      'No-code introduction to artificial intelligence. Understand how AI and ML work, and use AI tools to improve your productivity and career.',
    longDescription:
      "A practical, no-code introduction to AI for professionals who want to stay ahead of the curve. You'll learn how large language models work, master prompt engineering, and apply AI tools to real business tasks.",
    outcomes: [
      'Explain how AI and ML models work',
      'Use ChatGPT, Claude, and Gemini effectively',
      'Apply prompt engineering techniques',
      'Identify AI use cases in your industry',
    ],
    prerequisites: ['Basic computer literacy'],
    careerPaths: ['AI-powered professional in any field', 'AI Product Manager', 'Business Analyst'],
    includes: ['6 weeks instruction', 'AI tools access', 'Prompt engineering guide', 'Certificate'],
  },
  {
    id: 'ml-python',
    categoryId: 'ai',
    name: 'Machine Learning with Python',
    shortName: 'ML with Python',
    slug: 'ml-python',
    duration: '12 weeks',
    mode: 'Online & In-person',
    price: 32000,
    currency: 'KES',
    level: 'intermediate',
    sortOrder: 2,
    coverImage: '/images/courses/ml-python.jpg',
    description:
      'Build and deploy machine learning models with Python, scikit-learn, and TensorFlow. From data preprocessing to model evaluation and deployment.',
    longDescription:
      "Hands-on ML engineering from scratch. You'll build supervised and unsupervised models, process real datasets, and deploy models via REST APIs. Includes 4 portfolio projects.",
    outcomes: [
      'Supervised and unsupervised ML models',
      'Data processing with pandas and matplotlib',
      'Model evaluation and tuning',
      'Deploy models via Flask REST APIs',
      'Apply ML to real business problems',
    ],
    prerequisites: ['Python programming basics', 'Basic statistics knowledge'],
    careerPaths: ['ML Engineer', 'Data Scientist', 'AI Developer'],
    includes: ['12 weeks instruction', '4 ML projects', 'Kaggle competition guide', 'Certificate'],
    stack: 'Python, scikit-learn, TensorFlow, pandas, NumPy, Jupyter',
  },
  {
    id: 'genai-llm',
    categoryId: 'ai',
    name: 'Generative AI & Large Language Models',
    shortName: 'GenAI & LLMs',
    slug: 'genai-llm',
    duration: '10 weeks',
    mode: 'Online',
    price: 38000,
    currency: 'KES',
    level: 'advanced',
    sortOrder: 3,
    coverImage: '/images/courses/genai-llm.jpg',
    description:
      'Deep-dive into LLMs, RAG pipelines, fine-tuning, and building production AI applications with the Anthropic and OpenAI APIs.',
    longDescription:
      'For developers who want to build production AI products. Covers LLM architecture, RAG pipelines with vector databases, fine-tuning, and deploying AI agents with tool use.',
    outcomes: [
      'Build RAG pipelines with vector databases',
      'Fine-tune and evaluate LLMs',
      'Deploy AI agents with tool use',
      'Integrate LLM APIs into production apps',
    ],
    prerequisites: ['Python proficiency', 'ML fundamentals or experience'],
    careerPaths: ['AI Engineer', 'LLM Developer', 'AI Product Builder'],
    includes: ['10 weeks instruction', 'API credits package', '3 AI app projects', 'Certificate'],
    stack: 'Python, LangChain, Anthropic API, OpenAI API, Pinecone, pgvector',
  },
  {
    id: 'ai-business',
    categoryId: 'ai',
    name: 'AI for Business & Leaders',
    shortName: 'AI for Business',
    slug: 'ai-for-business',
    duration: '3 weeks',
    mode: 'Online (Weekend sessions)',
    price: 9000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 4,
    coverImage: '/images/courses/ai-business.jpg',
    description:
      "Designed for executives and managers who want to understand AI's impact on their industry and lead digital transformation initiatives confidently.",
    longDescription:
      'A non-technical deep-dive for decision-makers. Learn how to evaluate AI vendors, identify automation opportunities, and build a basic AI implementation roadmap — without writing a single line of code.',
    outcomes: [
      'Identify AI opportunities in your organisation',
      'Evaluate AI vendors and solutions',
      'Build a basic AI implementation roadmap',
      'Communicate AI strategy to stakeholders',
    ],
    prerequisites: ['Management or business experience', 'No coding required'],
    careerPaths: ['Digital Transformation Leader', 'AI Strategy Consultant', 'Operations Manager'],
    includes: ['3 weekend sessions', 'AI strategy canvas template', 'Peer group access', 'Certificate'],
  },

  // ── DATA ANALYTICS ────────────────────────────────────────────────────────
  {
    id: 'data-python',
    categoryId: 'data',
    name: 'Data Analytics with Python',
    shortName: 'Data Analytics',
    slug: 'data-python',
    duration: '10 weeks',
    mode: 'Online & In-person',
    price: 28000,
    currency: 'KES',
    level: 'intermediate',
    sortOrder: 1,
    coverImage: '/images/courses/data-python.jpg',
    description:
      'Master data wrangling, visualisation, and statistical analysis with Python, pandas, and matplotlib. Build a data portfolio employers will love.',
    longDescription:
      "The complete data analytics pipeline — from raw data to actionable insights. You'll work with real datasets, build dashboards, and present analysis findings in 4 hands-on portfolio projects.",
    outcomes: [
      'Clean and analyse datasets with pandas',
      'Create compelling visualisations',
      'Apply statistical analysis techniques',
      'Build and present data dashboards',
    ],
    prerequisites: ['Basic Python knowledge', 'Basic statistics familiarity'],
    careerPaths: ['Data Analyst', 'Business Intelligence Analyst', 'Data Engineer'],
    includes: ['10 weeks instruction', '4 analysis projects', 'Portfolio review', 'Certificate'],
    stack: 'Python, pandas, NumPy, matplotlib, seaborn, Jupyter',
  },
  {
    id: 'power-bi',
    categoryId: 'data',
    name: 'Business Intelligence with Power BI',
    shortName: 'Power BI',
    slug: 'data-powerbi',
    duration: '6 weeks',
    mode: 'Online & In-person',
    price: 16000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 2,
    coverImage: '/images/courses/power-bi.jpg',
    description:
      'Build interactive dashboards and reports with Microsoft Power BI. Connect to live data sources and automate executive reporting.',
    longDescription:
      "Master Power BI from data connection to published report. You'll write DAX formulas, build interactive dashboards, and publish reports to Power BI Service for executive audiences.",
    outcomes: [
      'Create interactive Power BI dashboards',
      'Write DAX formulas for calculated metrics',
      'Connect to SQL, Excel, and API data sources',
      'Publish and share reports in Power BI Service',
    ],
    prerequisites: ['Excel familiarity', 'Basic data concepts'],
    careerPaths: ['BI Analyst', 'Reporting Analyst', 'Data Visualisation Specialist'],
    includes: ['6 weeks instruction', '3 dashboard projects', 'Power BI Desktop license', 'Certificate'],
    stack: 'Power BI Desktop, DAX, Power Query, SQL',
  },
  {
    id: 'sql-db',
    categoryId: 'data',
    name: 'SQL & Database Analytics',
    shortName: 'SQL & Databases',
    slug: 'data-sql',
    duration: '6 weeks',
    mode: 'Online',
    price: 12000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 3,
    coverImage: '/images/courses/sql-db.jpg',
    description:
      'Learn to query, join, and aggregate data from relational databases using SQL. Essential for every data analyst and backend developer.',
    longDescription:
      'SQL is the universal language of data. This course takes you from basic SELECT queries to advanced window functions, CTEs, and query optimisation — with a PostgreSQL practice environment throughout.',
    outcomes: [
      'Write complex SQL queries with JOINs and subqueries',
      'Design normalised database schemas',
      'Use window functions and CTEs',
      'Optimise slow queries with indexes',
    ],
    prerequisites: ['Basic computer skills'],
    careerPaths: ['Data Analyst', 'Database Administrator', 'Backend Developer'],
    includes: ['6 weeks instruction', 'PostgreSQL practice environment', 'Query library', 'Certificate'],
    stack: 'PostgreSQL, pgAdmin, DBeaver',
  },
  {
    id: 'advanced-analytics',
    categoryId: 'data',
    name: 'Advanced Data Analytics & Storytelling',
    shortName: 'Advanced Analytics',
    slug: 'data-advanced',
    duration: '8 weeks',
    mode: 'Online',
    price: 22000,
    currency: 'KES',
    level: 'advanced',
    sortOrder: 4,
    coverImage: '/images/courses/advanced-analytics.jpg',
    description:
      'Combine statistical modelling, A/B testing, and data storytelling to turn raw data into decisions. Ideal for analysts ready to step up to senior roles.',
    longDescription:
      'For analysts who already know the basics and want to operate at a senior level. Covers A/B testing, predictive modelling, narrative data storytelling, and automated reporting pipelines.',
    outcomes: [
      'Apply A/B testing and hypothesis testing',
      'Build predictive models from business data',
      'Tell compelling data stories for executives',
      'Automate reporting pipelines',
    ],
    prerequisites: ['SQL proficiency', 'Basic Python or R', 'Data Analysis fundamentals'],
    careerPaths: ['Senior Data Analyst', 'Data Science Lead', 'Analytics Manager'],
    includes: ['8 weeks instruction', '2 real-world capstone projects', 'Peer review sessions', 'Certificate'],
    stack: 'Python, R, Tableau/Superset, SQL, Jupyter',
  },
];

// Week labels for the generated 2- and 3-installment plans (used when a course has no
// explicit installmentPlans).
const INSTALLMENT_WEEKS: Record<string, [string, string]> = {
  fullstack: ['Week 6', 'Week 10'],
  'mobile-dev': ['Week 5', 'Week 8'],
  devops: ['Week 5', 'Week 8'],
  cybersec: ['Week 3', 'Week 5'],
  'teens-web': ['Week 4', 'Week 7'],
  'icdl-l1': ['Week 2', 'Week 3'],
  'icdl-l2': ['Week 2', 'Week 3'],
  'icdl-l3': ['Week 3', 'Week 4'],
  'icdl-l4': ['Week 4', 'Week 6'],
  'icdl-l5': ['Week 4', 'Week 6'],
  'ccna-1': ['Week 4', 'Week 6'],
  'ccna-2': ['Week 4', 'Week 6'],
  'ccna-3': ['Week 4', 'Week 6'],
  'ccna-cert': ['Week 2', 'Week 3'],
  'ai-fundamentals': ['Week 2', 'Week 3'],
  'ml-python': ['Week 5', 'Week 8'],
  'genai-llm': ['Week 4', 'Week 6'],
  'ai-business': ['Week 1', 'Week 2'],
  'data-python': ['Week 4', 'Week 6'],
  'power-bi': ['Week 2', 'Week 3'],
  'sql-db': ['Week 2', 'Week 3'],
  'advanced-analytics': ['Week 3', 'Week 5'],
};

export const COURSES: (CourseSeed & { installmentPlans: InstallmentPlan[] })[] = RAW_COURSES.map((c) => ({
  ...c,
  installmentPlans: c.installmentPlans ?? makeInstallmentPlans(c.price, INSTALLMENT_WEEKS[c.id]),
}));
