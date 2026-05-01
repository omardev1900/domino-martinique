import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const snap = await adminDb.collection('bots').get();
    const bots = snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
    return NextResponse.json({ bots });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firestoreId, id, name, avatarId, difficulty, imageUrl } = body;
    if (!name?.trim() || !difficulty) {
      return NextResponse.json({ error: 'name et difficulty requis' }, { status: 400 });
    }
    const botData: Record<string, any> = { id: id || '', name, avatarId: avatarId || '', difficulty };
    if (imageUrl) botData.imageUrl = imageUrl;

    if (firestoreId) {
      // Mise à jour — utilise l'ID Firestore réel du document
      await adminDb.collection('bots').doc(firestoreId).set(botData, { merge: true });
      return NextResponse.json({ firestoreId });
    } else {
      // Création — utilise id comme ID de document si fourni
      if (id) {
        await adminDb.collection('bots').doc(id).set(botData);
        return NextResponse.json({ firestoreId: id });
      } else {
        const ref = await adminDb.collection('bots').add(botData);
        return NextResponse.json({ firestoreId: ref.id });
      }
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { firestoreId } = await req.json();
    if (!firestoreId) return NextResponse.json({ error: 'firestoreId requis' }, { status: 400 });
    await adminDb.collection('bots').doc(firestoreId).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
