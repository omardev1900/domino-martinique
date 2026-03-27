import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const CONFIG_DOC = 'config/game';

export async function GET() {
  try {
    const snap = await adminDb.doc(CONFIG_DOC).get();
    if (!snap.exists) {
      return NextResponse.json({ config: null });
    }
    return NextResponse.json({ config: snap.data() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { config, updatedBy } = body;
    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Invalid config' }, { status: 400 });
    }
    await adminDb.doc(CONFIG_DOC).set({
      ...config,
      updatedAt: Date.now(),
      updatedBy: updatedBy || 'admin',
    }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
