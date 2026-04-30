import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST /api/migrate-cochons
 * Migration one-shot : copie stats.totalCochonsInflicted → economy.cochonsGiven
 * pour tous les joueurs dont economy.cochonsGiven < stats.totalCochonsInflicted.
 * Réservé à l'admin dashboard. À désactiver après exécution.
 */
export async function POST() {
  try {
    const usersSnap = await adminDb.collection('users').get();

    let migrated = 0;
    let skipped = 0;
    const batch = adminDb.batch();

    usersSnap.forEach((userDoc) => {
      const data = userDoc.data();
      const statsTotal: number = data?.stats?.totalCochonsInflicted ?? 0;
      const economyCochons: number = data?.economy?.cochonsGiven ?? 0;

      if (statsTotal > economyCochons) {
        batch.update(userDoc.ref, {
          'economy.cochonsGiven': statsTotal,
        });
        migrated++;
      } else {
        skipped++;
      }
    });

    await batch.commit();

    console.log(`[migrateCochonsGiven] Migrated: ${migrated}, Skipped: ${skipped}`);
    return NextResponse.json({ success: true, migrated, skipped });
  } catch (err: any) {
    console.error('[migrateCochonsGiven] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
