import { NextResponse } from 'next/server';
import { clearParentCookie } from '@/lib/parent-access';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearParentCookie(res);
  return res;
}
