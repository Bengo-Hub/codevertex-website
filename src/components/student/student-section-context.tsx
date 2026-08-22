'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type StudentSection = 'overview' | 'course' | 'payments' | 'certificates' | 'referrals' | 'quizzes';

interface StudentSectionContextValue {
  activeSection: StudentSection;
  setActiveSection: (section: StudentSection) => void;
}

const StudentSectionContext = createContext<StudentSectionContextValue | null>(null);

export function StudentSectionProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<StudentSection>('overview');
  const value = useMemo(() => ({ activeSection, setActiveSection }), [activeSection]);
  return <StudentSectionContext.Provider value={value}>{children}</StudentSectionContext.Provider>;
}

/** Read + set which section of the student dashboard is currently visible. */
export function useStudentSection(): StudentSectionContextValue {
  const ctx = useContext(StudentSectionContext);
  if (!ctx) {
    throw new Error('useStudentSection must be used within a StudentSectionProvider');
  }
  return ctx;
}
