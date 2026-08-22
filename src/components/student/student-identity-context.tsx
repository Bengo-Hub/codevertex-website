'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface StudentIdentity {
  name: string;
  initials: string;
}

interface StudentIdentityContextValue {
  identity: StudentIdentity | null;
  setIdentity: (identity: StudentIdentity | null) => void;
}

const StudentIdentityContext = createContext<StudentIdentityContextValue | null>(null);

export function StudentIdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<StudentIdentity | null>(null);
  const value = useMemo(() => ({ identity, setIdentity }), [identity]);
  return <StudentIdentityContext.Provider value={value}>{children}</StudentIdentityContext.Provider>;
}

/** Read the current student's identity (name/initials), if loaded yet. */
export function useStudentIdentity(): StudentIdentity | null {
  const ctx = useContext(StudentIdentityContext);
  return ctx?.identity ?? null;
}

/** Publish the loaded student's identity so the sidebar/topbar can show it. */
export function useSetStudentIdentity() {
  const ctx = useContext(StudentIdentityContext);
  return ctx?.setIdentity ?? (() => {});
}

function fullNameToInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export { fullNameToInitials };
