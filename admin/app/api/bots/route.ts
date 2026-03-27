import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const snap = await adminDb.collection('bots').get();
    const bots = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ bots });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, avatarId, difficulty } = body;
    if (!name?.trim() || !difficulty) {
      return NextResponse.json({ error: 'name et difficulty requis' }, { status: 400 });
    }
    if (id) {
      // Update existing
      await adminDb.collection('bots').doc(id).set({ name, avatarId: avatarId || '', difficulty }, { merge: true });
      return NextResponse.json({ id });
    } else {
      // Create new
      const ref = await adminDb.collection('bots').add({ name, avatarId: avatarId || '', difficulty });
      return NextResponse.json({ id: ref.id });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
    await adminDb.collection('bots').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
