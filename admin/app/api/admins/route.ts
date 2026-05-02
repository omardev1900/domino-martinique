import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

async function verifySuperAdmin(token: string): Promise<{ uid: string } | { error: string }> {
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const callerDoc = await adminDb.collection('admins').doc(decoded.uid).get();

    if (!callerDoc.exists) {
      return { error: `doc_not_found:uid=${decoded.uid}` };
    }

    const data = callerDoc.data() ?? {};
    const role = data.role;
    const isSuperAdmin = role === undefined || role === 'superadmin';

    if (!isSuperAdmin) {
      return { error: `role_denied:role=${role}:uid=${decoded.uid}` };
    }

    return { uid: decoded.uid };
  } catch (err: any) {
    return { error: `exception:${err?.code ?? err?.message ?? String(err)}` };
  }
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'no_token' }, { status: 401 });
  }

  const result = await verifySuperAdmin(token);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  const callerUid = result.uid;

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

  const postResult = await verifySuperAdmin(token);
  if ('error' in postResult) {
    return NextResponse.json({ error: postResult.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, role, password } = body;

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

    let userRecord;
    let createdAuthUser = false;

    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }

      if (!password) {
        return NextResponse.json(
          { error: 'User not found. Provide a temporary password to create the account.' },
          { status: 400 }
        );
      }

      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters.' },
          { status: 400 }
        );
      }

      userRecord = await adminAuth.createUser({
        email,
        password,
      });
      createdAuthUser = true;
    }

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
      createdAuthUser,
    });
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    if (error.code === 'auth/invalid-password') {
      return NextResponse.json(
        { error: 'Invalid password.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}
