'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Users, MessageSquare, Mail, CreditCard,
  TrendingUp, AlertTriangle, Clock,
} from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { StatCard } from './StatCard';
import { formatCurrency } from '@/lib/utils';

interface Stats {
  enrollments: { total: number; pending: number; succeeded: number };
  students: { total: number };
  leads: { total: number; new: number };
  contacts: { total: number };
  installments: { overdue: number; upcomingWeek: number };
  revenue: { collected: number; currency: string };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPageHeader
        title="Dashboard"
        description={now}
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Enrollments"
              value={stats.enrollments.total}
              sub={`${stats.enrollments.succeeded} confirmed`}
              icon={BookOpen}
              color="text-emerald-500"
            />
            <StatCard
              label="Students"
              value={stats.students.total}
              sub="Unique registered"
              icon={Users}
              color="text-blue-500"
            />
            <StatCard
              label="Revenue Collected"
              value={formatCurrency(stats.revenue.collected, stats.revenue.currency)}
              sub="From paid installments"
              icon={TrendingUp}
              color="text-primary"
            />
            <StatCard
              label="Pending Payments"
              value={stats.enrollments.pending}
              sub="Awaiting confirmation"
              icon={Clock}
              color="text-amber-500"
            />
            <StatCard
              label="Chatbot Leads"
              value={stats.leads.total}
              sub={`${stats.leads.new} new`}
              icon={MessageSquare}
              color="text-purple-500"
            />
            <StatCard
              label="Contact Enquiries"
              value={stats.contacts.total}
              icon={Mail}
              color="text-primary"
            />
            <StatCard
              label="Overdue Installments"
              value={stats.installments.overdue}
              sub="Require follow-up"
              icon={AlertTriangle}
              color="text-red-500"
            />
            <StatCard
              label="Due This Week"
              value={stats.installments.upcomingWeek}
              sub="Upcoming installments"
              icon={CreditCard}
              color="text-amber-500"
            />
          </div>

          {/* Quick links */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { label: 'View Enrollments', href: '/admin/enrollments', desc: 'Manage all course sign-ups' },
                { label: 'Manage Students', href: '/admin/students', desc: 'Student registry' },
                { label: 'Installments', href: '/admin/installments', desc: 'Payment schedules & reminders' },
                { label: 'Leads', href: '/admin/leads', desc: 'Chatbot & marketing leads' },
                { label: 'Contact Forms', href: '/admin/contacts', desc: 'Website enquiries' },
                { label: 'Courses', href: '/admin/courses', desc: 'Manage course catalog' },
                { label: 'Cohorts', href: '/admin/cohorts', desc: 'Batch & cohort management' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">Could not load stats.</p>
      )}
    </div>
  );
}
