'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

type SidebarProps = {
  user: User | null;
};

const navItems = [
  { href: '/dashboard', label: 'Vue d\'ensemble', icon: '📊' },
  { href: '/dashboard/players', label: 'Joueurs', icon: '👥' },
  { href: '/dashboard/tables', label: 'Tables en cours', icon: '🎲' },
  { href: '/dashboard/analytics', label: 'Activité', icon: '📈' },
  { href: '/dashboard/bans', label: 'Bans', icon: '🚫' },
  { href: '/dashboard/config', label: 'Configuration', icon: '⚙️' },
  { href: '/dashboard/leaderboard', label: 'Classement', icon: '🏆' },
  { href: '/dashboard/bots', label: 'Bots IA', icon: '🤖' },
  { href: '/dashboard/store', label: 'Boutique', icon: '🏪' },
  { href: '/dashboard/tournaments', label: 'Tournois', icon: '🥊' },
  { href: '/dashboard/logs', label: 'Logs admin', icon: '📋' },
  { href: '/dashboard/notifications', label: 'Notifications', icon: '📣' },
  { href: '/dashboard/news', label: 'Actualités', icon: '📰' },
  { href: '/dashboard/audio', label: 'Musiques', icon: '🎵' },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎲</span>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Admin</p>
            <p className="text-yellow-400 font-semibold text-sm leading-tight">Domino</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="mb-3 px-2">
          <p className="text-gray-500 text-xs mb-0.5">Connecté en tant que</p>
          <p className="text-gray-300 text-sm font-medium truncate">
            {user?.email ?? '—'}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20"
        >
          <span>🚪</span>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
