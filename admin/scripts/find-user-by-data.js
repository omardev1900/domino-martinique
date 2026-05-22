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

async function main() {
    console.log('Scanning all Firestore users for any active stats/economy...');
    const usersSnap = await db.collection('users').get();
    console.log(`Loaded ${usersSnap.size} users.`);

    let count = 0;
    for (const doc of usersSnap.docs) {
        const data = doc.data();
        const economy = data.economy || {};
        const stats = data.stats || {};
        const displayName = data.displayName || '';
        const email = data.email || '';

        const coins = economy.coins ?? stats.coins ?? 0;
        const diamonds = economy.diamonds ?? stats.diamonds ?? 0;
        const gamesPlayed = stats.gamesPlayed ?? 0;
        const totalCochons = stats.totalCochonsInflicted ?? 0;

        // Print details if they have non-trivial state
        if (coins > 500 || diamonds > 0 || gamesPlayed > 0 || totalCochons > 0 || email.includes('@') || displayName) {
            console.log(`- UID: ${doc.id}`);
            console.log(`  Name: "${displayName}" | Email: "${email}"`);
            console.log(`  Coins: ${coins} | Diamonds: ${diamonds} | Games: ${gamesPlayed} (Won: ${stats.gamesWon}) | Cochons: ${totalCochons}`);
            if (stats.matchHistory && stats.matchHistory.length > 0) {
                console.log(`  Match History Count: ${stats.matchHistory.length}`);
            }
            count++;
        }
    }
    console.log(`Total active/non-trivial users printed: ${count}`);
    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
