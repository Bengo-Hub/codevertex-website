import {
  Bell, Brain, CreditCard, Key, LayoutDashboard, Library,
  Monitor, Network, Scale, ShieldCheck, ShoppingCart, Sparkles,
  Truck, Wifi, type LucideIcon,
} from 'lucide-react';

// Real architecture map of the Codevertex Power Suite, compiled 2026-08-19 from a direct
// codebase audit (not marketing copy) — every URL/relationship here was confirmed against
// actual router/config files, cross-referenced with src/config/services.ts for brand colors.

export interface BackboneNode {
  id: string;
  name: string;
  role: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

export const BACKBONE: BackboneNode[] = [
  {
    id: 'auth',
    name: 'Auth API + SSO',
    role: 'Identity backbone',
    icon: Key,
    color: '#9100B0',
    description:
      'Every service and every frontend authenticates through here — OAuth2/OIDC, MFA, RBAC, tenant management, audit log, and developer API keys. It enriches every JWT with subscription claims fetched from Subscriptions API, so downstream services never have to call billing directly just to check a feature flag.',
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions API',
    role: 'Billing & entitlements backbone',
    icon: CreditCard,
    color: '#0EA5E9',
    description:
      'Owns the plan catalog, tier limits, and usage/overage rules for every product in the suite. Auth API reads from it to stamp JWTs; every other service enforces gating off those JWT claims rather than calling Subscriptions API on every request.',
  },
  {
    id: 'events',
    name: 'Shared Events (NATS/JetStream)',
    role: 'Async event bus',
    icon: Network,
    color: '#38bdf8',
    description:
      'The nervous system connecting almost every service pair below without direct coupling — e.g. a POS sale finalizing publishes an event that Treasury, Inventory, and Notifications all react to independently. Subject convention: {aggregate_type}.{event_type}.',
  },
  {
    id: 'shared-ui-lib',
    name: 'Shared UI Lib',
    role: 'Frontend component layer',
    icon: Sparkles,
    color: '#f59e0b',
    description:
      'A published npm package consumed by every Power Suite frontend via pinned git tags — payment modals, SSO login, tracking widgets, the app-switcher, and (as of today) the public careers-portal components shared between erp-ui and this website.',
  },
];

export interface EcosystemService {
  id: string;
  name: string;
  category: string;
  icon: LucideIcon;
  color: string;
  url?: string;
  publicProduct: boolean;
  description: string;
  talksTo: string[];
}

export const SERVICES: EcosystemService[] = [
  {
    id: 'pos',
    name: 'POS System',
    category: 'Retail & Hospitality',
    icon: Monitor,
    color: '#f59e0b',
    url: 'https://pos.codevertexafrica.com',
    publicProduct: true,
    description: 'Offline-capable till system for retail, hospitality, and QSR — M-Pesa/card payments, multi-outlet, real-time analytics.',
    talksTo: ['Inventory (stock + BOM)', 'Treasury (GL + payments)', 'Notifications (receipts)', 'Shared Events (sale finalized)'],
  },
  {
    id: 'inventory',
    name: 'Inventory',
    category: 'Stock & Warehousing',
    icon: LayoutDashboard,
    color: '#22c55e',
    publicProduct: false,
    description: 'Stock, warehouses, recipes/BOM, and pricing tiers — internal to the suite, consumed by POS and Ordering rather than marketed as a standalone product.',
    talksTo: ['POS (catalog + stock deduction)', 'Ordering (catalog sync)', 'Treasury (vendor/supplier master)'],
  },
  {
    id: 'treasury',
    name: 'Books (Treasury/Finance)',
    category: 'Finance and Projects',
    icon: CreditCard,
    color: '#9100B0',
    url: 'https://books.codevertexafrica.com',
    publicProduct: true,
    description: 'General ledger, AR/AP, invoicing, KRA eTIMS tax fiscalization, and Paystack/M-Pesa payment collection — the financial backbone every other product posts into.',
    talksTo: ['Auth (tenant payment details)', 'POS/ERP/Ordering (GL postings)', 'Notifications (payment events)', 'Subscriptions (platform invoicing)'],
  },
  {
    id: 'erp',
    name: 'ERP Suite',
    category: 'Business Operations',
    icon: LayoutDashboard,
    color: '#0EA5E9',
    url: 'https://erp.codevertexafrica.com',
    publicProduct: true,
    description: 'HR, payroll, procurement, and a public per-tenant careers/recruitment portal — the source of today\'s careers-portal reuse into this website.',
    talksTo: ['Treasury (payroll GL)', 'Notifications (recruitment emails)', 'Auth (RBAC)', 'codevertex-website (careers, new)'],
  },
  {
    id: 'notifications',
    name: 'Notifications Engine',
    category: 'Cross-Industry',
    icon: Bell,
    color: '#38bdf8',
    url: 'https://notifications.codevertexafrica.com',
    publicProduct: true,
    description: 'Centralized email, SMS (Africa\'s Talking), push, and WhatsApp delivery with templates and per-tenant channel gating — nearly every other service publishes into it rather than sending mail itself.',
    talksTo: ['Auth (S2S key)', 'ERP (recruitment)', 'Treasury (payment events)', 'codevertex-website (installment reminders, now email + SMS)'],
  },
  {
    id: 'ordering',
    name: 'Ordering Platform',
    category: 'E-Commerce',
    icon: ShoppingCart,
    color: '#f59e0b',
    url: 'https://ordering.codevertexafrica.com',
    publicProduct: true,
    description: 'Multi-tenant online ordering and delivery with real-time tracking and PWA support.',
    talksTo: ['Inventory (catalog)', 'Treasury (checkout payment)', 'Logistics (delivery dispatch)'],
  },
  {
    id: 'logistics',
    name: 'Logistics',
    category: 'Dispatch & Delivery',
    icon: Truck,
    color: '#38bdf8',
    publicProduct: false,
    description: 'Dispatch, delivery, and rider tracking that fulfills POS and Ordering deliveries — internal fulfillment layer, not sold standalone.',
    talksTo: ['Ordering (dispatch)', 'POS (shipments)'],
  },
  {
    id: 'isp',
    name: 'ISP Billing',
    category: 'Telecommunications',
    icon: Wifi,
    color: '#4ade80',
    url: 'https://ispbilling.codevertexafrica.com',
    publicProduct: true,
    description: 'Zero-touch MikroTik provisioning, subscriber billing, and captive portal management for ISPs.',
    talksTo: ['Auth (SSO/RBAC)', 'Treasury (billing reconciliation)'],
  },
  {
    id: 'truload',
    name: 'TruLoad',
    category: 'Transport & Logistics',
    icon: Scale,
    color: '#38bdf8',
    url: 'https://truload.codevertexafrica.com',
    publicProduct: true,
    description: 'Axle-load and commercial weighbridge management — the platform\'s one .NET service, integrated with KURA enforcement reporting.',
    talksTo: ['Auth (SSO)', 'Treasury (weight-ticket invoicing)'],
  },
  {
    id: 'library',
    name: 'Library Management',
    category: 'Catalog & Circulation',
    icon: Library,
    color: '#a855f7',
    publicProduct: false,
    description: 'Catalog, circulation, and member management for library/education tenants — internal-only API surface, not a marketed developer product.',
    talksTo: ['Auth (SSO/PIN login)'],
  },
  {
    id: 'hospital',
    name: 'Codevertex Afya',
    category: 'Healthcare',
    icon: ShieldCheck,
    color: '#ef4444',
    url: 'https://afya.codevertexafrica.com',
    publicProduct: true,
    description: 'The newest vertical — clinical/pharmacy operations, RBAC, and tenant-outlet sync, following the same platform patterns as the rest of the suite.',
    talksTo: ['Auth (Trinity Authorization/RBAC)', 'Subscriptions (AFYA plan tiers)'],
  },
  {
    id: 'marketflow',
    name: 'MarketFlow + Vera AI',
    category: 'CRM & AI Automation',
    icon: Brain,
    color: '#0EA5E9',
    url: 'https://marketflow.codevertexafrica.com',
    publicProduct: true,
    description: 'Customer/lead source of truth across the suite, plus Vera — the AI chatbot embedded as a widget on this website and others. Chat logic never runs in codevertex-website itself; it\'s fully delegated here.',
    talksTo: ['codevertex-website (chat widget)', 'POS/Ordering/Treasury (CRM contact resolution)'],
  },
];

export const EARLY_STAGE = [
  'Legal Management System',
  'Real Estate',
  'Sourcing',
  'Projects',
  'PROCESSA',
];
