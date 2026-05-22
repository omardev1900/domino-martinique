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
    const uid = 'upy3GDQ9M0MGcv6KFqFsCOn1LdB2';
    console.log(`Restoring stats and economy for UID: ${uid}`);
    
    // We restore stats to what was shown in the first capture (admin view)
    const statsData = {
        gamesPlayed: 55,
        gamesWon: 21,
        totalCochonsInflicted: 21,
        totalCochonsSubis: 0,
        totalPointsAccumulated: 0, // Not sure, but let's say 0
        totalRoundsWon: 0,
        totalLeague5Pts: 0,
        totalLeague4Pts: 0,
        totalLeague2Pts: 0,
        totalLeague1Pt: 0,
        totalLeagueMinus1Pt: 0,
        matchHistory: [],
        coins: 1000,
        xp: 0,
        level: 1,
        diamonds: 0,
        leaguePoints: 0,
        leagueGrade: 'APPRENTI',
    };

    const economyData = {
        coins: 1000,
        diamonds: 0,
        level: 1,
        xp: 0,
        leaguePoints: 0,
        leagueGrade: 'APPRENTI',
        cochonsGiven: 21,
        unlockedFrames: [],
        activeFrame: null,
        chatInventory: {},
        unlockedChatItems: []
    };

    await db.collection('users').doc(uid).set({
        displayName: 'aaaaa',
        avatarId: 'avatar_default',
        stats: statsData,
        economy: economyData
    }, { merge: true });

    console.log('Restoration completed!');
    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
