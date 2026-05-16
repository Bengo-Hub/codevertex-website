/**
 * Codevertex Website — Prisma Seed
 *
 * Seeds / upserts:
 *  - All Digitika Academy courses (IDs match src/config/courses.ts)
 *  - Sample cohorts linked to courses
 *  - Starter blog posts
 *
 * Run:  pnpm prisma db seed
 * Env:  DATABASE_URL must be set
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Course seed type
// ---------------------------------------------------------------------------

interface CourseSeed {
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
  coverImage?: string;
  outcomes: string[];
  prerequisites: string[];
  careerPaths: string[];
  includes: string[];
  featured?: boolean;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// ICDL custom installment note helper (for description enrichment)
// ---------------------------------------------------------------------------
// Level 1 (20 000): Full | 10k+10k | 10k+5k+5k
// Level 2 (22 000): Full | 11k+11k | 10k+7k+5k
// Level 3 (26 000): Full | 13k+13k | 10k+10k+6k
// Level 4&5 (28 000): Full | 14k+14k | 10k+10k+8k

// ---------------------------------------------------------------------------
// Courses — IDs MUST match src/config/courses.ts
// ---------------------------------------------------------------------------

const COURSES: CourseSeed[] = [
  // ── SOFTWARE ENGINEERING ──────────────────────────────────────────────────
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
    coverImage: '/images/Code-starter-2.png',
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
    coverImage: '/images/coding.png',
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
    coverImage: '/images/coding.png',
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
    coverImage: '/images/coding.png',
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
    coverImage: '/images/IT Support Course.png',
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
    audience: 'Kids (Age 8–13)',
    sortOrder: 6,
    coverImage: '/images/python-programming.png',
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
    audience: 'Teens (Age 13–17)',
    sortOrder: 7,
    coverImage: '/images/Code-starter-2.png',
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
    audience: 'Kids (Age 10–16)',
    sortOrder: 8,
    coverImage: '/images/coding.png',
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

  // ── ICDL ─────────────────────────────────────────────────────────────────
  // Pricing: Level 1=20k | Level 2=22k | Level 3=26k | Level 4&5=28k | Citizen=6.5k
  // Installments (up to 3 allowed for all ICDL courses):
  //   Full | 2-plan | 3-plan (10k+5k+5k split for L1 as reference)
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
    coverImage: '/images/ICDL-core-course.png',
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
    coverImage: '/images/ICDL-core-course.png',
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
    coverImage: '/images/ICDL-core-course.png',
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
    coverImage: '/images/ICDL-core-course.png',
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
    coverImage: '/images/ICDL-core-course.png',
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

  // ── CCNA ─────────────────────────────────────────────────────────────────
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
    coverImage: '/images/Cisco.png',
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
    coverImage: '/images/Cisco.png',
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
    coverImage: '/images/Cisco.png',
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
    coverImage: '/images/Cisco.png',
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
    coverImage: '/images/python-programming.png',
    description:
      'No-code introduction to artificial intelligence. Understand how AI and ML work, and use AI tools to improve your productivity and career.',
    longDescription:
      'A practical, no-code introduction to AI for professionals who want to stay ahead of the curve. You\'ll learn how large language models work, master prompt engineering, and apply AI tools to real business tasks.',
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
    coverImage: '/images/python-programming.png',
    description:
      'Build and deploy machine learning models with Python, scikit-learn, and TensorFlow. From data preprocessing to model evaluation and deployment.',
    longDescription:
      'Hands-on ML engineering from scratch. You\'ll build supervised and unsupervised models, process real datasets, and deploy models via REST APIs. Includes 4 portfolio projects.',
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
    coverImage: '/images/coding.png',
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
    coverImage: '/images/Codevertex-Digital-Marketing.jpg',
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
    coverImage: '/images/python-programming.png',
    description:
      'Master data wrangling, visualisation, and statistical analysis with Python, pandas, and matplotlib. Build a data portfolio employers will love.',
    longDescription:
      'The complete data analytics pipeline — from raw data to actionable insights. You\'ll work with real datasets, build dashboards, and present analysis findings in 4 hands-on portfolio projects.',
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
    coverImage: '/images/Codevertex-Digital-Marketing.jpg',
    description:
      'Build interactive dashboards and reports with Microsoft Power BI. Connect to live data sources and automate executive reporting.',
    longDescription:
      'Master Power BI from data connection to published report. You\'ll write DAX formulas, build interactive dashboards, and publish reports to Power BI Service for executive audiences.',
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
    coverImage: '/images/python-programming.png',
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
    coverImage: '/images/python-programming.png',
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

// ---------------------------------------------------------------------------
// IDs that were changed in the seed (old → new mapping).
// These old records will be deleted before upserting the new ones.
// ---------------------------------------------------------------------------
const DEPRECATED_COURSE_IDS = [
  // ICDL old IDs
  'icdl-core',
  'icdl-advanced',
  'icdl-professional',
  'icdl-digital-citizen',
  // Software old IDs
  'scratch-python',
  'web-design-teens',
  'game-dev',
  'devops-cloud',
  'cybersecurity',
  // CCNA old ID
  'ccna-exam-prep',
  // AI old ID
  'ai-for-business',
  // Data old IDs
  'data-powerbi',
  'data-sql',
  'data-advanced',
];

// ---------------------------------------------------------------------------
// Sample cohorts (linked to course IDs above)
// ---------------------------------------------------------------------------

interface CohortSeed {
  courseId: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  maxSlots: number;
  status: string;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function parseDate(s: string): Date {
  return new Date(s);
}

const COHORTS: CohortSeed[] = [
  // Code-Starter cohorts
  {
    courseId: 'code-starter',
    name: 'Code-Starter — May 2026',
    startDate: parseDate('2026-05-19'),
    endDate: addWeeks(parseDate('2026-05-19'), 10),
    maxSlots: 20,
    status: 'open',
  },
  {
    courseId: 'code-starter',
    name: 'Code-Starter — August 2026',
    startDate: parseDate('2026-08-04'),
    endDate: addWeeks(parseDate('2026-08-04'), 10),
    maxSlots: 20,
    status: 'open',
  },
  // ICDL Level 1
  {
    courseId: 'icdl-l1',
    name: 'ICDL L1 — June 2026',
    startDate: parseDate('2026-06-02'),
    endDate: addWeeks(parseDate('2026-06-02'), 4),
    maxSlots: 25,
    status: 'open',
  },
  {
    courseId: 'icdl-l1',
    name: 'ICDL L1 — July 2026',
    startDate: parseDate('2026-07-07'),
    endDate: addWeeks(parseDate('2026-07-07'), 4),
    maxSlots: 25,
    status: 'open',
  },
  // ICDL Level 2
  {
    courseId: 'icdl-l2',
    name: 'ICDL L2 — June 2026',
    startDate: parseDate('2026-06-02'),
    endDate: addWeeks(parseDate('2026-06-02'), 4),
    maxSlots: 25,
    status: 'open',
  },
  // ICDL Level 3
  {
    courseId: 'icdl-l3',
    name: 'ICDL L3 — July 2026',
    startDate: parseDate('2026-07-07'),
    endDate: addWeeks(parseDate('2026-07-07'), 5),
    maxSlots: 20,
    status: 'open',
  },
  // ICDL Level 4&5
  {
    courseId: 'icdl-l45',
    name: 'ICDL L4&5 — August 2026',
    startDate: parseDate('2026-08-04'),
    endDate: addWeeks(parseDate('2026-08-04'), 8),
    maxSlots: 20,
    status: 'open',
  },
  // Full-Stack
  {
    courseId: 'fullstack',
    name: 'Full-Stack — June 2026',
    startDate: parseDate('2026-06-09'),
    endDate: addWeeks(parseDate('2026-06-09'), 12),
    maxSlots: 15,
    status: 'open',
  },
  // CCNA Part 1
  {
    courseId: 'ccna-1',
    name: 'CCNA Part 1 — May 2026',
    startDate: parseDate('2026-05-26'),
    endDate: addWeeks(parseDate('2026-05-26'), 8),
    maxSlots: 20,
    status: 'open',
  },
  // CCNA Part 2
  {
    courseId: 'ccna-2',
    name: 'CCNA Part 2 — July 2026',
    startDate: parseDate('2026-07-20'),
    endDate: addWeeks(parseDate('2026-07-20'), 8),
    maxSlots: 20,
    status: 'open',
  },
  // AI Fundamentals
  {
    courseId: 'ai-fundamentals',
    name: 'AI Fundamentals — June 2026',
    startDate: parseDate('2026-06-16'),
    endDate: addWeeks(parseDate('2026-06-16'), 6),
    maxSlots: 30,
    status: 'open',
  },
  // Data Analytics with Python
  {
    courseId: 'data-python',
    name: 'Data Analytics — July 2026',
    startDate: parseDate('2026-07-14'),
    endDate: addWeeks(parseDate('2026-07-14'), 10),
    maxSlots: 20,
    status: 'open',
  },
  // Kids Coding
  {
    courseId: 'kids-scratch',
    name: 'Kids Coding — August 2026',
    startDate: parseDate('2026-08-03'),
    endDate: addWeeks(parseDate('2026-08-03'), 8),
    maxSlots: 15,
    status: 'open',
  },
  // Cybersecurity
  {
    courseId: 'cybersec',
    name: 'Cybersecurity — June 2026',
    startDate: parseDate('2026-06-23'),
    endDate: addWeeks(parseDate('2026-06-23'), 6),
    maxSlots: 20,
    status: 'open',
  },
];

// ---------------------------------------------------------------------------
// Blog posts (starter content)
// ---------------------------------------------------------------------------

interface BlogSeed {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  coverImage?: string;
  tags: string[];
  published: boolean;
  publishedAt: Date;
}

const BLOG_POSTS: BlogSeed[] = [
  {
    slug: 'closing-africas-digital-skills-gap',
    title: "Closing Africa's Digital Skills Gap — One Developer at a Time",
    excerpt:
      "Africa's tech talent shortage is real, but so is the opportunity. Here's how Digitika Academy is tackling the challenge from Kisumu.",
    content: `Africa's digital economy is growing at 12% annually, yet the continent faces a shortfall of over 600,000 qualified tech workers by 2030. At Codevertex, we believe the solution isn't just importing talent — it's building it locally.

## Why Kisumu?

Kisumu is Kenya's third-largest city, home to a vibrant university ecosystem with Maseno University, KCA University, and Great Lakes University of Kisumu. Yet historically, tech education here has lagged behind Nairobi. We saw an opportunity.

When we launched Digitika Academy, we started small — a single Code-Starter cohort of 12 students in a rented room at Pioneer House. Today, we've trained over 120 certified developers and certified 200+ corporate staff across ICDL and CCNA programmes.

## What Works

The biggest lesson: practical beats theoretical. Students who spend 70% of class time writing real code outperform those who spend the majority reading about it. Our 10-week Code-Starter bootcamp is built on this insight — every session produces something a student can show a potential employer.

ICDL certification has proven equally powerful. Many employers in East Africa now require ICDL Core as a baseline qualification for office roles. We're proud that our pass rate consistently exceeds 90%.

## What's Next

We're expanding our AI programme to meet surging demand from businesses navigating the generative AI transition. Our "AI for Business" weekend cohort sold out in 72 hours in its first run. We're adding a second cohort monthly.

*— The Codevertex Team*`,
    author: 'Codevertex Editorial',
    coverImage: '/images/students.jpg',
    tags: ['education', 'digitika', 'africa', 'skills-gap'],
    published: true,
    publishedAt: new Date('2026-02-15'),
  },
  {
    slug: 'why-east-african-businesses-need-ai-now',
    title: 'Why East African Businesses Can No Longer Afford to Ignore AI',
    excerpt:
      'The AI transition is here — and businesses that adopt early will have an insurmountable advantage.',
    content: `Artificial intelligence is no longer a Silicon Valley curiosity. It is reshaping logistics in Mombasa, customer service in Nairobi, and agriculture across the region.

## The Reality Check

A Codevertex client — a regional logistics company — was spending KES 2.4M monthly on manual route planning and customer communication. After integrating our AI-powered platform, that cost dropped to KES 380,000. The difference? Automated route optimisation and an AI chat assistant handling 68% of customer queries without human intervention.

## Three High-ROI AI Applications for East African Businesses

**1. Customer Support Automation** — AI chatbots trained on your knowledge base can handle repeat questions 24/7 — in Swahili, English, or both.

**2. Predictive Inventory Management** — ML models analysing your historical sales data can predict stockouts 2–3 weeks in advance.

**3. Financial Reconciliation** — AI-powered bookkeeping tools can match M-Pesa receipts to invoices automatically.

Ready to explore what AI can do for your business? [Contact our team](/contact) for a free discovery call.`,
    author: 'Codevertex Editorial',
    coverImage: '/images/team.jpg',
    tags: ['ai', 'business', 'east-africa', 'automation'],
    published: true,
    publishedAt: new Date('2026-03-10'),
  },
  {
    slug: 'power-suite-the-integrated-platform-for-african-enterprises',
    title: 'Power Suite: The Integrated Platform Built for African Enterprises',
    excerpt:
      'One login, one support team, one integrated platform — why fragmented software stacks are costing businesses more than they think.',
    content: `The average mid-sized East African business uses 11 separate software tools — many of which don't talk to each other.

## What We Built

Codevertex Power Suite is a fully integrated collection of enterprise products that share a single authentication layer, a common data model, and a unified support team:

- **Ordering** — multi-tenant online ordering with real-time tracking
- **POS** — offline-capable point of sale for retail and hospitality
- **Books** — treasury, invoicing, and M-Pesa/Paystack payments
- **Inventory** — real-time stock and procurement management
- **MarketFlow CRM** — AI-powered marketing automation and lead management
- **Notifications** — SMS, email, and push notification delivery

## Built for African Realities

M-Pesa integration isn't a plugin — it's native. Offline-first POS means a slow connection doesn't stop a sale. Swahili support is built in, not bolted on.

*Want to see Power Suite in action? [Book a demo](/contact) with our team.*`,
    author: 'Codevertex Editorial',
    coverImage: '/images/hub.jpg',
    tags: ['power-suite', 'enterprise', 'saas', 'integration'],
    published: true,
    publishedAt: new Date('2026-04-05'),
  },
];

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Seeding Codevertex website database...');

  // ── Courses ──────────────────────────────────────────────────────────────
  console.log('\n🗑️  Removing deprecated course IDs...');
  const deleted = await prisma.course.deleteMany({
    where: { id: { in: DEPRECATED_COURSE_IDS } },
  });
  console.log(`  ✓ Removed ${deleted.count} deprecated course(s)`);

  console.log(`\n📚 Seeding ${COURSES.length} courses...`);
  for (const course of COURSES) {
    const data = { ...course, featured: course.featured ?? false };
    await prisma.course.upsert({
      where: { id: course.id },
      create: data,
      update: data,
    });
    console.log(`  ✓ ${course.name}`);
  }

  // ── Cohorts ───────────────────────────────────────────────────────────────
  // Find existing cohorts by name to avoid duplicates on re-runs.
  console.log(`\n📅 Seeding ${COHORTS.length} cohorts...`);
  for (const cohort of COHORTS) {
    const existing = await prisma.cohort.findFirst({
      where: { name: cohort.name, courseId: cohort.courseId },
    });
    if (!existing) {
      await prisma.cohort.create({ data: cohort });
      console.log(`  ✓ Created: ${cohort.name}`);
    } else {
      await prisma.cohort.update({
        where: { id: existing.id },
        data: {
          startDate: cohort.startDate,
          endDate: cohort.endDate,
          maxSlots: cohort.maxSlots,
          status: cohort.status,
        },
      });
      console.log(`  ↺ Updated: ${cohort.name}`);
    }
  }

  // ── Blog posts ────────────────────────────────────────────────────────────
  console.log(`\n📝 Seeding ${BLOG_POSTS.length} blog posts...`);
  for (const post of BLOG_POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: post,
      update: post,
    });
    console.log(`  ✓ ${post.title}`);
  }

  console.log('\n✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
