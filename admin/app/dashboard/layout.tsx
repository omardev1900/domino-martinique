'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAdmin } from '@/lib/adminAuth';

const SUPERADMIN_ONLY = [
  '/dashboard/players',
  '/dashboard/bans',
  '/dashboard/config',
  '/dashboard/logs',
  '/dashboard/leaderboard',
  '/dashboard/notifications',
  '/dashboard/news',
  '/dashboard/feedbacks',
  '/dashboard/tables',
  '/dashboard/access',
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role === 'manager') {
      const isRestricted = SUPERADMIN_ONLY.some((p) => pathname.startsWith(p));
      if (isRestricted) {
        router.replace('/dashboard/analytics');
      }
    }
  }, [loading, role, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Vérification des droits…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar user={user} role={role} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
