'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  BookOpen,
  CreditCard,
  ExternalLink,
  Gift,
  LayoutDashboard,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import { useStudentSection, type StudentSection } from './student-section-context';

const NAV_ITEMS: { section: StudentSection; label: string; icon: typeof LayoutDashboard }[] = [
  { section: 'overview', label: 'Overview', icon: LayoutDashboard },
  { section: 'course', label: 'My Course', icon: BookOpen },
  { section: 'payments', label: 'Payments', icon: CreditCard },
  { section: 'certificates', label: 'Certificates', icon: Award },
  { section: 'referrals', label: 'Refer a Friend', icon: Gift },
  { section: 'quizzes', label: 'Quiz Performance', icon: BarChart3 },
];

interface StudentSidebarProps {
  studentName?: string;
  studentInitials?: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

function BrowseCoursesCard() {
  return (
    <div className="mx-3 mb-3 rounded-2xl bg-white/10 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
        <Sparkles className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-white">Keep the momentum going</p>
      <p className="mt-1 text-xs leading-relaxed text-white/60">
        Explore new courses and start building your next skill today.
      </p>
      <Link
        href="/digitika"
        className="mt-3 block rounded-lg bg-purple-300/20 px-3 py-2 text-center text-xs font-bold text-white hover:bg-purple-300/30"
      >
        Browse Courses
      </Link>
    </div>
  );
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
    <div className="flex h-full flex-col bg-[#2a1f4d] text-white">
      {/* Brand — same logo asset, on a white pill so it stays legible on purple */}
      <div className="border-b border-white/10 px-5 py-4">
        <Link href="/student" className="inline-flex items-center rounded-xl bg-white px-3 py-2 shadow-sm">
          <Image
            src="/images/logo.png"
            alt="Codevertex Africa Limited"
            width={200}
            height={54}
            priority
            className="h-9 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.section;
          return (
            <button
              key={item.section}
              type="button"
              onClick={() => {
                setActiveSection(item.section);
                onNavigate?.();
              }}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/65 transition-colors',
                'hover:bg-white/10 hover:text-white',
                isActive && 'bg-white/15 font-semibold text-white shadow-inner'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <div className="my-3 border-t border-white/10" />

        <Link
          href="/digitika"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span className="truncate">Browse Courses</span>
        </Link>
      </nav>

      {/* Promo card */}
      <BrowseCoursesCard />

      {/* Footer: user + theme + logout */}
      <div className="border-t border-white/10 p-3">
        {studentName && (
          <div className="mb-2 flex items-center gap-2.5 rounded-xl px-2 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
              {studentInitials}
            </span>
            <span className="min-w-0 truncate text-sm font-medium text-white">{studentName}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle className="shrink-0" />
          <button
            onClick={onLogout}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-red-300/40 hover:bg-red-400/15 hover:text-red-200"
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
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col">
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
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col shadow-2xl lg:hidden"
            >
              <button
                onClick={onCloseMobile}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
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