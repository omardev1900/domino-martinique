import { initializeApp } from 'firebase/app';
import {
    initializeAuth,
    // @ts-ignore
    getReactNativePersistence,
    browserLocalPersistence,
    getAuth
} from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    DocumentSnapshot,
    DocumentData,
    FirestoreError,
    query,
    where,
    QuerySnapshot
} from 'firebase/firestore';
import { GameRoom, GameState, PlayerProfile, RoomStatus } from '../types';

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBJnQCPfcVz585Lp4ctKTKQdvVxycWycHo",
    authDomain: "domino-martinique-v1.firebaseapp.com",
    projectId: "domino-martinique-v1",
    storageBucket: "domino-martinique-v1.firebasestorage.app",
    messagingSenderId: "916243245615",
    appId: "1:916243245615:web:974a0b8d9896885e5534da",
    measurementId: "G-CRY4BNKZ9F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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
 * Creates a new game room
 * @param hostProfile The profile of the user hosting the game
 * @returns The created room ID
 */
export const createRoom = async (hostProfile: PlayerProfile, isPrivate: boolean = false, roomName?: string, passcode?: string): Promise<string> => {
    try {
        const now = Date.now();
        const roomData: Omit<GameRoom, 'roomId'> = {
            createdAt: now,
            lastActivity: now, // Track last activity for cleanup
            status: RoomStatus.WAITING,
            players: [{ ...hostProfile, isHost: true }], // Force Host flag
            gameState: null,
            createdBy: hostProfile.uid,
            isPrivate,
            ...(passcode && { passcode }),
            // Default room name if not provided
            roomName: roomName || `Table #${Math.floor(Math.random() * 9000) + 1000}`
        };

        // SAFETY: Remove undefined fields which crash Firestore
        const cleanRoomData = JSON.parse(JSON.stringify(roomData));

        const docRef = await addDoc(collection(db, ROOMS_COLLECTION), cleanRoomData);
        console.log("Room created with ID: ", docRef.id);

        // Update the room with its own ID (optional but helpful)
        await updateDoc(docRef, { roomId: docRef.id });

        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
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
            console.log("✅ Player already in room - reconnecting");
            // Update lastActivity to keep room alive
            await updateDoc(roomRef, {
                lastActivity: Date.now()
            });
            return;
        }

        // PRIORITY 2: Check if player was in the game but disconnected (reconnection scenario)
        const wasInGame = roomData.gameState?.players.some(p => p.id === playerProfile.uid);
        if (wasInGame) {
            console.log("✅ Player reconnecting to ongoing game (was disconnected)");
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
            lastActivity: Date.now() // Update activity timestamp
        });
        console.log(`✅ Player ${playerProfile.uid} joined room ${roomId}`);

    } catch (e) {
        console.error("Error joining room: ", e);
        throw e;
    }
};

/**
 * Leaving a room
 * @param roomId 
 * @param userId 
 */
export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;

        const roomData = roomSnap.data() as GameRoom;
        const playerToRemove = roomData.players.find(p => p.uid === userId);

        // ROBUST REMOVAL: Filter out by UID explicitly
        const updatedPlayers = roomData.players.filter(p => p.uid !== userId);

        // 1. If room is empty, delete it (Ghost Room Fix)
        if (updatedPlayers.length === 0) {
            await deleteDoc(roomRef);
            console.log(`Room ${roomId} deleted (empty)`);
            return;
        }

        // 2. If Host left, reassign host or close room
        // Check if the player leaving was the host
        if (playerToRemove?.isHost) {
            // Reassign host to the next player (first in the list)
            if (updatedPlayers.length > 0) {
                updatedPlayers[0].isHost = true;
                console.log(`Host left. New host assigned: ${updatedPlayers[0].displayName}`);
            }
        }

        // Force update of players list
        await updateDoc(roomRef, {
            players: updatedPlayers
        });
        console.log(`Player ${userId} left room ${roomId}`);
    } catch (e) {
        console.error("Error leaving room: ", e);
        throw e;
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
        console.error("Error starting game: ", e);
        throw e;
    }
};

/**
 * Updates the game state (sync moves)
 * @param roomId 
 * @param newGameState 
 */
export const updateGameState = async (roomId: string, newGameState: Partial<GameState>): Promise<void> => {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    try {
        // We use dot notation for nested updates if necessary, but here we replace the whole gameState object 
        // to avoid sync issues, or we use updateDoc with specific fields.
        // For simplicity, we update the `gameState` field.
        // Note: Firestore merge is shallow efficiently. 
        // If we want to accept Partial<GameState>, we should ideally map it to "gameState.field".
        // But for this MVP, assuming we enact a move, we send the new FULL GameState usually or significant parts.

        // Let's assume newGameState is the FULL object for safety or partial fields
        // Since we passed Partial, we construct the update object.
        const updateData: any = {};
        Object.keys(newGameState).forEach(key => {
            updateData[`gameState.${key}`] = (newGameState as any)[key];
        });

        await updateDoc(roomRef, updateData);
    } catch (e) {
        console.error("Error updating game state: ", e);
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
            onUpdate({ ...snapshot.data() } as GameRoom);
        } else {
            console.log("No such room!");
        }
    }, (error) => {
        console.error("Room subscription error:", error);
        if (onError) onError(error);
    });
};

/**
 * Checks if the user is already in an active game (PLAYING status).
 * @param userId The user ID to check
 * @returns The roomId if found, or null
 */
export const findActiveRoomForUser = async (userId: string): Promise<string | null> => {
    try {
        console.log(`🔍 Searching for active room for user: ${userId}`);

        // Query for rooms that are PLAYING
        // Note: Array-contains on objects requires exact match.
        // Since we store full profiles, array-contains is tricky if profile changed slightly (e.g. wins update).
        // Better approach: Query by status 'PLAYING' and filter client side (assuming low volume of concurrent rooms for MVP).
        // Or better: Maintain a 'activePlayerIds' array in the room document for easier querying?
        // For now: Fetch all PLAYING rooms and find user.

        const q = query(
            collection(db, ROOMS_COLLECTION),
            where("status", "==", RoomStatus.PLAYING)
        );

        const snapshot = await getDocs(q);
        console.log(`🔍 Found ${snapshot.docs.length} PLAYING rooms to check`);

        for (const doc of snapshot.docs) {
            const data = doc.data() as GameRoom;

            // Check if user is in players list (currently connected)
            const isInPlayersList = data.players.some(p => p.uid === userId);

            // Check if user is in gameState players (was in game, might be disconnected)
            const isInGameState = data.gameState?.players.some(p => p.id === userId);

            if (isInPlayersList || isInGameState) {
                console.log(`✅ Found active room for user ${userId}: ${doc.id} (inPlayersList: ${isInPlayersList}, inGameState: ${isInGameState})`);
                return doc.id;
            }
        }

        console.log(`❌ No active room found for user: ${userId}`);
        return null;
    } catch (e) {
        console.error("Error finding active room:", e);
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
                console.log(`🧹 Filtering out abandoned room: ${roomData.roomId} (inactive for ${Math.round(timeSinceActivity / 60000)} minutes)`);
            }
        });

        // Client-side sort to avoid index issues for now
        rooms.sort((a, b) => b.createdAt - a.createdAt);

        onUpdate(rooms);
    }, (error: FirestoreError) => {
        console.error("Public rooms listener error:", error);
        if (onError) onError(error);
    });
};
