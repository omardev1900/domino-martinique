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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const callerUid = await verifySuperAdmin(token);
  if (!callerUid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { uid } = params;
    const body = await req.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { error: 'Missing role' },
        { status: 400 }
      );
    }

    if (!['superadmin', 'manager'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const adminDoc = await adminDb.collection('admins').doc(uid).get();
    if (!adminDoc.exists()) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    await adminDb.collection('admins').doc(uid).update({
      role,
    });

    return NextResponse.json({
      uid,
      role,
      message: 'Admin role updated',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const callerUid = await verifySuperAdmin(token);
  if (!callerUid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { uid } = params;

    if (uid === callerUid) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    const adminDoc = await adminDb.collection('admins').doc(uid).get();
    if (!adminDoc.exists()) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    await adminDb.collection('admins').doc(uid).delete();

    return NextResponse.json({
      uid,
      message: 'Admin deleted',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}
