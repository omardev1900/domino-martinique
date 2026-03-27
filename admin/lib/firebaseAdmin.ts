import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Initialise Firebase Admin une seule fois (singleton)
if (!admin.apps.length) {
  // Cherche le fichier service account JSON dans le dossier admin/
  const adminDir = process.cwd();
  const jsonFiles = fs.readdirSync(adminDir).filter(
    (f) => f.startsWith('domino-martinique') && f.endsWith('.json') && !f.includes('package')
  );

  if (jsonFiles.length > 0) {
    // Utilise le fichier JSON directement — évite les problèmes d'horloge JWT
    const serviceAccount = JSON.parse(
      fs.readFileSync(path.join(adminDir, jsonFiles[0]), 'utf8')
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fallback sur les variables d'environnement
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
