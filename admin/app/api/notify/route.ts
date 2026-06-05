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

    // target: 'all' | 'inactive' | 'topic:xxx' | 'uid:xxx,yyy'
    if (target === 'all' || target === 'inactive') {
      // Send to stored FCM tokens
      const snap = await adminDb.collection('users')
        .where('fcmToken', '!=', null)
        .select('fcmToken', 'displayName', 'lastActiveAt')
        .get();

      if (snap.empty) {
        return NextResponse.json({ sent: 0, failed: 0, message: 'Aucun appareil enregistré' });
      }

      let tokens: string[] = [];
      if (target === 'inactive') {
        const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
        tokens = snap.docs
          .filter(d => {
             const data = d.data();
             const lastActiveAt = data.lastActiveAt || 0;
             return lastActiveAt < twoDaysAgo;
          })
          .map(d => d.data().fcmToken as string)
          .filter(Boolean);
      } else {
        tokens = snap.docs
          .map((d) => d.data().fcmToken as string)
          .filter(Boolean);
      }

      if (tokens.length === 0) {
        return NextResponse.json({ sent: 0, failed: 0, message: 'Aucun utilisateur trouvé' });
      }

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

    } else if (typeof target === 'string' && target.startsWith('uid:')) {
      const uids = target.replace('uid:', '').split(',').map(s => s.trim()).filter(Boolean);
      const tokens: string[] = [];
      for (const uid of uids) {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        const fcmToken = userDoc.data()?.fcmToken;
        if (fcmToken) tokens.push(fcmToken);
      }
      
      if (tokens.length === 0) {
        return NextResponse.json({ error: 'Aucun token FCM pour ces utilisateurs' }, { status: 404 });
      }

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
      return NextResponse.json({ error: 'Cible invalide' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Notify error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
