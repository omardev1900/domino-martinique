'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export type AdminState = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
};

export function useAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({
    user: null,
    isAdmin: false,
    loading: true,
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, isAdmin: false, loading: false });
        router.replace('/login');
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          setState({ user, isAdmin: true, loading: false });
        } else {
          setState({ user, isAdmin: false, loading: false });
          await auth.signOut();
          router.replace('/login');
        }
      } catch {
        setState({ user: null, isAdmin: false, loading: false });
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return state;
}

export function formatTimestamp(ts: unknown): string {
  if (!ts) return '—';
  let date: Date;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    date = (ts as { toDate: () => Date }).toDate();
  } else if (ts instanceof Date) {
    date = ts;
  } else if (typeof ts === 'number') {
    date = new Date(ts);
  } else {
    return '—';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function timeAgo(ts: unknown): string {
  if (!ts) return '—';
  let date: Date;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    date = (ts as { toDate: () => Date }).toDate();
  } else if (ts instanceof Date) {
    date = ts;
  } else if (typeof ts === 'number') {
    date = new Date(ts);
  } else {
    return '—';
  }
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'à l\'instant';
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `il y a ${diffD}j`;
}
