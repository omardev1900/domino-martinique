import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

async function verifySuperAdmin(token: string) {
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const callerDoc = await adminDb.collection('admins').doc(decoded.uid).get();

    if (!callerDoc.exists()) {
      return null;
    }

    const data = callerDoc.data();
    const isSuperAdmin = !data?.role || data.role === 'superadmin';

    return isSuperAdmin ? decoded.uid : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const callerUid = await verifySuperAdmin(token);
  if (!callerUid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const adminsDocs = await adminDb.collection('admins').get();
    const admins = await Promise.all(
      adminsDocs.docs.map(async (doc) => {
        const uid = doc.id;
        const data = doc.data();
        try {
          const userRecord = await adminAuth.getUser(uid);
          return {
            uid,
            email: userRecord.email || '—',
            role: data.role || 'superadmin',
            createdAt: data.createdAt || null,
          };
        } catch {
          return {
            uid,
            email: '—',
            role: data.role || 'superadmin',
            createdAt: data.createdAt || null,
          };
        }
      })
    );

    return NextResponse.json({ admins });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const callerUid = await verifySuperAdmin(token);
  if (!callerUid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Missing email or role' },
        { status: 400 }
      );
    }

    if (!['superadmin', 'manager'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.getUserByEmail(email);
    const uid = userRecord.uid;

    await adminDb.collection('admins').doc(uid).set(
      {
        role,
        createdAt: Date.now(),
      },
      { merge: true }
    );

    return NextResponse.json({
      uid,
      email,
      role,
      createdAt: Date.now(),
    });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}
