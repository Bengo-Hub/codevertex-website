/**
 * Starter blog posts
 */

export interface BlogSeed {
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

export const BLOG_POSTS: BlogSeed[] = [
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
