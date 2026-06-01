'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { AdminRole } from '@/lib/adminAuth';

type SidebarProps = {
  user: User | null;
  role: AdminRole | null;
  isCollapsed: boolean;
  onToggle: () => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  superadminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: '/dashboard/analytics', label: 'Dashboard', icon: '📈' },
  { href: '/dashboard/overview', label: 'Vue d\'ensemble', icon: '📊' },
  { href: '/dashboard/players', label: 'Joueurs', icon: '👥', superadminOnly: true },
  { href: '/dashboard/tables', label: 'Tables en cours', icon: '🎲' },
  { href: '/dashboard/bans', label: 'Bans', icon: '🚫', superadminOnly: true },
  { href: '/dashboard/config', label: 'Configuration', icon: '⚙️', superadminOnly: true },
  { href: '/dashboard/leaderboard', label: 'Classement', icon: '🏆' },
  { href: '/dashboard/bots', label: 'Bots IA', icon: '🤖' },
  { href: '/dashboard/store', label: 'Boutique', icon: '🏪' },
  { href: '/dashboard/chat', label: 'Tchat en jeu', icon: '💬' },
  { href: '/dashboard/tournaments', label: 'Tournois', icon: '🥊' },
  { href: '/dashboard/feedbacks', label: 'Feedbacks', icon: '📩', superadminOnly: true },
  { href: '/dashboard/logs', label: 'Logs admin', icon: '📋', superadminOnly: true },
  { href: '/dashboard/notifications', label: 'Notifications', icon: '📣', superadminOnly: true },
  { href: '/dashboard/news', label: 'Actualités', icon: '📰' },
  { href: '/dashboard/ads', label: 'Publicités', icon: '📢' },
  { href: '/dashboard/audio', label: 'Musiques', icon: '🎵', superadminOnly: true },
  { href: '/dashboard/access', label: 'Accès admins', icon: '🔑', superadminOnly: true },
];

export default function Sidebar({ user, role, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadFeedbacks, setUnreadFeedbacks] = useState(0);

  useEffect(() => {
    if (role === 'superadmin') {
      const q = query(collection(db, 'feedbacks'), where('readAt', '==', null));
      const unsub = onSnapshot(q, (snap) => setUnreadFeedbacks(snap.size), () => {});
      return () => unsub();
    }
  }, [role]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const visibleItems = navItems.filter(
    (item) => !item.superadminOnly || role === 'superadmin'
  );

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 transition-all duration-300 relative`}>
      {/* Toggle button */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-20 bg-gray-800 border border-gray-700 text-gray-400 w-6 h-6 rounded-full flex items-center justify-center hover:text-white transition-colors z-50 shadow-lg"
      >
        <span className="text-[10px]">{isCollapsed ? '→' : '←'}</span>
      </button>

      {/* Logo */}
      <div className={`px-4 py-6 border-b border-gray-800 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-6'}`}>
        <span className="text-2xl">🎲</span>
        {!isCollapsed && (
          <div>
            <p className="text-white font-bold text-lg leading-tight">Admin</p>
            <p className="text-yellow-400 font-semibold text-sm leading-tight">Domino</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const badge = item.href === '/dashboard/feedbacks' && unreadFeedbacks > 0
            ? unreadFeedbacks
            : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <span className="text-base">{item.icon}</span>
              {!isCollapsed && <span className="flex-1">{item.label}</span>}
              {badge !== null && (
                <span className={`flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center ${isCollapsed ? 'absolute top-1 right-2 scale-75' : ''}`}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className={`px-4 py-4 border-t border-gray-800 ${isCollapsed ? 'items-center flex flex-col' : ''}`}>
        {!isCollapsed ? (
          <>
            <div className="mb-3 px-2">
              <p className="text-gray-500 text-xs mb-0.5">Connecté en tant que</p>
              <p className="text-gray-300 text-sm font-medium truncate">
                {user?.email ?? '—'}
              </p>
              {role && (
                <p className="text-xs mt-0.5">
                  <span
                    className={
                      role === 'superadmin'
                        ? 'text-yellow-400'
                        : 'text-blue-400'
                    }
                  >
                    {role === 'superadmin' ? 'Superadmin' : 'Manager'}
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
            >
              <span>🚪</span>
              Déconnexion
            </button>
          </>
        ) : (
          <button
            onClick={handleSignOut}
            title="Déconnexion"
            className="p-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-all"
          >
            <span>🚪</span>
          </button>
        )}
      </div>
    </aside>
  );
}
