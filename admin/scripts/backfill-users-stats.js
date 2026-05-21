/**
 * SCRIPT DE BACKFILL — users global stats (totalCochonsSubis & totalCochonsInflicted)
 *
 * Lit tous les profils users dans Firestore, recalcule leurs stats globales de cochons
 * (donnés et subis) depuis l'historique complet de leurs matchs, et met à jour les champs
 * stats.totalCochonsSubis et stats.totalCochonsInflicted si nécessaire.
 *
 * Usage :
 *   node scripts/backfill-users-stats.js [--dry-run]
 */

const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(
    __dirname,
    '../domino-martinique-v1-firebase-adminsdk-fbsvc-6de1d78f2e.json'
);

admin.initializeApp({
    credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
});

const db = admin.firestore();

function computeGlobalStats(matchHistory) {
    const totalCochonsInflicted = matchHistory.reduce((sum, m) => sum + (m.cochons ?? 0), 0);
    const totalCochonsSubis = matchHistory.reduce((sum, m) => {
        const results = m.mancheLeaguePointsEarned?.length
            ? m.mancheLeaguePointsEarned
            : (typeof m.leaguePointsEarned === 'number' ? [m.leaguePointsEarned] : []);
        return sum + results.filter(v => v === -1).length;
    }, 0);

    return {
        totalCochonsInflicted,
        totalCochonsSubis,
    };
}

async function main() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');

    console.log(`\n🔍 Backfill stats globaux des utilisateurs`);
    console.log(`   Mode : ${isDryRun ? 'DRY RUN (aucune écriture)' : 'PRODUCTION'}\n`);

    const usersSnap = await db.collection('users').get();
    console.log(`📦 ${usersSnap.size} profils utilisateurs trouvés\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const batch_size = 400;
    let batch = db.batch();
    let batchCount = 0;

    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const data = userDoc.data();

        if (uid.startsWith('guest_') || !data.economy) {
            skipped++;
            continue;
        }

        const stats = data.stats || {};
        const matchHistory = stats.matchHistory || [];

        const computed = computeGlobalStats(matchHistory);

        const currentSubis = stats.totalCochonsSubis ?? 0;
        const currentInflicted = stats.totalCochonsInflicted ?? 0;

        // Si les valeurs calculées diffèrent des valeurs existantes, on met à jour
        if (computed.totalCochonsSubis !== currentSubis || computed.totalCochonsInflicted !== currentInflicted) {
            console.log(`  ✅ ${uid} (${data.displayName || 'Joueur'}):`);
            console.log(`     Subis     : ${currentSubis} ➔ ${computed.totalCochonsSubis}`);
            console.log(`     Infligés  : ${currentInflicted} ➔ ${computed.totalCochonsInflicted}`);

            if (!isDryRun) {
                try {
                    const ref = db.collection('users').doc(uid);
                    batch.update(ref, {
                        'stats.totalCochonsSubis': computed.totalCochonsSubis,
                        'stats.totalCochonsInflicted': computed.totalCochonsInflicted,
                        'stats.lastSync': Date.now()
                    });
                    batchCount++;
                    updated++;

                    if (batchCount >= batch_size) {
                        await batch.commit();
                        console.log(`   💾 Batch commité (${batchCount} docs)`);
                        batch = db.batch();
                        batchCount = 0;
                    }
                } catch (err) {
                    console.error(`  ❌ Erreur pour ${uid}:`, err.message);
                    errors++;
                }
            } else {
                updated++;
            }
        } else {
            skipped++;
        }
    }

    if (!isDryRun && batchCount > 0) {
        await batch.commit();
        console.log(`   💾 Dernier batch commité (${batchCount} docs)`);
    }

    console.log(`\n📊 Résultat :`);
    console.log(`   Mis à jour : ${updated}`);
    console.log(`   Ignorés    : ${skipped}`);
    console.log(`   Erreurs    : ${errors}`);
    
    if (isDryRun) {
        console.log(`\n⚠️  Mode DRY RUN — aucune écriture effectuée.`);
    } else {
        console.log(`\n✅ Mise à jour des stats globales terminée !\n`);
    }

    process.exit(0);
}

main().catch(err => {
    console.error('Erreur fatale :', err);
    process.exit(1);
});
