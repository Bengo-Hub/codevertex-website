import {
  BarChart2, Bell, BookOpen, Brain, Cloud, Code2, CreditCard,
  LayoutDashboard, Monitor, Network, Shield, ShoppingCart,
  Truck, Wifi, Zap, type LucideIcon,
} from 'lucide-react';

export type ServiceStatus = 'live' | 'beta' | 'coming-soon' | 'offline';

export interface PowerSuiteProduct {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: LucideIcon;
  url: string;
  color: string;
  img: string;
  status: ServiceStatus;
  highlights: string[];
}

export interface ServicePillar {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  color: string;
  img: string;
  features: string[];
  cta?: { label: string; href: string };
}

// ── Power Suite: the integrated SaaS product line ──────────────────────────
export const POWER_SUITE: PowerSuiteProduct[] = [
  {
    id: 'erp',
    name: 'ERP Suite',
    tag: 'Business Operations',
    description: 'Unified finance, HR, procurement, and CRM in one modular platform. Designed for African corporates and SMEs seeking real-time operational control.',
    icon: LayoutDashboard,
    url: 'https://erp.codevertexitsolutions.com',
    color: '#0EA5E9',
    img: '/images/illustrations/product-erp.svg',
    status: 'live',
    highlights: ['Finance, HR and Procurement unified', 'Real-time multi-tenant sync', 'Role-based access control'],
  },
  {
    id: 'truload',
    name: 'TruLoad',
    tag: 'Transport and Logistics',
    description: 'All-in-one axle-load management platform: mobile portable weighing, static multideck bridges, KURA enforcement, and commercial weight tickets.',
    icon: Truck,
    url: 'https://truload.codevertexitsolutions.com',
    color: '#38bdf8',
    img: '/images/illustrations/product-truload.svg',
    status: 'live',
    highlights: ['Mobile and static weighing', 'IoT enforcement + KURA integration', 'Commercial weight tickets'],
  },
  {
    id: 'pos',
    name: 'POS System',
    tag: 'Retail and Hospitality',
    description: 'Offline-capable point-of-sale for retail, hospitality, and QSR with M-Pesa, card payments, inventory intelligence, and multi-location support.',
    icon: Monitor,
    url: 'https://pos.codevertexitsolutions.com',
    color: '#f59e0b',
    img: '/images/illustrations/product-pos.svg',
    status: 'live',
    highlights: ['M-Pesa and card, offline-capable', 'Multi-location inventory', 'Real-time sales analytics'],
  },
  {
    id: 'isp',
    name: 'ISP Billing',
    tag: 'Telecommunications',
    description: 'Zero-touch network provisioning, subscriber billing, captive portal management, and automated payment reconciliation for ISPs.',
    icon: Wifi,
    url: 'https://ispbilling.codevertexitsolutions.com',
    color: '#4ade80',
    img: '/images/illustrations/product-isp.svg',
    status: 'live',
    highlights: ['Zero-touch subscriber provisioning', 'Captive portal + auto-billing', 'Router lifecycle automation'],
  },
  {
    id: 'books',
    name: 'Books',
    tag: 'Finance and Projects',
    description: 'Integrated invoicing, M-Pesa and Paystack payment gateways, financial reconciliation, project tracking, and collaborative team workflows.',
    icon: CreditCard,
    url: 'https://books.codevertexitsolutions.com',
    color: '#EC4899',
    img: '/images/illustrations/product-books.svg',
    status: 'live',
    highlights: ['Invoicing with M-Pesa and Paystack', 'Project tracking and team collab', 'Financial reconciliation'],
  },
  {
    id: 'vera',
    name: 'Vera AI',
    tag: 'AI Business Assistant',
    description: 'Centralised AI assistant for your entire Codevertex workspace — answers queries, generates reports, and surfaces insights across all products.',
    icon: Brain,
    url: '/contact',
    color: '#0EA5E9',
    img: '/images/illustrations/product-vera.svg',
    status: 'beta',
    highlights: ['24/7 business intelligence', 'Claude-powered, integrated across suite', 'Natural language reporting'],
  },
  {
    id: 'notifications',
    name: 'Notifications Engine',
    tag: 'Cross-Industry',
    description: 'Secure, centralized delivery of SMS, email, push, and in-app notifications with templates, scheduling, and delivery analytics.',
    icon: Bell,
    url: 'https://notifications.codevertexitsolutions.com',
    color: '#38bdf8',
    img: '/images/illustrations/product-isp.svg',
    status: 'live',
    highlights: ['SMS, email, push and in-app', 'Template management', 'Delivery analytics'],
  },
  {
    id: 'ordering',
    name: 'Ordering Platform',
    tag: 'E-Commerce',
    description: 'Multi-tenant online ordering and delivery platform with real-time tracking, PWA support, and M-Pesa integration.',
    icon: ShoppingCart,
    url: 'https://ordersapp.codevertexitsolutions.com',
    color: '#f59e0b',
    img: '/images/illustrations/product-pos.svg',
    status: 'live',
    highlights: ['Multi-tenant ordering', 'Real-time delivery tracking', 'PWA mobile support'],
  },
];

// ── Service Pillars: broader agency offering ────────────────────────────────
export const SERVICE_PILLARS: ServicePillar[] = [
  {
    id: 'digitika',
    name: 'Digitika Academy',
    tagline: 'Talent Development and Workforce Enablement',
    description: 'Closing the critical skills gap between education and global industry demands. Professional certification programmes in ICT, networking, AI, software engineering, and data analytics — delivered in Kisumu and online.',
    icon: BookOpen,
    color: '#0EA5E9',
    img: '/images/illustrations/service-digitika.svg',
    features: ['ICDL Workforce Certification', 'Cisco CCNA Networking', 'Software Engineering Bootcamp', 'AI and Machine Learning', 'Data Analytics', 'Corporate training packages'],
    cta: { label: 'Explore Digitika', href: '/digitika' },
  },
  {
    id: 'software',
    name: 'Enterprise Software Solutions',
    tagline: 'Bespoke Digital Platforms and Mobile Applications',
    description: 'We convert business complexity and operational friction into elegant, scalable, high-performance digital solutions — from full-stack web portals and multi-currency e-commerce to native mobile apps and workflow automation.',
    icon: Code2,
    color: '#38bdf8',
    img: '/images/illustrations/service-software.svg',
    features: ['Full-stack web portals and marketplaces', 'Native Android and iOS applications', 'ERP, CRM, HRM and workflow automation', 'API design and microservices', 'Multi-currency e-commerce systems', 'Process integration and optimization'],
    cta: { label: 'Start a project', href: '/contact' },
  },
  {
    id: 'network',
    name: 'Network, Hardware and Integrations',
    tagline: 'Physical Infrastructure meets Digital Intelligence',
    description: 'Engineering seamless hardware-software synergies that eliminate manual operational bottlenecks through intelligent, real-time connectivity between field equipment and the cloud — from axle-load IoT sensors to zero-touch router provisioning.',
    icon: Network,
    color: '#f59e0b',
    img: '/images/illustrations/service-network.svg',
    features: ['IoT sensor and camera integration', 'Axle-load monitoring hardware (TruLoad)', 'Zero-touch router provisioning', 'Captive portal authentication', 'Real-time hardware-to-cloud sync', 'Automated compliance reporting'],
    cta: { label: 'Get a quote', href: '/contact' },
  },
  {
    id: 'ai',
    name: 'AI and Advanced Analytics',
    tagline: 'Transforming Data into Strategic Intelligence',
    description: 'Turning raw data into actionable intelligence for executive decision-making — from AI-driven demand forecasting and NLP chatbots to executive BI dashboards built on Power BI, Superset, and custom visualization frameworks.',
    icon: BarChart2,
    color: '#EC4899',
    img: '/images/illustrations/service-ai.svg',
    features: ['Predictive and prescriptive modeling', 'NLP chatbots and virtual assistants', 'Real-time sentiment analysis', 'Power BI and Superset dashboards', 'Demand planning and risk assessment', 'Cognitive process automation'],
    cta: { label: 'Explore AI solutions', href: '/contact' },
  },
  {
    id: 'cloud',
    name: 'Secure Cloud Infrastructure',
    tagline: 'Resilient Backbone for Africa\'s Digital Economy',
    description: 'Enterprise-grade managed cloud services with automated backups, disaster recovery, and end-to-end 256-bit encryption — plus strategic domain and digital identity management across .co.ke, .com, and .africa.',
    icon: Cloud,
    color: '#4ade80',
    img: '/images/illustrations/service-cloud.svg',
    features: ['Managed cloud with automated backups', 'Disaster recovery planning', 'AES-256 encryption end-to-end', 'Domain provisioning (.co.ke, .com, .africa)', 'SSL certificate management', 'Multi-region CDN and failover'],
    cta: { label: 'Talk to infrastructure team', href: '/contact' },
  },
  {
    id: 'cybersec',
    name: 'Cybersecurity & Audit',
    tagline: 'Protecting Enterprises from Evolving Threats',
    description: 'Comprehensive security assessments, penetration testing, vulnerability auditing, and compliance frameworks that safeguard critical infrastructure, sensitive data, and business continuity.',
    icon: Shield,
    color: '#ef4444',
    img: '/images/illustrations/service-cybersec.svg',
    features: ['Penetration testing & ethical hacking', 'Vulnerability assessment & audit', 'Security architecture review', 'OWASP / ISO 27001 compliance', 'Incident response planning', 'Security awareness training'],
    cta: { label: 'Request a security audit', href: '/contact' },
  },
];

// Legacy compat: kept for any existing imports
export type ServiceCategory = { id: string; name: string; services: PowerSuiteProduct[] };

export const STATUS_STYLES: Record<ServiceStatus, string> = {
  live: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  beta: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'coming-soon': 'bg-slate-200/60 text-slate-500 border-slate-200 dark:bg-slate-800/60 dark:text-slate-500 dark:border-slate-700',
  offline: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

// Legacy export kept for backwards compatibility
export const SERVICES = POWER_SUITE;
export const SERVICE_CATEGORIES = [
  { id: 'power-suite', name: 'Power Suite', services: POWER_SUITE },
];

export { Shield };
