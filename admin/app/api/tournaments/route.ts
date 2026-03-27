import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const snap = await adminDb.collection('tournaments').orderBy('startAt', 'desc').get();
    const tournaments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ tournaments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!data.title?.trim()) {
      return NextResponse.json({ error: 'title requis' }, { status: 400 });
    }
    const payload = { ...data, updatedAt: Date.now() };
    if (id) {
      await adminDb.collection('tournaments').doc(id).set(payload, { merge: true });
      return NextResponse.json({ id });
    } else {
      payload.createdAt = Date.now();
      payload.status = payload.status || 'UPCOMING';
      payload.participants = [];
      const ref = await adminDb.collection('tournaments').add(payload);
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
    await adminDb.collection('tournaments').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
