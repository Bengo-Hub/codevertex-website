'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  BookOpen,
  CreditCard,
  ExternalLink,
  Gift,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import { useStudentSection, type StudentSection } from './student-section-context';

const NAV_ITEMS: { id: StudentSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'course', label: 'My Course', icon: BookOpen },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'referrals', label: 'Refer a Friend', icon: Gift },
  { id: 'quizzes', label: 'Quiz Performance', icon: BarChart3 },
];

interface StudentSidebarProps {
  studentName?: string;
  studentInitials?: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

function SidebarContent({
  studentName,
  studentInitials,
  onNavigate,
  onLogout,
}: {
  studentName?: string;
  studentInitials?: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const { activeSection, setActiveSection } = useStudentSection();

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">Student Portal</p>
          <p className="truncate text-xs text-muted-foreground">Codevertex Africa</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveSection(item.id);
                onNavigate?.();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors',
                'hover:bg-primary/8 hover:text-foreground',
                isActive && 'bg-primary/10 text-primary font-semibold'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <div className="my-3 border-t border-border" />

        <Link
          href="/digitika"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/8 hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span className="truncate">Browse Courses</span>
        </Link>
      </nav>

      {/* Footer: user + theme + logout */}
      <div className="border-t border-border p-3">
        {studentName && (
          <div className="mb-2 flex items-center gap-2.5 rounded-xl px-2 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {studentInitials}
            </span>
            <span className="min-w-0 truncate text-sm font-medium text-foreground">{studentName}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle className="shrink-0" />
          <button
            onClick={onLogout}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-destructive/8 hover:text-destructive hover:border-destructive/30"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentSidebar({
  studentName,
  studentInitials,
  mobileOpen,
  onCloseMobile,
  onLogout,
}: StudentSidebarProps) {
  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-border lg:bg-card">
        <SidebarContent studentName={studentName} studentInitials={studentInitials} onLogout={onLogout} />
      </aside>

      {/* Mobile: off-canvas drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-card shadow-2xl lg:hidden"
            >
              <button
                onClick={onCloseMobile}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent
                studentName={studentName}
                studentInitials={studentInitials}
                onNavigate={onCloseMobile}
                onLogout={onLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
