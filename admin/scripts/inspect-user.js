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
    const email = 'aaaaa@aaaaa.aaaaa';
    console.log(`Looking up Auth record for email: ${email}`);
    let userRecord;
    try {
        userRecord = await admin.auth().getUserByEmail(email);
        console.log('Auth userRecord found:');
        console.log(`  UID: ${userRecord.uid}`);
        console.log(`  DisplayName: ${userRecord.displayName}`);
        console.log(`  Email: ${userRecord.email}`);
    } catch (e) {
        console.log(`Auth record for email ${email} not found:`, e.message);
    }

    const providedUid = 'upy3GDQ9M0MGcv6KFqFsCOn1LdB2';
    console.log(`\nInspecting Firestore document for UID: ${providedUid}`);
    const userDoc1 = await db.collection('users').doc(providedUid).get();
    if (userDoc1.exists) {
        console.log('Document data for provided UID:');
        console.log(JSON.stringify(userDoc1.data(), null, 2));
    } else {
        console.log('No Firestore document found for provided UID.');
    }

    const otherUid = 'l7zzKn7mW3frsFXCNYAaQGVxNCO2';
    console.log(`\nInspecting Firestore document for other UID: ${otherUid}`);
    const userDoc3 = await db.collection('users').doc(otherUid).get();
    if (userDoc3.exists) {
        console.log('Document data for other UID:');
        console.log(JSON.stringify(userDoc3.data(), null, 2));
    } else {
        console.log('No Firestore document found for other UID.');
    }

    if (userRecord && userRecord.uid !== providedUid && userRecord.uid !== otherUid) {
        console.log(`\nInspecting Firestore document for Auth UID: ${userRecord.uid}`);
        const userDoc2 = await db.collection('users').doc(userRecord.uid).get();
        if (userDoc2.exists) {
            console.log('Document data for Auth UID:');
            console.log(JSON.stringify(userDoc2.data(), null, 2));
        } else {
            console.log('No Firestore document found for Auth UID.');
        }
    }

    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
