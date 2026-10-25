import {
  Bell, BookMarked, Building2, Cloud, Code2, CreditCard, Cpu, FolderKanban,
  GraduationCap, Headset, LayoutDashboard, Megaphone, Monitor, Package, Scale, Shield,
  ShoppingBag, ShoppingCart, Stethoscope, Truck, Wifi, Workflow, type LucideIcon,
} from 'lucide-react';

// One source for every product and service line the website names: the home page, /services,
// the footer, the contact form's "interested in" list, /api/catalog (read by MarketFlow) and the
// pricing names. The product list matches the 2026 Power Suite roll-up and each app's own repo.

export type ServiceStatus = 'live' | 'beta' | 'coming-soon' | 'offline';

export interface Photo {
  src: string;
  alt: string;
}

export interface PowerSuiteProduct {
  id: string;
  name: string;
  /** Who it is for, in a few words. */
  tag: string;
  /** One line, as printed on the roll-up. */
  summary: string;
  description: string;
  icon: LucideIcon;
  url: string;
  status: ServiceStatus;
  highlights: string[];
  /** subscriptions-api serviceTag whose cheapest public monthly plan is this product's "from" price. */
  serviceTag?: string;
  /** Real screen from the app, captured from the demo tenant. */
  screenshot?: Photo;
  isNew?: boolean;
}

export interface ServicePillar {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  photo?: Photo;
  features: string[];
  cta?: { label: string; href: string };
}

export const POWER_SUITE: PowerSuiteProduct[] = [
  {
    id: 'erp',
    name: 'ERP Suite',
    tag: 'Companies and SMEs',
    summary: 'HR, payroll, procurement and CRM',
    description: 'Run people, payroll, purchasing and customer records in one place, with approvals and role-based access for every department.',
    icon: LayoutDashboard,
    url: 'https://erp.codevertexafrica.com',
    status: 'live',
    highlights: ['Payroll with statutory deductions', 'Procurement and approvals', 'Staff records and leave'],
    serviceTag: 'erp',
  },
  {
    id: 'books',
    name: 'Books and Treasury',
    tag: 'Finance teams',
    summary: 'Ledger, invoicing and KRA eTIMS',
    description: 'Invoices, receipts, expenses and a full general ledger, with M-Pesa and card collections and KRA eTIMS invoicing built in.',
    icon: CreditCard,
    url: 'https://books.codevertexafrica.com',
    status: 'live',
    highlights: ['KRA eTIMS invoices and credit notes', 'M-Pesa, PayHero and Paystack collections', 'Receivables, payables and bank reconciliation'],
  },
  {
    id: 'pos',
    name: 'POS System',
    tag: 'Shops, restaurants and hotels',
    summary: 'Offline-ready retail and hospitality',
    description: 'Sell at the counter even when the internet drops. Split payments, kitchen and bar tickets, shifts and cash-up, and receipts that print or go out on WhatsApp.',
    icon: Monitor,
    url: 'https://pos.codevertexafrica.com',
    status: 'live',
    highlights: ['Works offline and syncs later', 'M-Pesa, card and split tenders', 'Kitchen display and table service'],
    serviceTag: 'pos',
  },
  {
    id: 'ordering',
    name: 'Ordering Platform',
    tag: 'Restaurants and retailers',
    summary: 'Online orders and live delivery tracking',
    description: 'Your own online shop under your name. Customers order and pay online, and you follow each order from the kitchen to the doorstep.',
    icon: ShoppingCart,
    url: 'https://ordering.codevertexafrica.com',
    status: 'live',
    highlights: ['Branded online menu and shop', 'Pay online or on delivery', 'Live order and rider tracking'],
  },
  {
    id: 'projects',
    name: 'Projects',
    tag: 'Contractors and agencies',
    summary: 'Milestones, budgets and timesheets',
    description: 'Plan work in milestones, track time and spending against budget, and keep clients up to date as each milestone is reached.',
    icon: FolderKanban,
    url: 'https://projects.codevertexafrica.com',
    status: 'live',
    highlights: ['Milestones and task boards', 'Budgets against actual spend', 'Timesheets per person'],
    isNew: true,
  },
  {
    id: 'inventory',
    name: 'Inventory',
    tag: 'Warehouses and branches',
    summary: 'Stock, warehouses and pricing tiers',
    description: 'Know what you hold in every branch and store. Purchases, transfers, stock counts, recipes and price tiers, linked to your tills.',
    icon: Package,
    url: 'https://inventory.codevertexafrica.com',
    status: 'live',
    highlights: ['Stock per branch and warehouse', 'Purchase orders and supplier returns', 'Stock counts and adjustments'],
    isNew: true,
  },
  {
    id: 'logistics',
    name: 'Logistics',
    tag: 'Delivery and dispatch',
    summary: 'Dispatch, delivery and rider tracking',
    description: 'Delivery zones and fees, dispatch to your riders and live location on a map, with the rider app for proof of delivery.',
    icon: Truck,
    url: 'https://logistics.codevertexafrica.com',
    status: 'live',
    highlights: ['Delivery zones and fee quotes', 'Rider app with live location', 'Proof of delivery'],
    isNew: true,
  },
  {
    id: 'truload',
    name: 'TruLoad',
    tag: 'Road agencies and weighbridges',
    summary: 'Axle-load weighing and enforcement',
    description: 'Axle-load weighing for static and mobile weighbridges, with number-plate cameras, enforcement records and commercial weight tickets.',
    icon: Scale,
    url: 'https://truload.codevertexafrica.com',
    status: 'live',
    highlights: ['Static and mobile weighing', 'Number-plate camera capture', 'Enforcement and weight tickets'],
    serviceTag: 'truload',
    screenshot: { src: '/images/photos/weighbridge-demo.webp', alt: 'A weighbridge plate in use at the KeNHA stand, Mombasa show' },
  },
  {
    id: 'isp',
    name: 'ISP Billing',
    tag: 'Internet providers',
    summary: 'Zero-touch provisioning and billing',
    description: 'Subscribers, packages and hotspot vouchers, with routers set up automatically and accounts suspended or restored as payments come in.',
    icon: Wifi,
    url: 'https://ispbilling.codevertexafrica.com',
    status: 'live',
    highlights: ['Zero-touch router setup', 'Hotspot and PPPoE billing', 'M-Pesa payments that reconnect automatically'],
    serviceTag: 'isp_billing',
  },
  {
    id: 'afya',
    name: 'Codevertex Afya',
    tag: 'Clinics and pharmacies',
    summary: 'Clinical and pharmacy operations',
    description: 'Patient records, consultations, prescriptions and a pharmacy till, built for clinics and chemists in Kenya.',
    icon: Stethoscope,
    url: 'https://afya.codevertexafrica.com',
    status: 'live',
    highlights: ['Patient records and visits', 'Prescriptions and dispensing', 'Pharmacy stock and sales'],
    serviceTag: 'hospital',
    isNew: true,
  },
  {
    id: 'marketflow',
    name: 'MarketFlow and Vera AI',
    tag: 'Sales and marketing teams',
    summary: 'CRM, leads and an AI chat assistant',
    description: 'Capture leads from your website and WhatsApp, follow them up in one pipeline, and let Vera answer common customer questions.',
    icon: Megaphone,
    url: 'https://marketflow.codevertexafrica.com',
    status: 'live',
    highlights: ['Lead pipeline and follow-ups', 'Website and WhatsApp chat', 'Vera answers from your own knowledge base'],
    serviceTag: 'marketflow',
    isNew: true,
  },
  {
    id: 'ticketing',
    name: 'Ticketing',
    tag: 'Support teams',
    summary: 'Support tickets, SLAs and a knowledge base',
    description: 'A helpdesk for your customers: tickets routed to the right person, response targets that warn before they slip, and help articles customers can read themselves.',
    icon: Headset,
    url: 'https://ticketing.codevertexafrica.com',
    status: 'live',
    highlights: ['Ticket routing and assignment', 'SLA targets and alerts', 'Knowledge base'],
    isNew: true,
  },
  {
    id: 'library',
    name: 'Library Management',
    tag: 'Schools and libraries',
    summary: 'Catalogue, circulation and members',
    description: 'Catalogue books, lend and return them at the desk, and handle borrowing fees and fines for members.',
    icon: BookMarked,
    url: 'https://library.codevertexafrica.com',
    status: 'live',
    highlights: ['Catalogue with barcode labels', 'Loans, returns and reservations', 'Borrowing fees and fines'],
    serviceTag: 'library',
    isNew: true,
  },
  {
    id: 'notifications',
    name: 'Notifications Engine',
    tag: 'Every product',
    summary: 'Email, WhatsApp, SMS and push',
    description: 'The messaging service behind the whole suite: receipts, reminders and alerts by email and WhatsApp, with templates you can edit.',
    icon: Bell,
    url: 'https://notifications.codevertexafrica.com',
    status: 'live',
    highlights: ['Email and WhatsApp templates', 'Delivery history per message', 'Per-tenant sender settings'],
  },
];

/** Maskani is sold on its own, outside the 14-product Power Suite. */
export const MASKANI: PowerSuiteProduct = {
  id: 'maskani',
  name: 'Maskani',
  tag: 'Estates and property managers',
  summary: 'Real estate and property management',
  description: 'Rent and service charge, unit sales and instalments, meters, works and vendors, and gate visitor passes for estates and apartment blocks.',
  icon: Building2,
  url: 'https://maskani.codevertexafrica.com',
  status: 'live',
  highlights: ['Rent and service charge', 'Unit sales and instalments', 'Gate, visitors and notices'],
  isNew: true,
};

export const SERVICE_PILLARS: ServicePillar[] = [
  {
    id: 'software',
    name: 'Web and mobile apps',
    tagline: 'Portals, Android and iOS apps, and APIs',
    description: 'We build the software your business needs when an off-the-shelf product does not fit: customer portals, internal tools, mobile apps and the APIs that connect them.',
    icon: Code2,
    photo: { src: '/images/photos/hackathon-pairing.webp', alt: 'Developers working through code together at the MUCISA Hackathon 2025' },
    features: ['Customer and staff portals', 'Android and iOS apps', 'APIs and system integrations', 'Workflow automation'],
    cta: { label: 'Start a project', href: '/contact?service=software' },
  },
  {
    id: 'ai',
    name: 'AI and automation',
    tagline: 'Chatbots, workflows and BI dashboards',
    description: 'Chat assistants that answer from your own documents, reports that build themselves, and dashboards your managers read every morning.',
    icon: Workflow,
    photo: { src: '/images/photos/hackathon-talk.webp', alt: 'A Codevertex panelist speaking at the MUCISA Hackathon 2025' },
    features: ['Chat assistants on your own data', 'Scheduled reports and alerts', 'BI dashboards', 'Document and data extraction'],
    cta: { label: 'Discuss an AI project', href: '/contact?service=ai' },
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    tagline: 'Marketplaces and multi-currency stores',
    description: 'Online shops and marketplaces that take M-Pesa and card payments, connected to your stock and your delivery riders.',
    icon: ShoppingBag,
    features: ['Online shops and marketplaces', 'M-Pesa, card and PayHero checkout', 'Stock that stays in sync', 'Delivery and tracking'],
    cta: { label: 'Plan your store', href: '/contact?service=ecommerce' },
  },
  {
    id: 'cloud',
    name: 'Cloud and hosting',
    tagline: 'Backups, disaster recovery and domains',
    description: 'We host and look after your systems: daily backups, monitoring, recovery plans, domains and email.',
    icon: Cloud,
    photo: { src: '/images/photos/network-rack.webp', alt: 'A server and network rack installed by the Codevertex team' },
    features: ['Managed hosting and monitoring', 'Daily backups and recovery plans', 'Domains, SSL and business email', 'Migrations from old servers'],
    cta: { label: 'Talk about hosting', href: '/contact?service=cloud' },
  },
  {
    id: 'cybersec',
    name: 'Cybersecurity',
    tagline: 'Penetration tests, audits and ISO 27001',
    description: 'Security reviews of your systems and staff habits, penetration tests, and help preparing for ISO 27001 and data protection audits.',
    icon: Shield,
    features: ['Penetration testing', 'Security and code reviews', 'ISO 27001 and data protection readiness', 'Staff awareness training'],
    cta: { label: 'Request a security review', href: '/contact?service=cybersec' },
  },
  {
    id: 'iot',
    name: 'IoT and integrations',
    tagline: 'Hardware to cloud, M-Pesa and Paystack',
    description: 'Cameras, weighbridges, sensors and payment gateways connected to your software, installed and supported by our own field team.',
    icon: Cpu,
    photo: { src: '/images/photos/field-anpr-install.webp', alt: 'A Codevertex engineer installing a number-plate camera at a KeNHA weighbridge' },
    features: ['Number-plate and CCTV cameras', 'Weighbridge and sensor integration', 'M-Pesa, PayHero and Paystack', 'KRA eTIMS integration'],
    cta: { label: 'See integrations', href: '/integrations' },
  },
  {
    id: 'digitika',
    name: 'Digitika Academy',
    tagline: 'Training for learners and teams',
    description: 'Courses in software engineering, networking, data, AI and digital skills, taught in Kisumu and online, with certificates and corporate packages.',
    icon: GraduationCap,
    photo: { src: '/images/photos/hackathon-laptops.webp', alt: 'Students coding on laptops at the MUCISA Hackathon 2025' },
    features: ['Software engineering', 'Networking and IT support', 'Data and AI', 'ICDL digital skills', 'Corporate training'],
    cta: { label: 'Explore Digitika', href: '/digitika' },
  },
];

/** Badge styles per product status. */
export const STATUS_STYLES: Record<ServiceStatus, string> = {
  live: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  beta: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  'coming-soon': 'bg-secondary text-muted-foreground border-border',
  offline: 'bg-rose-50 text-rose-700 border-rose-200',
};

/** Every option of the contact form's "interested in" list: products, then services. */
export const ENQUIRY_TOPICS: { value: string; label: string }[] = [
  ...POWER_SUITE.map((p) => ({ value: p.id, label: p.name })),
  { value: MASKANI.id, label: MASKANI.name },
  ...SERVICE_PILLARS.map((s) => ({ value: s.id, label: s.name })),
  { value: 'other', label: 'Something else' },
];

export function enquiryTopicLabel(value?: string | null): string | undefined {
  if (!value) return undefined;
  return ENQUIRY_TOPICS.find((t) => t.value === value)?.label ?? value;
}

/** Display name for a subscriptions-api serviceTag, from the product it prices. */
export function productNameForServiceTag(tag: string): string | undefined {
  return [...POWER_SUITE, MASKANI].find((p) => p.serviceTag === tag)?.name;
}
