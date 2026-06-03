import { initializeApp } from 'firebase/app';
import {
    initializeAuth,
    // @ts-ignore
    getReactNativePersistence,
    browserLocalPersistence,
    getAuth
} from 'firebase/auth';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    runTransaction,
    arrayUnion,
    arrayRemove,
    DocumentSnapshot,
    DocumentData,
    FirestoreError,
    query,
    where,
    QuerySnapshot,
    setDoc
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { GameRoom, GameState, PlayerProfile, RoomStatus, GameMode } from '../types';
import { LogService } from './LogService';
import { roomNameSchema } from '../validation/schemas';

// SEC-8: Debounce state for updateGameState — one pending write per roomId
const GAME_STATE_DEBOUNCE_MS = 300;
type PendingWrite = { data: Record<string, any>; timer: ReturnType<typeof setTimeout>; resolve: () => void; reject: (e: unknown) => void };
const pendingGameStateWrites = new Map<string, PendingWrite>();

// Configuration Firebase
// Configuration Firebase
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Persistence
const firestoreSettings = Platform.OS === 'web' 
    ? { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }
    : {}; // On Mobile, simplified init or use specific RN persistence if enabled

export const db = initializeFirestore(app, firestoreSettings);
export const storage = getStorage(app);

// Initialize Auth with cross-platform persistence
let authInstance;
try {
    if (Platform.OS === 'web') {
        authInstance = initializeAuth(app, {
            persistence: browserLocalPersistence
        });
    } else {
        authInstance = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    }
} catch (error) {
    // If already initialized, use getAuth()
    authInstance = getAuth(app);
}

export const auth = authInstance;

// Collection References
const ROOMS_COLLECTION = 'rooms';

/**
 * Options de jeu configurables à la création de la room
 */
export interface RoomOptions {
    gameMode?: GameMode;
    winningCondition?: number;
    turnDuration?: number;
    startingHandSize?: number;
    buyIn?: number;
}

/**
 * Creates a new game room
 * @param hostProfile The profile of the user hosting the game
 * @param isPrivate Whether the room is private (requires code to join)
 * @param roomName Optional custom name for the room
 * @param passcode Optional passcode for private rooms
 * @param options Optional game options (mode, winning condition, turn duration)
 * @returns The created room ID
 */
export const createRoom = async (
    hostProfile: PlayerProfile,
    isPrivate: boolean = false,
    roomName?: string,
    passcode?: string,
    options?: RoomOptions
): Promise<string> => {
    // SEC-7: Validate inputs before writing to Firestore
    if (roomName) {
        const nameResult = roomNameSchema.safeParse(roomName);
        if (!nameResult.success) throw new Error(nameResult.error.issues[0].message);
    }
    if (passcode !== undefined && passcode !== '' && (passcode.length < 4 || passcode.length > 12 || !/^[a-zA-Z0-9]+$/.test(passcode))) {
        throw new Error('Le code doit contenir entre 4 et 12 caractères alphanumériques');
    }
    const buyIn = options?.buyIn ?? 50;
    if (!Number.isInteger(buyIn) || buyIn < 0 || buyIn > 100000) {
        throw new Error('Mise invalide');
    }
    const winningCondition = options?.winningCondition ?? 6;
    if (!Number.isInteger(winningCondition) || winningCondition < 1 || winningCondition > 20) {
        throw new Error('Condition de victoire invalide (1-20)');
    }
    const startingHandSize = options?.startingHandSize ?? 3;
    if (!Number.isInteger(startingHandSize) || startingHandSize < 1 || startingHandSize > 14) {
        throw new Error('Taille de main invalide (1-14)');
    }

    try {
        const now = Date.now();
        const roomData: Omit<GameRoom, 'roomId'> = {
            createdAt: now,
            lastActivity: now, // Track last activity for cleanup
            status: RoomStatus.WAITING,
            players: [{ ...hostProfile, isHost: true }], // Force Host flag
            playerIds: [hostProfile.uid], // Used by Firestore security rules
            gameState: null,
            createdBy: hostProfile.uid,
            isPrivate,
            ...(passcode && { passcode }),
            // Default room name if not provided
            roomName: roomName || `Table #${Math.floor(Math.random() * 9000) + 1000}`,
            // Game options (set at creation, defaults applied if not provided)
            gameMode: options?.gameMode || 'MANCHE',
            winningCondition: options?.winningCondition || 6,
            turnDuration: options?.turnDuration ?? 1,
            startingHandSize: options?.startingHandSize || 3,
            buyIn: options?.buyIn || 50, // Default to 50 Coins MVP
        };

        // SAFETY: Remove undefined fields which crash Firestore
        const cleanRoomData = JSON.parse(JSON.stringify(roomData));

        const generateShortCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        let isUnique = false;
        let shortCode = '';
        let loopCount = 0;

        while (!isUnique && loopCount < 10) {
            shortCode = generateShortCode();
            const docRef = doc(db, ROOMS_COLLECTION, shortCode);
            const snap = await getDoc(docRef);
            if (!snap.exists()) {
                isUnique = true;
                await setDoc(docRef, cleanRoomData);
            }
            loopCount++;
        }

        if (!isUnique) {
            throw new Error('Impossible de générer un code de table unique.');
        }

        LogService.info('Firebase', "Room created with ID:", shortCode);

        // Update the room with its own ID
        const finalDocRef = doc(db, ROOMS_COLLECTION, shortCode);
        await updateDoc(finalDocRef, { roomId: shortCode });

        return shortCode;
    } catch (e: any) {
        LogService.error('Firebase', 'Error adding document:', e);
        // CRITICAL UI FEEDBACK: Ensure user sees the error
        Alert.alert(
            "Erreur de création",
            e.code === 'permission-denied'
                ? "Permissions insuffisantes pour créer une table. Vérifiez votre profil."
                : "Impossible de créer la table. " + (e.message || "Erreur inconnue")
        );
        throw e;
    }
};

/**
 * Joins an existing game room
 * @param roomId The ID of the room to join
 * @param playerProfile The profile of the player joining
 */
export const joinRoom = async (roomId: string, playerProfile: PlayerProfile): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    try {
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            throw new Error("Room does not exist");
        }

        const roomData = roomSnap.data() as GameRoom;

        // PRIORITY 1: Check if player is already in room (reconnection)
        const isAlreadyIn = roomData.players.some(p => p.uid === playerProfile.uid);
        if (isAlreadyIn) {
            LogService.info('Firebase', "✅ Player already in room - reconnecting");
            // Update lastActivity to keep room alive
            await updateDoc(roomRef, {
                lastActivity: Date.now()
            });
            return;
        }

        // PRIORITY 2: Check if player was in the game but disconnected (reconnection scenario)
        const wasInGame = roomData.gameState?.players.some(p => p.id === playerProfile.uid);
        if (wasInGame) {
            LogService.info('Firebase', "✅ Player reconnecting to ongoing game (was disconnected)");
            // Re-add player to the room's player list
            const cleanPlayerProfile = JSON.parse(JSON.stringify(playerProfile));
            await updateDoc(roomRef, {
                players: arrayUnion(cleanPlayerProfile),
                lastActivity: Date.now()
            });
            return;
        }

        // PRIORITY 3: New player joining - check status
        if (roomData.status !== RoomStatus.WAITING) {
            throw new Error("Impossible de rejoindre : La partie a déjà commencé.");
        }

        // PRIORITY 4: New player joining - check capacity
        if (roomData.players.length >= 3) {
            throw new Error("Impossible de rejoindre : La table est complète.");
        }

        // PRIORITY 5: Add new player
        const cleanPlayerProfile = JSON.parse(JSON.stringify({ ...playerProfile, isHost: false }));

        await updateDoc(roomRef, {
            players: arrayUnion(cleanPlayerProfile),
            playerIds: arrayUnion(playerProfile.uid),
            lastActivity: Date.now() // Update activity timestamp
        });
        LogService.info('Firebase', `Player ${playerProfile.uid} joined room ${roomId}`);

    } catch (e) {
        LogService.error('Firebase', 'Error joining room:', e);
        throw e;
    }
};

/**
 * Updates room settings (game mode, winning condition)
 */
export const updateRoomSettings = async (roomId: string, settings: { gameMode?: GameMode, winningCondition?: number, turnDuration?: number }): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        await updateDoc(roomRef, {
            ...settings,
            lastActivity: Date.now()
        });
        LogService.info('Firebase', `Room settings updated for ${roomId}:`, settings);
    } catch (e) {
        LogService.error('Firebase', 'Error updating room settings:', e);
        throw e;
    }
};

/**
 * Leaving a room
 */
export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
    if (!roomId) return;
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;

        const roomData = roomSnap.data() as GameRoom;
        const playerToRemove = roomData.players.find(p => p.uid === userId);

        // ROBUST REMOVAL: Filter out by UID explicitly
        const updatedPlayers = roomData.players.filter(p => p.uid !== userId);

        // 1. If room empty, delete it
        if (updatedPlayers.length === 0) {
            LogService.info('Firebase', 'Room empty, deleting:', roomId);
            await deleteDoc(roomRef);
            return;
        }

        // 2. If Host left, reassign host
        if (playerToRemove?.isHost && updatedPlayers.length > 0) {
            updatedPlayers[0].isHost = true;
            LogService.info('Firebase', `Host left. New host assigned: ${updatedPlayers[0].displayName}`);
        }

        await updateDoc(roomRef, {
            players: updatedPlayers,
            lastActivity: Date.now()
        });

        LogService.info('Firebase', `Player ${userId} left room ${roomId}`);

    } catch (e: any) {
        // Specifically check for offline error to log a cleaner message
        if (e.code === 'unavailable' || (e.message && e.message.includes('offline'))) {
            LogService.warn('Firebase', 'User leaving room while offline. Move queued for sync.', roomId);
            return;
        }
        LogService.error('Firebase', 'Error leaving room:', e);
    }
};

/**
 * Mark a player as debited in the room document for persistence
 */
export const markPlayerAsDebited = async (roomId: string, userId: string): Promise<void> => {
    if (!roomId || !userId) return;
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        await runTransaction(db, async (transaction) => {
            const roomSnap = await transaction.get(roomRef);
            if (!roomSnap.exists()) return;

            const roomData = roomSnap.data() as GameRoom;
            const updatedPlayers = roomData.players.map(p => {
                if (p.uid === userId) {
                    return { ...p, hasBeenDebited: true };
                }
                return p;
            });

            transaction.update(roomRef, { players: updatedPlayers });
        });
        LogService.info('Firebase', `Player ${userId} marked as debited in room ${roomId}`);
    } catch (e) {
        LogService.error('Firebase', 'Error marking player as debited:', e);
    }
};

/**
 * Starts the game (host only)
 * @param roomId 
 * @param initialGameState 
 */
export const startGame = async (roomId: string, initialGameState: GameState): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        // SANITIZATION: Firebase rejects 'undefined'. Replace with null.
        const sanitizedGameState = JSON.parse(JSON.stringify(initialGameState, (k, v) => v === undefined ? null : v));

        // SAFETY: Ensure currentPlayerId is valid
        if (!sanitizedGameState.currentPlayerId && sanitizedGameState.players.length > 0) {
            sanitizedGameState.currentPlayerId = sanitizedGameState.players[0].id;
        }

        await updateDoc(roomRef, {
            status: RoomStatus.PLAYING,
            gameState: sanitizedGameState
        });
    } catch (e) {
        LogService.error('Firebase', 'Error starting game:', e);
        throw e;
    }
};

/**
 * Resets the room to lobby state (host only)
 * @param roomId 
 */
export const resetRoomToLobby = async (roomId: string): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        await updateDoc(roomRef, {
            status: RoomStatus.WAITING,
            gameState: null
        });
    } catch (e) {
        LogService.error('Firebase', 'Error resetting room:', e);
        throw e;
    }
};

/**
 * Marks a room as finished (match ended)
 * @param roomId 
 */
export const markRoomAsFinished = async (roomId: string): Promise<void> => {
    if (!roomId) return;
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        await updateDoc(roomRef, {
            status: RoomStatus.FINISHED,
            lastActivity: Date.now()
        });
        LogService.info('Firebase', `Room ${roomId} marked as FINISHED`);
    } catch (e) {
        LogService.error('Firebase', 'Error marking room as finished:', e);
        throw e;
    }
};

/**
 * Updates the game state (sync moves)
 * @param roomId 
 * @param newGameState 
 */
export const updateGameState = (roomId: string, newGameState: Partial<GameState>): Promise<void> => {
    // SEC-8: Debounce — cancel any pending write for this room and replace with latest state
    const existing = pendingGameStateWrites.get(roomId);
    if (existing) {
        clearTimeout(existing.timer);
        existing.resolve(); // resolve the previous promise silently (superseded)
    }

    const updateData: Record<string, any> = {};
    Object.keys(newGameState).forEach(key => {
        updateData[`gameState.${key}`] = (newGameState as any)[key];
    });

    return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(async () => {
            pendingGameStateWrites.delete(roomId);
            const roomRef = doc(db, ROOMS_COLLECTION, roomId);
            try {
                await updateDoc(roomRef, updateData);
                resolve();
            } catch (e) {
                LogService.error('Firebase', 'Error updating game state:', e);
                reject(e);
            }
        }, GAME_STATE_DEBOUNCE_MS);

        pendingGameStateWrites.set(roomId, { data: updateData, timer, resolve, reject });
    });
};

/**
 * Updates only the chat field of a specific player (silent update)
 * @param roomId 
 * @param playerId The ID of the player
 * @param content The message or emoji
 */
export const updatePlayerChat = async (roomId: string, playerId: string, content: string): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        const updateData: any = {};
        updateData[`quickChats.${playerId}`] = {
            content,
            timestamp: Date.now(),
            nonce: Math.random().toString(36).substring(2, 10)
        };
        // Silent update on a decoupled root field
        await updateDoc(roomRef, updateData);
    } catch (e) {
        LogService.error('Firebase', 'Error updating player chat:', e);
    }
};

/**
 * Votes for a rematch in a finished game
 * @param roomId 
 * @param userId 
 */
export const voteForRematch = async (roomId: string, userId: string): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        await updateDoc(roomRef, {
            rematchVotes: arrayUnion(userId)
        });
    } catch (e) {
        LogService.error('Firebase', 'Error voting for rematch:', e);
        throw e;
    }
};

/**
 * Clears all rematch votes (usually when starting a new game)
 * @param roomId 
 */
export const clearRematchVotes = async (roomId: string): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        await updateDoc(roomRef, {
            rematchVotes: []
        });
    } catch (e) {
        LogService.error('Firebase', 'Error clearing rematch votes:', e);
        throw e;
    }
};


/**
 * Subscribes to real-time updates for a specific room
 * @param roomId The ID of the room to subscribe to
 * @param onUpdate Callback function with room data
 * @returns Unsubscribe function
 */
export const subscribeToRoom = (
    roomId: string,
    onUpdate: (data: GameRoom) => void,
    onError?: (error: FirestoreError) => void
) => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    return onSnapshot(roomRef, (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
            const data = { ...snapshot.data() } as GameRoom;

            // FIREBASE SPARSE-ARRAY SANITIZATION
            // Firebase occasionally serializes sparse arrays as objects, causing `.find()` crashes.
            if (data.players && !Array.isArray(data.players)) {
                data.players = Object.values(data.players);
            }
            if (data.gameState?.players && !Array.isArray(data.gameState.players)) {
                data.gameState.players = Object.values(data.gameState.players);
            }

            onUpdate(data);
        } else {
            LogService.warn('Firebase', 'subscribeToRoom: no such room', roomId);
        }
    }, (error) => {
        LogService.error('Firebase', 'Room subscription error:', error);
        if (onError) onError(error);
    });
};

/**
 * Checks if the user is already hosting a WAITING room.
 * Used to prevent a host from creating duplicate tables.
 * @param userId The user ID to check
 * @returns The roomId of the hosted waiting room, or null
 */
export const findHostedWaitingRoom = async (userId: string): Promise<string | null> => {
    try {
        const q = query(
            collection(db, ROOMS_COLLECTION),
            where("createdBy", "==", userId),
            where("status", "==", RoomStatus.WAITING)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const TEN_MINUTES = 10 * 60 * 1000;
        const now = Date.now();

        for (const roomDoc of snapshot.docs) {
            const roomData = roomDoc.data() as GameRoom;
            const lastSeen = roomData.lastActivity || roomData.createdAt || 0;
            const isStale = (now - lastSeen) > TEN_MINUTES;

            if (isStale) {
                // Nettoyage automatique : room abandonnée (app fermée avant démarrage)
                await deleteDoc(roomDoc.ref);
                LogService.info('Firebase', `Stale hosted room deleted: ${roomDoc.id}`);
            } else {
                return roomDoc.id; // Room récente → bloquer la création
            }
        }
        return null; // Toutes les rooms trouvées étaient abandonnées
    } catch (e) {
        LogService.error('Firebase', 'Error finding hosted waiting room:', e);
        return null; // Fail-open : autoriser la création en cas d'erreur
    }
};

/**
 * Deletes a waiting room if the requester is its host and nobody else joined yet.
 * Returns true when the room was deleted, false when it was already gone.
 */
export const deleteWaitingRoomIfOwner = async (roomId: string, userId: string): Promise<boolean> => {
    try {
        const roomRef = doc(db, ROOMS_COLLECTION, roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            return false;
        }

        const roomData = roomSnap.data() as GameRoom;
        const isOwner = roomData.createdBy === userId;

        if (!isOwner) {
            throw new Error("Seul l'hôte peut supprimer cette table.");
        }

        // Vérifier s'il reste d'autres joueurs humains actifs dans la partie
        let hasOtherActiveHumans = false;
        if (roomData.gameState && roomData.gameState.players) {
            hasOtherActiveHumans = roomData.gameState.players.some(p => p.id !== userId && p.status === 'HUMAN');
        } else {
            hasOtherActiveHumans = roomData.players.some(p => p.uid !== userId && p.status === 'HUMAN');
        }

        if (hasOtherActiveHumans) {
            throw new Error("Impossible de supprimer cette table : d'autres joueurs actifs sont encore présents.");
        }

        await deleteDoc(roomRef);
        LogService.info('Firebase', `Waiting room ${roomId} deleted by host ${userId}`);
        return true;
    } catch (e) {
        LogService.error('Firebase', 'Error deleting waiting room:', e);
        throw e;
    }
};

export const setUserActiveRoom = async (userId: string, roomId: string | null): Promise<void> => {
    if (!userId) return;
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { activeRoomId: roomId ?? null }, { merge: true });
    } catch (e) {
        LogService.error('Firebase', 'Error setting user active room:', e);
    }
};

export const getUserActiveRoom = async (userId: string): Promise<string | null> => {
    if (!userId) return null;
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return null;
        const data = userSnap.data();
        return typeof data.activeRoomId === 'string' && data.activeRoomId.length > 0 ? data.activeRoomId : null;
    } catch (e) {
        LogService.error('Firebase', 'Error getting user active room:', e);
        return null;
    }
};

/**
 * Checks if the user is already in an active game (PLAYING status).
 * @param userId The user ID to check
 * @returns The roomId if found, or null
 */
export const findActiveRoomForUser = async (userId: string): Promise<string | null> => {
    try {
        LogService.debug('Firebase', `Searching for active room for user: ${userId}`);

        const persistedRoomId = await getUserActiveRoom(userId);
        if (persistedRoomId) {
            const persistedRoomRef = doc(db, ROOMS_COLLECTION, persistedRoomId);
            const persistedRoomSnap = await getDoc(persistedRoomRef);
            if (persistedRoomSnap.exists()) {
                const persistedRoom = persistedRoomSnap.data() as GameRoom;
                const isActive = persistedRoom.status === RoomStatus.PLAYING || persistedRoom.status === RoomStatus.WAITING;
                const isInPlayersList = persistedRoom.players.some(p => p.uid === userId);
                const isInGameState = persistedRoom.gameState?.players?.some(p => p.id === userId) ?? false;
                const isInPlayerIds = persistedRoom.playerIds?.includes(userId) ?? false;
                if (isActive && (isInPlayersList || isInGameState || isInPlayerIds)) {
                    LogService.debug('Firebase', `Found persisted active room for user ${userId}: ${persistedRoomId}`);
                    return persistedRoomId;
                }
            }
            await setUserActiveRoom(userId, null);
        }

        // Query for rooms that are PLAYING
        // Note: Array-contains on objects requires exact match.
        // Since we store full profiles, array-contains is tricky if profile changed slightly (e.g. wins update).
        // Better approach: Query by status 'PLAYING' and filter client side (assuming low volume of concurrent rooms for MVP).
        // Or better: Maintain a 'activePlayerIds' array in the room document for easier querying?
        // For now: Fetch all PLAYING rooms and find user.

        const q = query(
            collection(db, ROOMS_COLLECTION),
            where("status", "in", [RoomStatus.PLAYING, RoomStatus.WAITING])
        );

        const snapshot = await getDocs(q);
        LogService.debug('Firebase', `Found ${snapshot.docs.length} PLAYING rooms to check`);

        for (const doc of snapshot.docs) {
            const data = doc.data() as GameRoom;

            // Check if user is in players list (currently connected)
            const isInPlayersList = data.players.some(p => p.uid === userId);

            // Check if user is in gameState players (was in game, might be disconnected)
            const isInGameState = data.gameState?.players?.some(p => p.id === userId) ?? false;

            // Persistent membership marker, survives temporary disconnects and session resets
            const isInPlayerIds = data.playerIds?.includes(userId) ?? false;

            if (isInPlayersList || isInGameState || isInPlayerIds) {
                LogService.debug('Firebase', `Found active room for user ${userId}: ${doc.id} (inPlayersList: ${isInPlayersList}, inGameState: ${isInGameState}, inPlayerIds: ${isInPlayerIds})`);
                await setUserActiveRoom(userId, doc.id);
                return doc.id;
            }
        }

        LogService.debug('Firebase', `No active room found for user: ${userId}`);
        return null;
    } catch (e) {
        LogService.error('Firebase', 'Error finding active room:', e);
        return null; // Fail safe
    }
};

/**
 * Listens to available public rooms in real-time
 * ... (existing check)
 */
export const listenToPublicRooms = (
    onUpdate: (rooms: GameRoom[]) => void,
    onError?: (error: FirestoreError) => void
) => {
    // Requires an index on 'status' and 'isPrivate' (and potentially createdAt for sorting)
    // Query: status == 'WAITING' && isPrivate == false
    // Note: If you want to sort by createdAt, you need a composite index in Firestore.
    // For now, we will just filter. Client-side sorting is fine for small numbers of rooms.

    // We can't use simple 'where' clauses with real-time listeners easily without indices if we sort too.
    // Let's stick to the requirements: status == waiting, isPublic == true.

    // NOTE: In Firestore, `isPrivate` might be undefined for old rooms. 
    // If we only query `isPrivate == false`, we might miss old rooms if they don't have the field.
    // Ensure all rooms have isPrivate set or handle legacy data if needed. 
    // We'll assume new rooms created with this version have the flag.

    // To allow sorting by createdAt, we would ideally do:
    // query(collection(db, ROOMS_COLLECTION), where("status", "==", RoomStatus.WAITING), where("isPrivate", "==", false), orderBy("createdAt", "desc"))
    // This WILL require a composite index creation link from the console.

    // For MVP/Prototype without forcing index creation immediately, we can fetch list and filter/sort client side if the list isn't huge.
    // HOWEVER, `onSnapshot` with `where` clauses is efficient. 

    // Let's try the query. If it fails due to missing index, we will see it in logs (and usually get a link to create it).

    const q = query(
        collection(db, ROOMS_COLLECTION),
        where("status", "==", RoomStatus.WAITING),
        where("isPrivate", "==", false)
        // orderBy("createdAt", "desc") // Commented out to avoid index requirement for now
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const rooms: GameRoom[] = [];
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

        snapshot.forEach((doc: any) => {
            const roomData = { ...doc.data() } as GameRoom;

            // Filter out abandoned rooms (inactive for more than 5 minutes)
            const timeSinceActivity = now - (roomData.lastActivity || roomData.createdAt);
            if (timeSinceActivity < FIVE_MINUTES) {
                rooms.push(roomData);
            } else {
                LogService.debug('Firebase', `Filtering out abandoned room: ${roomData.roomId} (inactive for ${Math.round(timeSinceActivity / 60000)} minutes)`);
            }
        });

        // Client-side sort to avoid index issues for now
        rooms.sort((a, b) => b.createdAt - a.createdAt);

        onUpdate(rooms);
    }, (error: FirestoreError) => {
        LogService.error('Firebase', 'Public rooms listener error:', error);
        if (onError) onError(error);
    });
};

/**
 * Explicitly signals to the Room that this player is online and active.
 * Sets `status` to 'HUMAN' in the gameState.
 * @param roomId 
 * @param playerId 
 */
export const signalPlayerOnline = async (roomId: string, playerId: string): Promise<void> => {
    if (!roomId || !playerId) return;
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);

    try {
        await runTransaction(db, async (transaction) => {
            const roomSnap = await transaction.get(roomRef);
            if (!roomSnap.exists()) return;

            const roomData = roomSnap.data() as GameRoom;

            // Only proceed if there's an active gameState
            if (!roomData.gameState || !roomData.gameState.players) return;

            const playerIndex = roomData.gameState.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) return; // Player not in active match

            const currentPlayerState = roomData.gameState.players[playerIndex];

            // Only explicitly run the expensive update if they are currently marked offline or bot
            if (currentPlayerState.status !== 'HUMAN') {
                LogService.warn('Firebase', `[Reconnection Protocol] Player ${playerId} signaling ONLINE natively via Transaction. Removing BOT locks.`);

                const newGameStatePlayers = [...roomData.gameState.players];
                newGameStatePlayers[playerIndex] = {
                    ...newGameStatePlayers[playerIndex],
                    status: 'HUMAN'
                };

                const updateData: any = {};
                updateData[`gameState.players`] = newGameStatePlayers;
                updateData[`gameState.lastActionTimestamp`] = Date.now(); // Resets Host Failsafe

                const lobbyPlayerIndex = roomData.players.findIndex(p => p.uid === playerId);
                if (lobbyPlayerIndex !== -1) {
                    const newLobbyPlayers = [...roomData.players];
                    newLobbyPlayers[lobbyPlayerIndex] = {
                        ...newLobbyPlayers[lobbyPlayerIndex],
                        status: 'HUMAN'
                    };
                    updateData[`players`] = newLobbyPlayers;
                }

                transaction.update(roomRef, updateData);
            }
        });
    } catch (e) {
        LogService.error('Firebase', `Failed to signal online status transaction for ${playerId}:`, e);
    }
};

/**
 * Adds a bot to the waiting room (called by the host)
 */
export const addBotToWaitingRoom = async (roomId: string, difficulty: 'TI_MANMAY' | 'MAPIPI' | 'GRAN_MOUN' | 'METKAYALI'): Promise<void> => {
    if (!roomId) return;
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        await runTransaction(db, async (transaction) => {
            const roomSnap = await transaction.get(roomRef);
            if (!roomSnap.exists()) return;

            const roomData = roomSnap.data() as GameRoom;
            if (roomData.status !== RoomStatus.WAITING) {
                throw new Error("La partie a déjà commencé.");
            }
            if (roomData.players.length >= 3) {
                throw new Error("La table est complète.");
            }

            const botNames: Record<string, string[]> = {
                'TI_MANMAY': ['Ti-Sonson', 'Man-Yaya'],
                'MAPIPI': ['Dédé', 'Maxime'],
                'GRAN_MOUN': ['Tonton-Léon', 'Eudorge'],
                'METKAYALI': ['Man-Diab', 'Papa-Zombi']
            };

            const difficultyNames = botNames[difficulty] || botNames['MAPIPI'];
            // Find a name not already used by another bot in the room
            let botName = difficultyNames[0];
            const existingBotNames = roomData.players.filter(p => p.status === 'BOT').map(p => p.displayName);
            if (existingBotNames.includes(botName)) {
                botName = difficultyNames[1] || `Bot ${roomData.players.length + 1}`;
            }

            const avatarIdMapping: Record<string, string[]> = {
                'TI_MANMAY': ['avatar_bot_01', 'avatar_bot_02'],
                'MAPIPI': ['avatar_bot_03', 'avatar_bot_04'],
                'GRAN_MOUN': ['avatar_bot_05', 'avatar_bot_06'],
                'METKAYALI': ['avatar_bot_07', 'avatar_bot_08']
            };

            let avatarId = avatarIdMapping[difficulty]?.[0] || 'avatar_bot_03';
            if (existingBotNames.includes(difficultyNames[0])) {
                avatarId = avatarIdMapping[difficulty]?.[1] || avatarId;
            }

            const newBotProfile: PlayerProfile = {
                uid: `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                displayName: botName,
                avatarId: avatarId,
                status: 'BOT',
                difficulty: difficulty,
                isHost: false,
                gamesPlayed: 0,
                gamesWon: 0,
                hasBeenDebited: true // Bots don't pay buy-in
            };

            transaction.update(roomRef, {
                players: arrayUnion(newBotProfile),
                lastActivity: Date.now()
            });
        });
        LogService.info('Firebase', `Bot (${difficulty}) added to room ${roomId}`);
    } catch (e) {
        LogService.error('Firebase', 'Error adding bot to room:', e);
        throw e;
    }
};
