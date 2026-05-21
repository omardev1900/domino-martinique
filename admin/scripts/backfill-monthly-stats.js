/**
 * SCRIPT DE BACKFILL — users_monthly_stats
 *
 * Lit tous les profils users dans Firestore, extrait les matchs du mois en cours
 * depuis stats.matchHistory, et crée/met à jour les documents users_monthly_stats.
 *
 * Usage :
 *   node scripts/backfill-monthly-stats.js [--dry-run] [--month 2026-05]
 *
 * Options :
 *   --dry-run   Affiche les documents qui seraient écrits sans écrire en BD
 *   --month     Mois cible au format YYYY-MM (défaut : mois courant UTC)
 */

const admin = require('firebase-admin');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const SERVICE_ACCOUNT_PATH = path.join(
    __dirname,
    '../domino-martinique-v1-firebase-adminsdk-fbsvc-6de1d78f2e.json'
);

admin.initializeApp({
    credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH)),
});

const db = admin.firestore();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getYearMonthUtcString(now = new Date()) {
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function getStartOfMonthUtc(yearMonth) {
    // yearMonth = 'YYYY-MM'
    return new Date(`${yearMonth}-01T00:00:00.000Z`).getTime();
}

function computeMonthlyStats(matchHistory, startOfMonth) {
    const monthly = matchHistory.filter(m => (m.timestamp ?? 0) >= startOfMonth);

    const cochonsGiven = monthly.reduce((sum, m) => sum + (m.cochons ?? 0), 0);
    const pointsAccumulated = monthly.reduce((sum, m) => sum + (m.score ?? 0), 0);
    const cochonsSubis = monthly.reduce((sum, m) => {
        const results = m.mancheLeaguePointsEarned?.length
            ? m.mancheLeaguePointsEarned
            : (typeof m.leaguePointsEarned === 'number' ? [m.leaguePointsEarned] : []);
        return sum + results.filter(v => v === -1).length;
    }, 0);

    return {
        cochonsGiven,
        cochonsSubis,
        pointsAccumulated,
        gamesPlayed: monthly.length,
    };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');
    const monthArg = args.find(a => a.startsWith('--month'));
    const targetMonth = monthArg
        ? monthArg.split('=')[1] || args[args.indexOf(monthArg) + 1]
        : getYearMonthUtcString();

    if (!targetMonth?.match(/^\d{4}-\d{2}$/)) {
        console.error('Format de mois invalide. Utilisez --month YYYY-MM');
        process.exit(1);
    }

    const startOfMonth = getStartOfMonthUtc(targetMonth);

    console.log(`\n🔍 Backfill users_monthly_stats`);
    console.log(`   Mois cible  : ${targetMonth}`);
    console.log(`   Start UTC   : ${new Date(startOfMonth).toISOString()}`);
    console.log(`   Mode        : ${isDryRun ? 'DRY RUN (aucune écriture)' : 'PRODUCTION'}\n`);

    // Lire tous les users
    const usersSnap = await db.collection('users').get();
    console.log(`📦 ${usersSnap.size} profils utilisateurs trouvés\n`);

    let written = 0;
    let skipped = 0;
    let errors = 0;

    const batch_size = 400; // Firestore batch limit = 500
    let batch = db.batch();
    let batchCount = 0;

    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const data = userDoc.data();

        // Ignorer les comptes guest ou sans economy
        if (uid.startsWith('guest_') || !data.economy) {
            skipped++;
            continue;
        }

        const stats = data.stats || {};
        const economy = data.economy || {};
        const matchHistory = stats.matchHistory || [];

        const monthly = computeMonthlyStats(matchHistory, startOfMonth);

        // Si aucun match ce mois, skip (pas de doc à créer)
        if (monthly.gamesPlayed === 0) {
            skipped++;
            continue;
        }

        const docId = `${uid}_${targetMonth}`;
        const docData = {
            userId: uid,
            yearMonth: targetMonth,
            cochonsGiven: monthly.cochonsGiven,
            cochonsSubis: monthly.cochonsSubis,
            pointsAccumulated: monthly.pointsAccumulated,
            gamesPlayed: monthly.gamesPlayed,
            displayName: data.displayName || data.email?.split('@')[0] || 'Joueur',
            avatarId: data.avatarId || data.avatarUrl || 'avatar_default',
            activeFrame: economy.activeFrame || null,
            updatedAt: Date.now(),
        };

        console.log(`  ✅ ${docId}`);
        console.log(`     ${monthly.gamesPlayed} matchs | ${monthly.cochonsGiven} cochons donnés | ${monthly.cochonsSubis} cochons subis | ${monthly.pointsAccumulated} pts`);

        if (!isDryRun) {
            try {
                const ref = db.collection('users_monthly_stats').doc(docId);
                batch.set(ref, docData, { merge: true });
                batchCount++;
                written++;

                // Commit par batch de 400
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
            written++;
        }
    }

    // Commit du dernier batch
    if (!isDryRun && batchCount > 0) {
        await batch.commit();
        console.log(`   💾 Dernier batch commité (${batchCount} docs)`);
    }

    console.log(`\n📊 Résultat :`);
    console.log(`   Écrits   : ${written}`);
    console.log(`   Ignorés  : ${skipped} (0 match ce mois ou guest)`);
    console.log(`   Erreurs  : ${errors}`);
    if (isDryRun) {
        console.log(`\n⚠️  Mode DRY RUN — aucune écriture effectuée.`);
        console.log(`   Relancez sans --dry-run pour écrire en production.\n`);
    } else {
        console.log(`\n✅ Backfill terminé. Rechargez le classement dans l'app.\n`);
    }

    process.exit(0);
}

main().catch(err => {
    console.error('Erreur fatale :', err);
    process.exit(1);
});
