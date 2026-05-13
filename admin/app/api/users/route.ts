import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    // 1. Récupère tous les users depuis Firebase Auth (avec email)
    const listResult = await adminAuth.listUsers(1000);
    const authMap = new Map<string, { email: string; disabled: boolean; creationTime: string | null; lastSignInTime: string | null }>();
    for (const user of listResult.users) {
      authMap.set(user.uid, {
        email: user.email || '',
        disabled: user.disabled,
        creationTime: user.metadata.creationTime || null,
        lastSignInTime: user.metadata.lastSignInTime || null,
      });
    }

    // 2. Récupère tous les profils depuis Firestore
    const snap = await adminDb.collection('users').get();
    const users = snap.docs.map((doc) => {
      const data = doc.data();
      const authData = authMap.get(doc.id);
      const stats = data.stats || null;
      const economy = data.economy || null;
      const matchHistory = Array.isArray(stats?.matchHistory) ? stats.matchHistory : [];
      const creationTimestamp = authData?.creationTime ? Date.parse(authData.creationTime) : null;
      const historyTimestamps = matchHistory
        .map((entry: any) => typeof entry?.timestamp === 'number' ? entry.timestamp : null)
        .filter((value: number | null): value is number => value !== null);
      const earliestHistoryTimestamp = historyTimestamps.length > 0 ? Math.min(...historyTimestamps) : null;
      const historyCount = matchHistory.length;
      const gamesPlayed = stats?.gamesPlayed ?? 0;
      const gamesWon = stats?.gamesWon ?? 0;
      const cochonsInflicted = stats?.totalCochonsInflicted ?? 0;
      const cochonsGiven = economy?.cochonsGiven ?? 0;
      const createdAfterHistory = (
        creationTimestamp !== null &&
        earliestHistoryTimestamp !== null &&
        earliestHistoryTimestamp < (creationTimestamp - 5 * 60 * 1000)
      );
      const hasNonZeroProgressWithoutHistory = historyCount === 0 && (
        gamesPlayed > 0 ||
        gamesWon > 0 ||
        cochonsInflicted > 0 ||
        cochonsGiven > 0 ||
        (economy?.leaguePoints ?? 0) > 0
      );
      const gamesPlayedMismatch = historyCount > 0 && gamesPlayed !== historyCount;
      const suspiciousReasons = [
        ...(createdAfterHistory ? ['history_before_account_creation'] : []),
        ...(hasNonZeroProgressWithoutHistory ? ['non_zero_progress_without_history'] : []),
        ...(gamesPlayedMismatch ? ['games_played_mismatch_history_count'] : []),
      ];

      return {
        uid: doc.id,
        displayName: data.displayName || null,
        email: authData?.email || data.email || null,
        authCreationTime: authData?.creationTime || null,
        authLastSignInTime: authData?.lastSignInTime || null,
        avatarId: data.avatarId || null,
        isBanned: data.isBanned || false,
        banReason: data.banReason || null,
        bannedAt: data.bannedAt || null,
        stats,
        economy,
        diagnostics: {
          historyCount,
          earliestHistoryTimestamp,
          suspiciousContamination: suspiciousReasons.length > 0,
          suspiciousReasons,
        },
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
