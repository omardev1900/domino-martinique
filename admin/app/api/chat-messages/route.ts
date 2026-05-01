import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const COLLECTION = 'chat_messages';

export async function GET() {
  try {
    const snap = await adminDb.collection(COLLECTION).orderBy('order', 'asc').get();
    const items = snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firestoreId, ...item } = body;

    if (!item.text?.trim() || !item.category) {
      return NextResponse.json({ error: 'text et category requis' }, { status: 400 });
    }

    if (firestoreId) {
      await adminDb.collection(COLLECTION).doc(firestoreId).set(item, { merge: true });
      return NextResponse.json({ firestoreId });
    } else {
      const ref = await adminDb.collection(COLLECTION).add(item);
      return NextResponse.json({ firestoreId: ref.id });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { firestoreId } = await req.json();
    if (!firestoreId) return NextResponse.json({ error: 'firestoreId requis' }, { status: 400 });
    await adminDb.collection(COLLECTION).doc(firestoreId).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
