import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  CircuitBoard,
  Cpu,
  ExternalLink,
  Receipt,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SSO_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Systems Integrations',
  description: 'eTIMS/KRA tax fiscalization, TruLoad weighing hardware, camera systems, PLCs, Arduino, and general IoT automation — how Codevertex connects your systems and hardware.',
};

interface Integration {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  color: string;
  features: string[];
  needsDeveloperPortal: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'etims',
    name: 'eTIMS / KRA Tax Fiscalization',
    tagline: 'Sign every sale with KRA, in real time',
    description:
      "Our treasury platform is a certified KRA eTIMS OSCU integrator. Onboarded Codevertex tenants get it as part of their plan; external businesses with their own developers can integrate directly against our eTIMS API — sandbox-test, pass a go-live certification checklist, then move to production — with no fee for self-serve integration. Prefer to have our team handle the setup for you instead? A one-time assisted-integration fee applies.",
    icon: Receipt,
    color: '#0EA5E9',
    features: [
      'Real-time KRA sales signing (OSCU)',
      'Sandbox environment + go-live checklist',
      'Self-serve API access (free) or assisted setup (fee)',
      'Usage-based or subscription API pricing',
    ],
    needsDeveloperPortal: true,
  },
  {
    id: 'truload',
    name: 'TruLoad Weighing Hardware & Software',
    tagline: 'Axle-load and commercial weighing, fully connected',
    description:
      'Portable and static weighbridge integration for axle-load enforcement, commercial weight tickets, and KURA compliance reporting — hardware selection, calibration guidance, and the software layer that turns a weighbridge into real-time, auditable data.',
    icon: Scale,
    color: '#38bdf8',
    features: [
      'Mobile portable & static multideck weighing',
      'KURA enforcement reporting',
      'Commercial weight ticket generation',
      'IoT sensor + weighbridge hardware integration',
    ],
    needsDeveloperPortal: false,
  },
  {
    id: 'cameras',
    name: 'Camera & CCTV Systems',
    tagline: 'Surveillance and computer-vision-ready camera integration',
    description:
      'From basic CCTV deployment to camera feeds wired into your operational software — occupancy counts, loss-prevention alerts, or a live feed surfaced right inside your POS/inventory dashboard.',
    icon: Camera,
    color: '#9100B0',
    features: [
      'CCTV deployment and network integration',
      'Camera-to-dashboard live feed wiring',
      'Event-triggered alerts (motion, occupancy)',
      'Works alongside our POS/Inventory platforms',
    ],
    needsDeveloperPortal: false,
  },
  {
    id: 'plc',
    name: 'PLC Automation',
    tagline: 'Industrial control systems that talk to your software',
    description:
      'Programmable Logic Controller integration for manufacturing and industrial process automation — bridging shop-floor equipment to the same real-time data pipeline that powers your inventory and reporting.',
    icon: Cpu,
    color: '#f59e0b',
    features: [
      'PLC-to-cloud data bridging',
      'Real-time production/process monitoring',
      'Manufacturing & warehousing use cases',
      'Custom control-system integration',
    ],
    needsDeveloperPortal: false,
  },
  {
    id: 'arduino-iot',
    name: 'Arduino & General IoT Automation',
    tagline: 'From a single sensor to a full automation pipeline',
    description:
      "Arduino programming and general IoT hardware automation — sensors, actuators, microcontrollers — engineered into a reliable, monitored pipeline feeding your business software, not a one-off hobby build.",
    icon: CircuitBoard,
    color: '#4ade80',
    features: [
      'Arduino / microcontroller programming',
      'Sensor & actuator integration',
      'Real-time hardware-to-cloud sync',
      'Custom automation pipelines',
    ],
    needsDeveloperPortal: false,
  },
];

export default function IntegrationsPage() {
  return (
    <div className="pt-20">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-125 h-125 bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Network, Hardware and Integrations</p>
            <h1 className="text-5xl sm:text-6xl lg:text-6xl font-black text-white dark:text-foreground tracking-tight leading-[1.05] mb-6">
              Systems Integrations
            </h1>
            <p className="text-white/70 dark:text-muted-foreground text-lg max-w-2xl leading-relaxed mb-8">
              Every integration we build or support — from KRA tax fiscalization to weighbridges, cameras, PLCs, and IoT hardware — engineered into a real, monitored data pipeline, not a one-off script.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button asChild>
                <Link href="/contact">Talk to an integration engineer <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" className="border-white/20 dark:border-foreground/20 text-white dark:text-foreground bg-transparent hover:bg-white/10 dark:hover:bg-foreground/10 hover:border-white/30 dark:hover:border-foreground/30" asChild>
                <Link href={`${SSO_URL}/docs`} target="_blank" rel="noreferrer">
                  Developer portal &amp; API docs <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Integration cards ───────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto space-y-6">
          {INTEGRATIONS.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.id}
                className="rounded-2xl bg-card border border-border p-8 lg:p-10 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${it.color}15`, borderColor: `${it.color}30` }}>
                    <Icon className="h-5 w-5" style={{ color: it.color }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">{it.name}</h2>
                    <p className="text-sm font-semibold text-muted-foreground italic">{it.tagline}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-3xl">{it.description}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-6 max-w-2xl">
                  {it.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: it.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3 flex-wrap">
                  <Button size="sm" asChild>
                    <Link href="/contact">Request this integration <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                  {it.needsDeveloperPortal && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`${SSO_URL}/docs`} target="_blank" rel="noreferrer">
                        Explore the API <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <p className="text-center text-sm text-muted-foreground pt-4">
            Prefer to ask? Open the chat in the corner of this page — Vera can capture the details and route your request straight to our integration team.
          </p>
        </div>
      </section>
    </div>
  );
}
