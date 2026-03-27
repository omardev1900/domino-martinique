import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    // 1. Récupère tous les users depuis Firebase Auth (avec email)
    const listResult = await adminAuth.listUsers(1000);
    const authMap = new Map<string, { email: string; disabled: boolean }>();
    for (const user of listResult.users) {
      authMap.set(user.uid, {
        email: user.email || '',
        disabled: user.disabled,
      });
    }

    // 2. Récupère tous les profils depuis Firestore
    const snap = await adminDb.collection('users').get();
    const users = snap.docs.map((doc) => {
      const data = doc.data();
      const authData = authMap.get(doc.id);
      return {
        uid: doc.id,
        displayName: data.displayName || null,
        email: authData?.email || data.email || null,
        avatarId: data.avatarId || null,
        isBanned: data.isBanned || false,
        banReason: data.banReason || null,
        bannedAt: data.bannedAt || null,
        stats: data.stats || null,
        economy: data.economy || null,
      };
    });

    // Trie par displayName
    users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('API /users error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
