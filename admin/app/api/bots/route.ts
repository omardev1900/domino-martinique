import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const BOT_DIFFICULTIES = ['TI_MANMAY', 'MAPIPI', 'GRAN_MOUN', 'METKAYALI'] as const;
type BotDifficulty = typeof BOT_DIFFICULTIES[number];

function isBotDifficulty(value: unknown): value is BotDifficulty {
  return typeof value === 'string' && BOT_DIFFICULTIES.includes(value as BotDifficulty);
}

function normalizeBot(docId: string, raw: Record<string, unknown>) {
  const difficulty = isBotDifficulty(raw.difficulty) ? raw.difficulty : 'TI_MANMAY';

  return {
    firestoreId: docId,
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : docId,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Bot sans nom',
    avatarId: typeof raw.avatarId === 'string' ? raw.avatarId : '',
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
    difficulty,
  };
}

export async function GET() {
  try {
    const snap = await adminDb.collection('bots').get();
    const bots = snap.docs.map((d) => normalizeBot(d.id, d.data() as Record<string, unknown>));
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
    if (!isBotDifficulty(difficulty)) {
      return NextResponse.json({ error: 'difficulty invalide' }, { status: 400 });
    }

    const botData: Record<string, any> = {
      id: typeof id === 'string' ? id.trim() : '',
      name: name.trim(),
      avatarId: typeof avatarId === 'string' ? avatarId.trim() : '',
      difficulty,
    };
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
