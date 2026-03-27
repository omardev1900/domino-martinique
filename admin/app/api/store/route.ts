import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const snap = await adminDb.collection('store_catalog').get();
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
    if (!item.id?.trim() || !item.name?.trim() || !item.type || !item.rarity) {
      return NextResponse.json({ error: 'id, name, type, rarity requis' }, { status: 400 });
    }
    if (firestoreId) {
      await adminDb.collection('store_catalog').doc(firestoreId).set(item, { merge: true });
      return NextResponse.json({ firestoreId });
    } else {
      // Use item.id as doc ID for easy lookup
      await adminDb.collection('store_catalog').doc(item.id).set(item);
      return NextResponse.json({ firestoreId: item.id });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { firestoreId } = await req.json();
    if (!firestoreId) return NextResponse.json({ error: 'firestoreId requis' }, { status: 400 });
    await adminDb.collection('store_catalog').doc(firestoreId).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
