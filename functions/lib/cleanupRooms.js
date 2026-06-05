"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupGhostRoomsCron = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.cleanupGhostRoomsCron = functions.pubsub
    .schedule('every 15 minutes')
    .onRun(async (context) => {
    const db = admin.firestore();
    const now = Date.now();
    // 15 minutes d'inactivité
    const cutoff = now - 15 * 60 * 1000;
    try {
        const snap = await db
            .collection('rooms')
            .where('status', 'in', ['WAITING', 'PLAYING'])
            .where('lastActivity', '<', cutoff)
            .get();
        if (snap.empty) {
            console.log('No ghost rooms to clean.');
            return null;
        }
        const batch = db.batch();
        let closedCount = 0;
        snap.forEach((doc) => {
            batch.update(doc.ref, { status: 'FINISHED' });
            closedCount++;
        });
        await batch.commit();
        console.log(`Successfully closed ${closedCount} ghost rooms.`);
        return null;
    }
    catch (error) {
        console.error('Error cleaning up ghost rooms:', error);
        return null;
    }
});
//# sourceMappingURL=cleanupRooms.js.map