import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function GET() {
  try {
    // Count users with FCM tokens stored in Firestore
    const snap = await adminDb.collection('users')
      .where('fcmToken', '!=', null)
      .select('fcmToken')
      .get();
    return NextResponse.json({ reachable: snap.size });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, body, data, target } = await req.json();

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Titre et message requis' }, { status: 400 });
    }

    const messaging = admin.messaging();

    // target: 'all' | 'topic:xxx' | uid
    if (target === 'all') {
      // Send to all stored FCM tokens
      const snap = await adminDb.collection('users')
        .where('fcmToken', '!=', null)
        .select('fcmToken', 'displayName')
        .get();

      if (snap.empty) {
        return NextResponse.json({ sent: 0, failed: 0, message: 'Aucun appareil enregistré' });
      }

      const tokens: string[] = snap.docs
        .map((d) => d.data().fcmToken as string)
        .filter(Boolean);

      // Send in batches of 500
      let totalSent = 0;
      let totalFailed = 0;
      const BATCH = 500;

      for (let i = 0; i < tokens.length; i += BATCH) {
        const batch = tokens.slice(i, i + BATCH);
        const response = await messaging.sendEachForMulticast({
          tokens: batch,
          notification: { title, body },
          data: data || {},
          android: { priority: 'high' },
          apns: { payload: { aps: { sound: 'default' } } },
        });
        totalSent += response.successCount;
        totalFailed += response.failureCount;
      }

      return NextResponse.json({ sent: totalSent, failed: totalFailed });

    } else if (typeof target === 'string' && target.startsWith('topic:')) {
      const topic = target.replace('topic:', '');
      await messaging.send({
        topic,
        notification: { title, body },
        data: data || {},
      });
      return NextResponse.json({ sent: 1, failed: 0, topic });

    } else {
      // Single user by UID
      const userDoc = await adminDb.collection('users').doc(target).get();
      const fcmToken = userDoc.data()?.fcmToken;
      if (!fcmToken) {
        return NextResponse.json({ error: 'Aucun token FCM pour cet utilisateur' }, { status: 404 });
      }
      await messaging.send({ token: fcmToken, notification: { title, body }, data: data || {} });
      return NextResponse.json({ sent: 1, failed: 0 });
    }
  } catch (err: any) {
    console.error('Notify error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
