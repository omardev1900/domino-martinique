import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Fetch users collection from root to join data later
    const usersSnap = await adminDb.collection('users').get();
    const usersMap = new Map();
    usersSnap.docs.forEach(doc => {
      usersMap.set(doc.id, { uid: doc.id, ...doc.data() });
    });

    // Fetch participants from the tournament subcollection
    const snap = await adminDb.collection('tournaments').doc(id).collection('participants')
      .orderBy('score', 'desc')
      .get();
      
    const participants = snap.docs.map((d) => {
      const data = d.data();
      const user = usersMap.get(d.id);
      return {
        id: d.id, // uid
        score: data.score || 0,
        gamesPlayed: data.gamesPlayed || 0,
        joinedAt: data.joinedAt || Date.now(),
        // user details
        displayName: user?.displayName || 'Inconnu',
        avatarId: user?.avatarId || 'avatar_1',
      };
    });

    return NextResponse.json({ participants });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Add exactly to participants subcollection
    await adminDb.collection('tournaments').doc(id).collection('participants').doc(userId).set({
      score: 0,
      gamesPlayed: 0,
      joinedAt: Date.now(),
    });

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    await adminDb.collection('tournaments').doc(id).collection('participants').doc(userId).delete();

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
