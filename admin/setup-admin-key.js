/**
 * Script utilitaire : lit le fichier service account JSON téléchargé depuis Firebase
 * et génère les lignes à ajouter dans .env.local
 *
 * Usage: node setup-admin-key.js chemin/vers/serviceAccount.json
 */
const fs = require('fs');
const path = require('path');

const keyFile = process.argv[2];
if (!keyFile) {
  console.error('Usage: node setup-admin-key.js chemin/vers/serviceAccount.json');
  process.exit(1);
}

const key = JSON.parse(fs.readFileSync(path.resolve(keyFile), 'utf8'));

// La private_key contient déjà des vrais \n — on les encode en \n littéraux pour .env
const privateKeyOneLine = key.private_key.replace(/\n/g, '\\n');

const envLines = [
  `FIREBASE_ADMIN_CLIENT_EMAIL=${key.client_email}`,
  `FIREBASE_ADMIN_PRIVATE_KEY="${privateKeyOneLine}"`,
];

console.log('\n✅ Copie ces lignes dans admin/.env.local :\n');
console.log(envLines.join('\n'));
console.log('\n');
