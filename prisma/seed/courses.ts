/**
 * Digitika Academy — Course seed data
 * Cover images: /public/images/illustrations/course-*.svg
 * Installment plans: imported from src/config/courses.ts (COURSE_CATEGORIES)
 */

import { COURSE_CATEGORIES } from '../../src/config/courses';

// ---------------------------------------------------------------------------
// Build installment plans map from static config
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const INSTALLMENT_PLANS_MAP: Record<string, any[]> = {};
for (const cat of COURSE_CATEGORIES) {
  for (const course of cat.courses) {
    INSTALLMENT_PLANS_MAP[course.id] = (course.installmentPlans ?? []) as unknown[];
  }
}

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
}

// ---------------------------------------------------------------------------
// Deprecated IDs (old slugs → remove before upserting new ones)
// ---------------------------------------------------------------------------
export const DEPRECATED_COURSE_IDS = [
  'icdl-core', 'icdl-advanced', 'icdl-professional', 'icdl-digital-citizen',
  'scratch-python', 'web-design-teens', 'game-dev', 'devops-cloud', 'cybersecurity',
  'ccna-exam-prep', 'ai-for-business',
  'data-powerbi', 'data-sql', 'data-advanced',
];

// ---------------------------------------------------------------------------
// Course catalog — IDs MUST match src/config/courses.ts
// Cover images use /images/illustrations/course-*.svg (560×280 dark-theme SVGs)
// ---------------------------------------------------------------------------
export const COURSES: CourseSeed[] = [

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
    coverImage: '/images/illustrations/course-code-starter.svg',
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
    coverImage: '/images/illustrations/course-fullstack.svg',
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
    coverImage: '/images/illustrations/course-mobile-dev.svg',
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
    coverImage: '/images/illustrations/course-devops.svg',
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
    coverImage: '/images/illustrations/course-cybersec.svg',
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
  },
  {
    id: 'kids-scratch',
    categoryId: 'software',
    name: 'Coding for Kids — Scratch & Python',
    shortName: 'Kids Coding',
    slug: 'scratch-python',
    duration: '8 weeks',
    mode: 'In-person / Online',
    price: 8000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 6,
    coverImage: '/images/illustrations/course-kids-scratch.svg',
    audience: 'Kids (Age 8–13)',
    description: 'Fun, project-based coding for kids aged 8–13. Build games, animations, and interactive stories.',
    longDescription:
      "Kids learn to think like programmers through visual Scratch projects and introductory Python. Every lesson is game-based and project-driven — kids build something new each week.",
    outcomes: [
      'Scratch programming',
      'Python basics',
      'Logical thinking',
      'Mini game creation',
      'Creative problem-solving',
    ],
    prerequisites: ['Basic computer operation', 'Parental consent form required'],
    careerPaths: ['Foundation for future tech career', 'STEM enrichment'],
    includes: ['8 weeks instruction', 'Parent progress reports', 'Digital certificate', 'Coding portfolio'],
    stack: 'Scratch, Python (Turtle, basics)',
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
    coverImage: '/images/illustrations/course-teens-web.svg',
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
  {
    id: 'kids-games',
    categoryId: 'software',
    name: 'Game Development for Kids',
    shortName: 'Game Dev Kids',
    slug: 'game-dev',
    duration: '6 weeks',
    mode: 'In-person',
    price: 10000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 8,
    coverImage: '/images/illustrations/course-kids-games.svg',
    audience: 'Kids (Age 10–16)',
    description: 'Create fun 2D games using Pygame and Unity basics in a hands-on studio environment.',
    longDescription:
      "Kids aged 10–16 learn game design fundamentals, physics, and programming through building their own 2D games. Sessions are fast-paced and creative — students playtest each other's games each week.",
    outcomes: [
      'Game mechanics',
      'Pygame basics',
      'Unity 2D intro',
      'Creative problem-solving',
      'Game design principles',
    ],
    prerequisites: ['Some computer familiarity', 'Parental consent form required'],
    careerPaths: ['Foundation for game development career', 'STEM pathway'],
    includes: ['6 weeks instruction', 'Unity Pro student license', 'Published game portfolio', 'Certificate'],
    stack: 'Python (Pygame), Unity (C# basics)',
  },

  // ── ICDL ──────────────────────────────────────────────────────────────────
  // Pricing: L1=20k | L2=22k | L3=26k | L4&5=28k | Citizen=6.5k
  {
    id: 'icdl-l1',
    categoryId: 'icdl',
    name: 'ICDL Level 1 — Computer & Online Essentials',
    shortName: 'ICDL Level 1',
    slug: 'icdl-l1',
    duration: '4 weeks',
    mode: 'In-person / Online',
    price: 20000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 1,
    coverImage: '/images/illustrations/course-icdl-l1.svg',
    description:
      'Computer fundamentals, file management, internet safety, email and digital communication basics. Globally recognised and required for Kenyan public service roles.',
    longDescription:
      'The entry-level ICDL qualification covering how computers work, file and folder management, safe internet use, professional email etiquette, and basic digital communication. Internationally recognised and required for Kenyan public service roles.',
    outcomes: [
      'Computer fundamentals',
      'File and folder management',
      'Internet & web browsing',
      'Email professionalism',
      'Online safety basics',
      'Digital communication',
    ],
    prerequisites: ['Basic ability to use a computer or smartphone'],
    careerPaths: ['Office Administrator', 'Data Entry Clerk', 'Customer Service Agent'],
    includes: [
      '4 weeks instruction',
      'Official ICDL exam voucher',
      'Exam practice software',
      'ICDL Level 1 certificate',
    ],
  },
  {
    id: 'icdl-l2',
    categoryId: 'icdl',
    name: 'ICDL Level 2 — Document Production & Presentations',
    shortName: 'ICDL Level 2',
    slug: 'icdl-l2',
    duration: '4 weeks',
    mode: 'In-person / Online',
    price: 22000,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 2,
    coverImage: '/images/illustrations/course-icdl-l2.svg',
    description: 'Word processing, professional document formatting, and creating compelling presentations.',
    longDescription:
      'Build professional document production skills using Microsoft Word and PowerPoint. Learn to create formatted reports, business letters, branded templates, and engaging slideshows used in professional environments.',
    outcomes: [
      'Word processing (MS Word)',
      'Document formatting & styles',
      'Headers, footers & tables',
      'PowerPoint presentations',
      'Visual design basics',
      'Mail merge',
    ],
    prerequisites: ['ICDL Level 1 or basic computer skills'],
    careerPaths: ['Administrative Assistant', 'Secretary', 'Office Manager', 'HR Assistant'],
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
    name: 'ICDL Level 3 — Spreadsheets & Data Management',
    shortName: 'ICDL Level 3',
    slug: 'icdl-l3',
    duration: '5 weeks',
    mode: 'In-person / Online',
    price: 26000,
    currency: 'KES',
    level: 'intermediate',
    sortOrder: 3,
    coverImage: '/images/illustrations/course-icdl-l3.svg',
    description: 'Excel spreadsheets, formulas, data analysis, charts, and database fundamentals.',
    longDescription:
      'Master Microsoft Excel and database fundamentals. Learn to build spreadsheet models with formulas and functions, create charts and pivot tables, and understand how databases store and retrieve information — skills valued across all industries.',
    outcomes: [
      'Excel formulas & functions',
      'Data sorting & filtering',
      'Charts & pivot tables',
      'Database concepts',
      'Data validation',
      'Spreadsheet modelling',
    ],
    prerequisites: ['ICDL Level 2 or equivalent document skills'],
    careerPaths: ['Finance Assistant', 'Data Entry Analyst', 'Accounts Clerk', 'Operations Coordinator'],
    includes: [
      '5 weeks instruction',
      'Official ICDL exam voucher',
      'Exam materials',
      'ICDL Level 3 certificate',
    ],
  },
  {
    id: 'icdl-l45',
    categoryId: 'icdl',
    name: 'ICDL Levels 4 & 5 — Advanced Professional Skills',
    shortName: 'ICDL Levels 4 & 5',
    slug: 'icdl-l45',
    duration: '8 weeks',
    mode: 'Hybrid',
    price: 28000,
    currency: 'KES',
    level: 'advanced',
    sortOrder: 4,
    coverImage: '/images/illustrations/course-icdl-l45.svg',
    description:
      'Advanced Excel, database design, IT security, project planning and computational thinking.',
    longDescription:
      'The advanced tier of ICDL covering complex spreadsheet modelling, relational database design, IT security for business, digital project planning, and computational thinking — the skills that differentiate IT professionals and managers.',
    outcomes: [
      'Advanced Excel & DAX',
      'Database design & SQL basics',
      'IT security & compliance',
      'Project planning tools',
      'Computational thinking',
      'Digital project management',
    ],
    prerequisites: ['ICDL Level 3 or strong general computer skills'],
    careerPaths: ['IT Officer', 'Project Manager', 'Systems Analyst', 'Finance Manager', 'Technical Administrator'],
    includes: [
      '8 weeks instruction',
      '2 ICDL exam vouchers',
      'Project toolkit',
      'ICDL Levels 4 & 5 certificate',
    ],
  },
  {
    id: 'icdl-citizen',
    categoryId: 'icdl',
    name: 'ICDL Digital Citizen',
    shortName: 'Digital Citizen',
    slug: 'icdl-digital-citizen',
    duration: '4 weeks',
    mode: 'Online',
    price: 6500,
    currency: 'KES',
    level: 'beginner',
    sortOrder: 5,
    coverImage: '/images/illustrations/course-icdl-citizen.svg',
    description:
      'Foundational digital literacy for navigating the modern digital economy safely and confidently.',
    longDescription:
      'Designed for individuals new to digital technology, this course covers safe internet use, social media literacy, online communication, e-commerce, mobile banking, and protecting personal data online.',
    outcomes: [
      'Online safety',
      'Social media literacy',
      'Online communication',
      'Digital well-being',
      'E-commerce basics',
      'Mobile money safety',
    ],
    prerequisites: ['Basic smartphone or tablet usage'],
    careerPaths: ['Essential skills for all working adults', 'Foundation for further digital qualifications'],
    includes: ['4 weeks online content', 'ICDL Digital Citizen certificate', 'Online exam'],
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
    coverImage: '/images/illustrations/course-ccna-1.svg',
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
    coverImage: '/images/illustrations/course-ccna-2.svg',
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
    coverImage: '/images/illustrations/course-ccna-3.svg',
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
    coverImage: '/images/illustrations/course-ccna-cert.svg',
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
    coverImage: '/images/illustrations/course-ai-fundamentals.svg',
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
    coverImage: '/images/illustrations/course-ml-python.svg',
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
    coverImage: '/images/illustrations/course-genai-llm.svg',
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
    coverImage: '/images/illustrations/course-ai-business.svg',
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
    coverImage: '/images/illustrations/course-data-python.svg',
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
    coverImage: '/images/illustrations/course-power-bi.svg',
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
    coverImage: '/images/illustrations/course-sql-db.svg',
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
    coverImage: '/images/illustrations/course-advanced-analytics.svg',
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
