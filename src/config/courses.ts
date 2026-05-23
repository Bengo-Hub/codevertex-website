// Digitika Academy course catalog

export interface InstallmentPlan {
  label: string;
  payments: { amount: number; label: string }[];
  totalAmount: number;
  badge?: string;
}

export interface WeeklyModule {
  week: number | string;
  title: string;
  topics: string[];
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar?: string;
}

export interface Course {
  id: string;
  name: string;
  shortName?: string;
  duration: string;
  mode: string;
  price: number;
  currency: string;
  description: string;
  longDescription?: string;
  outcomes: string[];
  stack?: string;
  audience?: string;
  featured?: boolean;
  cohortSize?: number;
  startDate?: string;
  location?: string;
  curriculum?: WeeklyModule[];
  installmentPlans?: InstallmentPlan[];
  testimonials?: Testimonial[];
  alumniCompanies?: { name: string; logo: string }[];
  brochure?: string;
  includes?: string[];
  prerequisites?: string[];
  careerPaths?: string[];
  coverImage?: string;
}

// Cover images mapped by course ID — sourced from public/images/illustrations/
export const COURSE_COVER_IMAGES: Record<string, string> = {
  // Software Engineering
  'code-starter':   '/images/illustrations/course-code-starter.svg',
  'fullstack':      '/images/illustrations/course-fullstack.svg',
  'mobile-dev':     '/images/illustrations/course-mobile-dev.svg',
  'devops':         '/images/illustrations/course-devops.svg',
  'cybersec':       '/images/illustrations/course-cybersec.svg',
  'kids-scratch':   '/images/illustrations/course-kids-scratch.svg',
  'teens-web':      '/images/illustrations/course-teens-web.svg',
  'kids-games':     '/images/illustrations/course-kids-games.svg',
  // ICDL
  'icdl-l1':       '/images/illustrations/course-icdl-l1.svg',
  'icdl-l2':       '/images/illustrations/course-icdl-l2.svg',
  'icdl-l3':       '/images/illustrations/course-icdl-l3.svg',
  'icdl-l45':      '/images/illustrations/course-icdl-l45.svg',
  'icdl-citizen':  '/images/illustrations/course-icdl-citizen.svg',
  // CCNA
  'ccna-1':        '/images/illustrations/course-ccna-1.svg',
  'ccna-2':        '/images/illustrations/course-ccna-2.svg',
  'ccna-3':        '/images/illustrations/course-ccna-3.svg',
  'ccna-cert':     '/images/illustrations/course-ccna-cert.svg',
  // AI
  'ai-fundamentals': '/images/illustrations/course-ai-fundamentals.svg',
  'ml-python':       '/images/illustrations/course-ml-python.svg',
  'genai-llm':       '/images/illustrations/course-genai-llm.svg',
  'ai-business':     '/images/illustrations/course-ai-business.svg',
  // Data Analytics
  'data-python':          '/images/illustrations/course-data-python.svg',
  'power-bi':             '/images/illustrations/course-power-bi.svg',
  'sql-db':               '/images/illustrations/course-sql-db.svg',
  'advanced-analytics':   '/images/illustrations/course-advanced-analytics.svg',
};

export interface CourseCategory {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  courses: Course[];
}

// --- Shared alumni data ---
export const ALUMNI_COMPANIES = [
  { name: 'Safaricom PLC', logo: '/images/safaricom-plc.png' },
  { name: 'Boxcraft', logo: '/images/boxcraft.png' },
  { name: 'Danka Africa', logo: '/images/danka-africa.jpeg' },
  { name: 'Maseno University', logo: '/images/maseno-university.png' },
  { name: 'Great Lakes University of Kisumu', logo: '/images/gluk.png' },
];

export const GRADUATE_TESTIMONIALS: Testimonial[] = [
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

export const COURSE_CATEGORIES: CourseCategory[] = [
  {
    id: 'software',
    name: 'Software Engineering',
    tagline: 'Adults & Kids Programs',
    description: 'Industry-aligned coding programmes for working professionals, beginners, and young learners aged 8–17.',
    color: '#10B981',
    courses: [
      {
        id: 'code-starter',
        name: 'Code-Starter — Introduction to Software Engineering',
        shortName: 'Code-Starter',
        duration: '10 weeks',
        mode: 'Hybrid (Kisumu + Online)',
        price: 30000,
        currency: 'KES',
        featured: true,
        cohortSize: 20,
        location: 'Pioneer House, 2nd Floor, Room 204A, Kisumu',
        description: 'The ultimate beginner-to-employable software engineering bootcamp. 10 weeks, 2 ICDL certifications, 3+ GitHub projects, and a career roadmap.',
        longDescription: 'Code-Starter is Digitika\'s flagship programme — a 10-week intensive bootcamp that takes complete beginners to job-ready developers. You\'ll cover web development, Python, JavaScript, and AI tools while earning 2 ICDL certifications along the way. Sessions are hybrid: in-person at our Kisumu hub with live Zoom access for remote learners.',
        outcomes: ['HTML, CSS & responsive design', 'Python fundamentals & automation', 'JavaScript & DOM manipulation', 'Git, GitHub & collaboration', 'AI-assisted development workflow', '2 ICDL certifications', '3+ GitHub portfolio projects', 'Career roadmap session'],
        stack: 'HTML, CSS, Tailwind, Python, JavaScript, Git, GitHub, VS Code, AI tools',
        audience: 'Adults (complete beginners welcome)',
        curriculum: CODE_STARTER_CURRICULUM,
        installmentPlans: CODE_STARTER_INSTALLMENTS,
        testimonials: GRADUATE_TESTIMONIALS,
        alumniCompanies: ALUMNI_COMPANIES,
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
      },
      {
        id: 'fullstack',
        name: 'Full-Stack Web Development',
        shortName: 'Full-Stack Dev',
        duration: '12 weeks',
        mode: 'In-person / Online',
        price: 45000,
        currency: 'KES',
        description: 'Build modern web applications from frontend to backend with real-world projects and production-ready code.',
        longDescription: 'A comprehensive 12-week programme covering everything from React frontends to Node.js backends and PostgreSQL databases. You\'ll ship 4+ production-quality projects and leave with a portfolio that gets you hired.',
        outcomes: ['React frontends', 'Node.js backends', 'PostgreSQL databases', 'REST & GraphQL APIs', 'Authentication & security', 'Cloud deployment', 'Testing fundamentals'],
        stack: 'HTML, CSS, JavaScript, React, Node.js, Express, PostgreSQL, Git, Docker',
        audience: 'Adults',
        prerequisites: ['Basic HTML/CSS knowledge', 'Some programming experience recommended', 'Laptop required'],
        careerPaths: ['Full-Stack Developer', 'Frontend Engineer', 'Backend Developer', 'Software Engineer'],
        installmentPlans: makeInstallmentPlans(45000, ['Week 6', 'Week 10']),
      },
      {
        id: 'mobile-dev',
        name: 'Mobile App Development',
        shortName: 'Mobile Dev',
        duration: '10 weeks',
        mode: 'Online / Hybrid',
        price: 38000,
        currency: 'KES',
        description: 'Cross-platform mobile app development for Android and iOS with React Native & Flutter.',
        longDescription: 'Build real mobile apps for both Android and iOS using React Native and Flutter. Covers UI design, state management, push notifications, camera integration, and deploying to the App Store and Google Play.',
        outcomes: ['React Native apps', 'Flutter basics', 'Push notifications', 'App Store deployment', 'Firebase integration', 'Mobile UI/UX'],
        stack: 'React Native, Flutter, Dart, Firebase, REST APIs, Expo',
        audience: 'Adults',
        prerequisites: ['JavaScript fundamentals', 'Basic programming experience'],
        careerPaths: ['Mobile Developer', 'React Native Developer', 'Flutter Developer'],
        installmentPlans: makeInstallmentPlans(38000, ['Week 5', 'Week 8']),
      },
      {
        id: 'devops',
        name: 'Cloud Engineering & DevOps',
        shortName: 'Cloud & DevOps',
        duration: '10 weeks',
        mode: 'Online',
        price: 42000,
        currency: 'KES',
        description: 'Modern DevOps practices: CI/CD, containerisation, Kubernetes, and cloud-native architecture.',
        longDescription: 'Learn the tools and practices that power modern software delivery — Docker, Kubernetes, CI/CD pipelines, infrastructure as code, and cloud platforms. Highly in-demand skills for engineering teams at any scale.',
        outcomes: ['Docker & Kubernetes', 'CI/CD pipelines', 'AWS / GCP basics', 'Infrastructure as Code', 'Monitoring & logging', 'GitOps workflows'],
        stack: 'Docker, Kubernetes, GitHub Actions, AWS, GCP, Terraform, Nginx',
        audience: 'Adults',
        prerequisites: ['Linux command line basics', 'Some programming experience'],
        careerPaths: ['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer', 'Platform Engineer'],
        installmentPlans: makeInstallmentPlans(42000, ['Week 5', 'Week 8']),
      },
      {
        id: 'cybersec',
        name: 'Cybersecurity Fundamentals',
        shortName: 'Cybersecurity',
        duration: '6 weeks',
        mode: 'In-person / Online',
        price: 28000,
        currency: 'KES',
        description: 'Foundations of information security, ethical hacking, and compliance for the modern digital landscape.',
        longDescription: 'Understand how attackers think and how to defend against them. Covers network security, vulnerability assessment, penetration testing basics, and security compliance frameworks used in Kenyan and international enterprises.',
        outcomes: ['Network security', 'Ethical hacking basics', 'Vulnerability assessment', 'Security compliance', 'Incident response', 'OWASP Top 10'],
        stack: 'Kali Linux, Wireshark, Metasploit, OWASP tools, Nmap',
        audience: 'Adults',
        brochure: '/brochures/IT-SUPPORT-BROCHURE.pdf',
        prerequisites: ['Basic networking concepts', 'Linux basics helpful but not required'],
        careerPaths: ['Security Analyst', 'Ethical Hacker', 'IT Security Officer', 'Penetration Tester'],
        installmentPlans: makeInstallmentPlans(28000, ['Week 3', 'Week 5']),
      },
      {
        id: 'kids-scratch',
        name: 'Coding for Kids — Scratch & Python',
        shortName: 'Kids Coding',
        duration: '8 weeks',
        mode: 'In-person / Online',
        price: 8000,
        currency: 'KES',
        description: 'Fun, project-based coding for kids aged 8–13. Build games, animations, and interactive stories.',
        longDescription: 'Kids learn to think like programmers through visual Scratch projects and introductory Python. Every lesson is game-based and project-driven — kids build something new each week and graduate with a mini-portfolio of games and apps.',
        outcomes: ['Scratch programming', 'Python basics', 'Logical thinking', 'Mini game creation', 'Creative problem-solving'],
        stack: 'Scratch, Python (Turtle, basics)',
        audience: 'Kids (Age 8–13)',
        prerequisites: ['Basic computer operation', 'Parental consent form required'],
        careerPaths: ['Foundation for future tech career', 'STEM enrichment'],
        installmentPlans: makeInstallmentPlans(8000, ['Week 4', 'Week 7']),
      },
      {
        id: 'teens-web',
        name: 'Web Design for Teens',
        shortName: 'Teen Web Design',
        duration: '8 weeks',
        mode: 'In-person / Online',
        price: 12000,
        currency: 'KES',
        description: 'Teens aged 13–17 build their own websites and web apps using real industry tools.',
        longDescription: 'A practical introduction to web development for teenagers. Students design and build real websites using industry-standard tools, and graduate with a live website they built themselves — great for CVs and university applications.',
        outcomes: ['HTML & CSS', 'JavaScript basics', 'Responsive design', 'Deploy a live site', 'Portfolio project'],
        stack: 'HTML5, CSS3, JavaScript, VS Code, GitHub Pages',
        audience: 'Teens (Age 13–17)',
        prerequisites: ['Basic computer skills', 'Parental consent form required'],
        careerPaths: ['Pathway to adult software engineering programmes', 'Portfolio for tech applications'],
        installmentPlans: makeInstallmentPlans(12000, ['Week 4', 'Week 7']),
      },
      {
        id: 'kids-games',
        name: 'Game Development for Kids',
        shortName: 'Game Dev Kids',
        duration: '6 weeks',
        mode: 'In-person',
        price: 10000,
        currency: 'KES',
        description: 'Create fun 2D games using Pygame and Unity basics in a hands-on studio environment.',
        longDescription: 'Kids aged 10–16 learn game design fundamentals, physics, and programming through building their own 2D games. Sessions are fast-paced and creative — students playtest each other\'s games each week.',
        outcomes: ['Game mechanics', 'Pygame basics', 'Unity 2D intro', 'Creative problem-solving', 'Game design principles'],
        stack: 'Python (Pygame), Unity (C# basics)',
        audience: 'Kids (Age 10–16)',
        prerequisites: ['Some computer familiarity', 'Parental consent form required'],
        careerPaths: ['Foundation for game development career', 'STEM pathway'],
        installmentPlans: makeInstallmentPlans(10000, ['Week 3', 'Week 5']),
      },
    ],
  },
  {
    id: 'icdl',
    name: 'ICDL Certification',
    tagline: 'International Computer Driving Licence',
    description: 'Globally recognised ICT competency certification for professionals and corporate workforce development.',
    color: '#9100B0',
    courses: [
      {
        id: 'icdl-l1',
        name: 'ICDL Level 1 — Computer & Online Essentials',
        shortName: 'ICDL Level 1',
        duration: '4 weeks',
        mode: 'In-person / Online',
        price: 20000,
        currency: 'KES',
        description: 'Computer fundamentals, file management, internet safety, email and digital communication basics.',
        longDescription: 'The entry-level ICDL qualification covering how computers work, file and folder management, safe internet use, professional email etiquette, and basic digital communication. Internationally recognised and required for Kenyan public service roles.',
        outcomes: ['Computer fundamentals', 'File and folder management', 'Internet & web browsing', 'Email professionalism', 'Online safety basics', 'Digital communication'],
        brochure: '/brochures/Codevertex_Digitika_Program_Cert_Samples.pdf',
        careerPaths: ['Office Administrator', 'Data Entry Clerk', 'Customer Service Agent'],
        prerequisites: ['Basic ability to use a computer or smartphone'],
        installmentPlans: makeInstallmentPlans(20000, ['Week 2', 'Week 3']),
      },
      {
        id: 'icdl-l2',
        name: 'ICDL Level 2 — Document Production & Presentations',
        shortName: 'ICDL Level 2',
        duration: '4 weeks',
        mode: 'In-person / Online',
        price: 22000,
        currency: 'KES',
        description: 'Word processing, professional document formatting, and creating compelling presentations.',
        longDescription: 'Build professional document production skills using Microsoft Word and PowerPoint. Learn to create formatted reports, business letters, branded templates, and engaging slideshows used in professional environments.',
        outcomes: ['Word processing (MS Word)', 'Document formatting & styles', 'Headers, footers & tables', 'PowerPoint presentations', 'Visual design basics', 'Mail merge'],
        careerPaths: ['Administrative Assistant', 'Secretary', 'Office Manager', 'HR Assistant'],
        prerequisites: ['ICDL Level 1 or basic computer skills'],
        installmentPlans: makeInstallmentPlans(22000, ['Week 2', 'Week 3']),
      },
      {
        id: 'icdl-l3',
        name: 'ICDL Level 3 — Spreadsheets & Data Management',
        shortName: 'ICDL Level 3',
        duration: '5 weeks',
        mode: 'In-person / Online',
        price: 26000,
        currency: 'KES',
        description: 'Excel spreadsheets, formulas, data analysis, charts, and database fundamentals.',
        longDescription: 'Master Microsoft Excel and database fundamentals. Learn to build spreadsheet models with formulas and functions, create charts and pivot tables, and understand how databases store and retrieve information — skills valued across all industries.',
        outcomes: ['Excel formulas & functions', 'Data sorting & filtering', 'Charts & pivot tables', 'Database concepts', 'Data validation', 'Spreadsheet modelling'],
        careerPaths: ['Finance Assistant', 'Data Entry Analyst', 'Accounts Clerk', 'Operations Coordinator'],
        prerequisites: ['ICDL Level 2 or equivalent document skills'],
        installmentPlans: makeInstallmentPlans(26000, ['Week 3', 'Week 4']),
      },
      {
        id: 'icdl-l45',
        name: 'ICDL Levels 4 & 5 — Advanced Professional Skills',
        shortName: 'ICDL Levels 4 & 5',
        duration: '8 weeks',
        mode: 'Hybrid',
        price: 28000,
        currency: 'KES',
        description: 'Advanced Excel, database design, IT security, project planning and computational thinking.',
        longDescription: 'The advanced tier of ICDL covering complex spreadsheet modelling, relational database design, IT security for business, digital project planning, and computational thinking — the skills that differentiate IT professionals and managers.',
        outcomes: ['Advanced Excel & DAX', 'Database design & SQL basics', 'IT security & compliance', 'Project planning tools', 'Computational thinking', 'Digital project management'],
        careerPaths: ['IT Officer', 'Project Manager', 'Systems Analyst', 'Finance Manager', 'Technical Administrator'],
        prerequisites: ['ICDL Level 3 or strong general computer skills'],
        installmentPlans: makeInstallmentPlans(28000, ['Week 4', 'Week 6']),
      },
      {
        id: 'icdl-citizen',
        name: 'ICDL Digital Citizen',
        shortName: 'Digital Citizen',
        duration: '4 weeks',
        mode: 'Online',
        price: 6500,
        currency: 'KES',
        description: 'Foundational digital literacy for navigating the modern digital economy safely and confidently.',
        longDescription: 'Designed for individuals new to digital technology, this course covers safe internet use, social media literacy, online communication, e-commerce, mobile banking, and protecting personal data online.',
        outcomes: ['Online safety', 'Social media literacy', 'Online communication', 'Digital well-being', 'E-commerce basics', 'Mobile money safety'],
        careerPaths: ['Essential skills for all working adults', 'Foundation for further digital qualifications'],
        prerequisites: ['Basic smartphone or tablet usage'],
        installmentPlans: makeInstallmentPlans(6500, ['Week 2', 'Week 3']),
      },
    ],
  },
  {
    id: 'ccna',
    name: 'Cisco CCNA v7',
    tagline: 'Networking & Industry Certification',
    description: 'Industry-standard Cisco networking curriculum. Prepares students for the CCNA 200-301 exam.',
    color: '#0EA5E9',
    courses: [
      {
        id: 'ccna-1',
        name: 'CCNA v7 Part 1 — Introduction to Networks',
        shortName: 'CCNA Part 1',
        duration: '8 weeks',
        mode: 'In-person / Online',
        price: 22000,
        currency: 'KES',
        description: 'OSI model, TCP/IP, IPv4/IPv6 addressing, Ethernet fundamentals, and Cisco IOS basics.',
        longDescription: 'The first module of the Cisco CCNA curriculum. You\'ll build a solid foundation in how networks work — from the physical layer to application protocols — and practice configuring Cisco routers and switches in simulated labs.',
        outcomes: ['OSI & TCP/IP models', 'IPv4/IPv6 addressing', 'Ethernet & LAN basics', 'Cisco IOS CLI', 'Subnetting', 'Basic router configuration'],
        stack: 'Cisco Packet Tracer, IOS CLI',
        careerPaths: ['Network Technician', 'IT Support', 'Network Engineer (with Parts 2 & 3)'],
        prerequisites: ['Basic computer skills', 'Interest in networking'],
        installmentPlans: makeInstallmentPlans(22000, ['Week 4', 'Week 6']),
      },
      {
        id: 'ccna-2',
        name: 'CCNA v7 Part 2 — Switching, Routing & Wireless',
        shortName: 'CCNA Part 2',
        duration: '8 weeks',
        mode: 'In-person / Online',
        price: 22000,
        currency: 'KES',
        description: 'VLANs, inter-VLAN routing, STP, EtherChannel, OSPF, DHCP, NAT, and wireless LANs.',
        longDescription: 'Dive deeper into enterprise networking — configure VLANs for network segmentation, implement OSPF routing, set up DHCP and NAT, and design wireless LAN solutions. Heavy focus on practical Packet Tracer labs.',
        outcomes: ['VLANs & trunking', 'OSPF routing', 'Wireless LAN setup', 'NAT & DHCP', 'STP & EtherChannel', 'Inter-VLAN routing'],
        stack: 'Cisco Packet Tracer, IOS CLI',
        careerPaths: ['Network Engineer', 'Systems Administrator', 'IT Infrastructure Specialist'],
        prerequisites: ['CCNA Part 1 or equivalent knowledge'],
        installmentPlans: makeInstallmentPlans(22000, ['Week 4', 'Week 6']),
      },
      {
        id: 'ccna-3',
        name: 'CCNA v7 Part 3 — Enterprise Networking & Security',
        shortName: 'CCNA Part 3',
        duration: '8 weeks',
        mode: 'In-person / Online',
        price: 22000,
        currency: 'KES',
        description: 'OSPF multi-area, SD-WAN, network security, automation and programmability.',
        longDescription: 'The final module before the CCNA exam. Covers advanced routing with multi-area OSPF, SD-WAN concepts, ACLs for security, QoS, and an introduction to network automation with Python and Ansible.',
        outcomes: ['Multi-area OSPF', 'SD-WAN concepts', 'ACLs & firewalls', 'Network automation', 'QoS fundamentals', 'Python for networking'],
        stack: 'Cisco Packet Tracer, Python, Ansible basics',
        careerPaths: ['CCNA-Certified Network Engineer', 'Network Security Specialist', 'Network Automation Engineer'],
        prerequisites: ['CCNA Parts 1 & 2 or equivalent'],
        installmentPlans: makeInstallmentPlans(22000, ['Week 4', 'Week 6']),
      },
      {
        id: 'ccna-cert',
        name: 'CCNA 200-301 Exam Prep',
        shortName: 'CCNA Exam Prep',
        duration: '4 weeks',
        mode: 'In-person',
        price: 15000,
        currency: 'KES',
        description: 'Intensive exam preparation with mock tests, labs, and one-on-one mentorship for the CCNA 200-301.',
        longDescription: 'A focused 4-week intensive to get you exam-ready. Includes timed mock exams, hands-on lab practicals, personalised feedback on weak areas, and proven study strategies from instructors who have passed the CCNA.',
        outcomes: ['Full exam simulation', 'Lab practicals', 'CCNA 200-301 readiness', 'Study strategy sessions', 'Personalised feedback'],
        careerPaths: ['CCNA Certified Engineer', 'Network Administrator'],
        prerequisites: ['Completion of CCNA Parts 1–3 or equivalent'],
        installmentPlans: makeInstallmentPlans(15000, ['Week 2', 'Week 3']),
      },
    ],
  },
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    tagline: 'From Fundamentals to LLM Engineering',
    description: 'The most in-demand AI skills since 2025. Learn to build, deploy and monetise AI solutions.',
    color: '#8B5CF6',
    courses: [
      {
        id: 'ai-fundamentals',
        name: 'AI Fundamentals & Prompt Engineering',
        shortName: 'AI Fundamentals',
        duration: '4 weeks',
        mode: 'Online / Hybrid',
        price: 14000,
        currency: 'KES',
        description: 'AI concepts, machine learning basics, and mastering prompt engineering with ChatGPT, Claude & Gemini.',
        longDescription: 'Your entry point into the AI economy. No coding required for the first half — understand how LLMs work, learn professional prompt engineering, and discover how to use AI tools to 10x your productivity in any role.',
        outcomes: ['LLM concepts', 'Prompt engineering', 'AI tool stack mastery', 'Use-case discovery', 'AI ethics & safety', 'Building AI workflows'],
        stack: 'Python, ChatGPT API, Claude API, LangChain basics',
        careerPaths: ['AI Prompt Engineer', 'AI Product Manager', 'AI-augmented professional in any field'],
        prerequisites: ['No coding experience required', 'Basic computer skills'],
        installmentPlans: makeInstallmentPlans(14000, ['Week 2', 'Week 3']),
      },
      {
        id: 'ml-python',
        name: 'Machine Learning with Python',
        shortName: 'ML with Python',
        duration: '10 weeks',
        mode: 'Online / Hybrid',
        price: 32000,
        currency: 'KES',
        description: 'End-to-end ML pipeline: data preprocessing, model training, evaluation and deployment.',
        longDescription: 'Build real machine learning models from scratch. Covers the full ML lifecycle — data cleaning, feature engineering, model selection, hyperparameter tuning, evaluation, and deploying models as APIs. Industry-project based.',
        outcomes: ['Data preprocessing', 'Scikit-learn models', 'Model evaluation & tuning', 'ML deployment', 'Feature engineering', 'Model monitoring'],
        stack: 'Python, Scikit-learn, TensorFlow, Pandas, NumPy, Jupyter',
        careerPaths: ['ML Engineer', 'Data Scientist', 'AI Developer'],
        prerequisites: ['Python basics', 'Basic statistics recommended'],
        installmentPlans: makeInstallmentPlans(32000, ['Week 5', 'Week 8']),
      },
      {
        id: 'genai-llm',
        name: 'Generative AI & LLM Engineering',
        shortName: 'GenAI & LLMs',
        duration: '8 weeks',
        mode: 'Online / Hybrid',
        price: 38000,
        currency: 'KES',
        description: 'Build production-ready AI apps using OpenAI, Hugging Face, RAG pipelines, and vector databases.',
        longDescription: 'The most advanced AI course in the Digitika catalogue. You\'ll build real generative AI applications — custom chatbots, document Q&A systems, and multi-agent pipelines — using the same tools used by AI startups worldwide.',
        outcomes: ['RAG pipeline architecture', 'Fine-tuning LLMs', 'Vector databases (Pinecone, pgvector)', 'AI API integration', 'Multi-agent systems', 'Production AI deployment'],
        stack: 'Python, OpenAI API, Hugging Face, LangChain, Pinecone, FastAPI, Docker',
        careerPaths: ['AI/LLM Engineer', 'AI Startup Founder', 'Senior AI Developer'],
        prerequisites: ['Python intermediate', 'Basic ML knowledge', 'REST API experience'],
        installmentPlans: makeInstallmentPlans(38000, ['Week 4', 'Week 6']),
      },
      {
        id: 'ai-business',
        name: 'AI for Business Leaders (No-Code)',
        shortName: 'AI for Business',
        duration: '2 weeks',
        mode: 'Online',
        price: 9000,
        currency: 'KES',
        description: 'Non-technical programme for executives. Understand AI strategy, use-case identification, and AI tooling.',
        longDescription: 'Designed for CEOs, managers, and decision-makers who need to understand AI without becoming engineers. Learn to identify AI opportunities in your business, evaluate AI vendors, manage AI projects, and lead AI transformation.',
        outcomes: ['AI strategy development', 'No-code AI tools', 'ROI of AI projects', 'Ethical AI governance', 'AI vendor evaluation', 'Team AI upskilling'],
        stack: 'Make, Zapier, ChatGPT, Microsoft Copilot, Google AI tools',
        careerPaths: ['AI-ready executive', 'Digital transformation leader'],
        prerequisites: ['No technical background required', 'Business or management experience'],
        installmentPlans: makeInstallmentPlans(9000, ['Week 1', 'Week 2']),
      },
    ],
  },
  {
    id: 'data',
    name: 'Data Analytics',
    tagline: 'Turn Data into Strategic Intelligence',
    description: 'From SQL to advanced BI dashboards — build the data skills companies pay top salaries for.',
    color: '#F59E0B',
    courses: [
      {
        id: 'data-python',
        name: 'Data Analytics with Python',
        shortName: 'Data Analytics',
        duration: '8 weeks',
        mode: 'Online / Hybrid',
        price: 28000,
        currency: 'KES',
        description: 'Clean, analyse and visualise data using Python\'s leading data science libraries.',
        longDescription: 'A practical, project-driven introduction to data analytics. You\'ll work with real-world datasets — cleaning messy data, finding patterns, building charts, and presenting insights in business-ready format.',
        outcomes: ['Data wrangling', 'Exploratory analysis', 'Statistical thinking', 'Dashboard creation', 'Data storytelling', 'Automation scripts'],
        stack: 'Python, Pandas, NumPy, Matplotlib, Seaborn, Plotly, Jupyter',
        careerPaths: ['Data Analyst', 'Business Analyst', 'Research Analyst'],
        prerequisites: ['Basic Python knowledge', 'Basic statistics helpful'],
        installmentPlans: makeInstallmentPlans(28000, ['Week 4', 'Week 6']),
      },
      {
        id: 'power-bi',
        name: 'Business Intelligence & Power BI',
        shortName: 'Power BI',
        duration: '4 weeks',
        mode: 'Online / Hybrid',
        price: 16000,
        currency: 'KES',
        description: 'Build executive-grade dashboards and reports using Microsoft Power BI and DAX.',
        longDescription: 'Learn to turn raw data into boardroom-ready dashboards using Power BI — Microsoft\'s leading BI platform. Covers data modelling, DAX formulas, interactive reports, and publishing to the Power BI service.',
        outcomes: ['Power BI dashboards', 'DAX formulas', 'Data modelling', 'KPI reporting', 'Power BI Service publishing'],
        stack: 'Microsoft Power BI, DAX, Power Query, SQL, Excel',
        careerPaths: ['BI Analyst', 'Reporting Analyst', 'Finance Analyst'],
        prerequisites: ['Basic Excel skills', 'Basic understanding of databases helpful'],
        installmentPlans: makeInstallmentPlans(16000, ['Week 2', 'Week 3']),
      },
      {
        id: 'sql-db',
        name: 'SQL & Database Management',
        shortName: 'SQL & Databases',
        duration: '4 weeks',
        mode: 'Online / Hybrid',
        price: 12000,
        currency: 'KES',
        description: 'Master relational databases and SQL from fundamentals to advanced querying.',
        longDescription: 'SQL is the language of data — used in every analytics, engineering, and business role. This course takes you from your first SELECT query to writing complex joins, subqueries, stored procedures, and optimising slow queries.',
        outcomes: ['SQL queries from basic to advanced', 'Database design & normalisation', 'Joins & subqueries', 'Query optimisation', 'Stored procedures'],
        stack: 'PostgreSQL, MySQL, SQLite, DBeaver, pgAdmin',
        careerPaths: ['Database Administrator', 'Data Analyst', 'Backend Developer'],
        prerequisites: ['Basic computer skills', 'No prior database experience needed'],
        installmentPlans: makeInstallmentPlans(12000, ['Week 2', 'Week 3']),
      },
      {
        id: 'advanced-analytics',
        name: 'Advanced Analytics & Statistics',
        shortName: 'Advanced Analytics',
        duration: '6 weeks',
        mode: 'Online',
        price: 22000,
        currency: 'KES',
        description: 'Statistical modelling, A/B testing, time-series analysis, and prescriptive analytics.',
        longDescription: 'Go beyond descriptive analytics into predictive and prescriptive techniques. Learn the statistics that underpin business decisions — regression, hypothesis testing, A/B experiments, time-series forecasting, and decision optimisation.',
        outcomes: ['Regression models', 'A/B testing methodology', 'Time-series forecasting', 'Decision science', 'Statistical inference', 'Prescriptive analytics'],
        stack: 'Python, R, Scipy, Statsmodels, Tableau, Metabase',
        careerPaths: ['Senior Data Analyst', 'Data Scientist', 'Quantitative Analyst'],
        prerequisites: ['Data Analytics with Python or equivalent', 'Basic statistics'],
        installmentPlans: makeInstallmentPlans(22000, ['Week 3', 'Week 5']),
      },
    ],
  },
];

// --- Helper: find a course by ID across all categories ---
export function findCourse(courseId: string): { course: Course; category: CourseCategory } | null {
  for (const category of COURSE_CATEGORIES) {
    const course = category.courses.find(c => c.id === courseId);
    if (course) return { course, category };
  }
  return null;
}

// --- Helper: get the first installment amount for a plan ---
export function getFirstInstallmentAmount(course: Course, planLabel?: string): number {
  if (!planLabel || planLabel === 'upfront' || !course.installmentPlans) return course.price;
  const plan = course.installmentPlans.find(
    p => p.label.toLowerCase().replace(/\s+/g, '-') === planLabel
  );
  return plan?.payments[0]?.amount ?? course.price;
}

export const TREASURY_PAY_URL = 'https://books.codevertexitsolutions.com/pay';
