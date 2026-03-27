import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST() {
  try {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24h ago

    const snap = await adminDb
      .collection('rooms')
      .where('status', 'in', ['WAITING', 'PLAYING'])
      .where('lastActivity', '<', cutoff)
      .get();

    if (snap.empty) {
      return NextResponse.json({ deleted: 0 });
    }

    // Batch delete (max 500 per batch)
    const BATCH_SIZE = 400;
    let deleted = 0;
    for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      snap.docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
      await batch.commit();
      deleted += Math.min(BATCH_SIZE, snap.docs.length - i);
    }

    return NextResponse.json({ deleted });
  } catch (err: any) {
    console.error('Cleanup error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
