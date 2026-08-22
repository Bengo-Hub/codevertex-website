'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Users, MessageSquare, Mail, CreditCard,
  TrendingUp, AlertTriangle, Clock, CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts';
import { AdminPageHeader } from './AdminPageHeader';
import { StatCard } from './StatCard';
import { formatCurrency } from '@/lib/utils';
import { authedFetch } from '@/lib/auth/authed-fetch';

interface RecentEnrollment {
  id: string;
  createdAt: string;
  amount: number;
  paymentStatus: string;
  fullName: string;
  courseName: string;
}

interface Stats {
  enrollments: { total: number; pending: number; succeeded: number };
  students: { total: number };
  leads: { total: number; new: number };
  contacts: { total: number };
  installments: { overdue: number; upcomingWeek: number };
  revenue: { collected: number; currency: string };
  recentEnrollments: RecentEnrollment[];
}

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground) / 0.35)', 'hsl(38 92% 50%)'];

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-GB', { month: 'short' });
}

/** Group real enrollment records (already returned by the API) into a per-month revenue + volume trend. */
function useMonthlyTrend(recentEnrollments: RecentEnrollment[]) {
  return useMemo(() => {
    const now = new Date();
    const buckets: { key: string; month: string; revenue: number; enrollments: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: monthLabel(d), revenue: 0, enrollments: 0 });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    for (const e of recentEnrollments) {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = byKey.get(key);
      if (!bucket) continue;
      bucket.enrollments += 1;
      if (e.paymentStatus === 'succeeded') bucket.revenue += e.amount;
    }
    return buckets;
  }, [recentEnrollments]);
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch('/api/admin/stats')
      .then((r) => {
        if (!r.ok) throw new Error(`admin/stats returned ${r.status}`);
        return r.json();
      })
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const trend = useMonthlyTrend(stats?.recentEnrollments ?? []);
  const otherEnrollments = stats
    ? Math.max(stats.enrollments.total - stats.enrollments.succeeded - stats.enrollments.pending, 0)
    : 0;
  const statusBreakdown = stats
    ? [
        { name: 'Succeeded', value: stats.enrollments.succeeded },
        { name: 'Pending', value: stats.enrollments.pending },
        ...(otherEnrollments > 0 ? [{ name: 'Other', value: otherEnrollments }] : []),
      ]
    : [];
  const recentActivity = stats
    ? [...stats.recentEnrollments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)
    : [];

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPageHeader title="Dashboard" description={now} />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Top stat row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Revenue &amp; Enrollments</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Last 6 months, from confirmed enrollments</p>
                </div>
              </div>
              {trend.every((t) => t.enrollments === 0) ? (
                <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                  No enrollment activity in the last 6 months yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={trend} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === 'revenue'
                          ? [formatCurrency(Number(value), stats.revenue.currency), 'Revenue']
                          : [String(value), 'Enrollments']
                      }
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Enrollment Status</h2>
              {stats.enrollments.total === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No enrollments yet.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={statusBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {statusBreakdown.map((entry, i) => (
                          <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1.5">
                    {statusBreakdown.map((entry, i) => (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          {entry.name}
                        </span>
                        <span className="font-semibold text-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recent activity + quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Recent Enrollments</h2>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent enrollment activity.</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentActivity.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {e.fullName
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((n) => n[0]?.toUpperCase())
                            .join('')}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{e.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">{e.courseName}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(e.amount, 'KES')}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            e.paymentStatus === 'succeeded' ? 'text-emerald-500' : 'text-amber-500'
                          }`}
                        >
                          {e.paymentStatus === 'succeeded' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {e.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: 'View Enrollments', href: '/admin/enrollments' },
                  { label: 'Manage Students', href: '/admin/students' },
                  { label: 'Installments', href: '/admin/installments' },
                  { label: 'Leads', href: '/admin/leads' },
                  { label: 'Contact Forms', href: '/admin/contacts' },
                  { label: 'Courses', href: '/admin/courses' },
                  { label: 'Cohorts', href: '/admin/cohorts' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    {item.label}
                    <span aria-hidden>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">Could not load stats.</p>
      )}
    </div>
  );
}
