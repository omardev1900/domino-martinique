import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    DocumentSnapshot,
    DocumentData,
    FirestoreError
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
export const auth = getAuth(app);

// Collection References
const ROOMS_COLLECTION = 'rooms';

/**
 * Creates a new game room
 * @param hostProfile The profile of the user hosting the game
 * @returns The created room ID
 */
export const createRoom = async (hostProfile: PlayerProfile, isPrivate: boolean = false, passcode?: string): Promise<string> => {
    try {
        const roomData: Omit<GameRoom, 'roomId'> = {
            createdAt: Date.now(), // Firestore timestamp might be better but Types use number
            status: RoomStatus.WAITING,
            players: [hostProfile],
            gameState: null,
            createdBy: hostProfile.uid,
            isPrivate,
            ...(passcode && { passcode })
        };

        // Note: We use serverTimestamp() for internal sorting if needed, but for the GameRoom type we stick to number
        // For now let's overwrite with serverTimestamp just for creation, but typescript expects number.
        // We will stick to client timestamp for simplicity or we'd need a converter.
        // Let's rely on Date.now() for this MVP phase.

        const docRef = await addDoc(collection(db, ROOMS_COLLECTION), roomData);
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

        // Check if player is already in room
        const isAlreadyIn = roomData.players.some(p => p.uid === playerProfile.uid);
        if (isAlreadyIn) {
            console.log("Player already in room - reconnecting");
            return;
        }

        // Check if player was in the game but left (reconnection scenario)
        const wasInGame = roomData.gameState?.players.some(p => p.id === playerProfile.uid);
        if (wasInGame) {
            console.log("Player reconnecting to ongoing game");
            await updateDoc(roomRef, {
                players: arrayUnion(playerProfile)
            });
            return;
        }

        // New player joining - check status
        if (roomData.status !== RoomStatus.WAITING) {
            throw new Error("Room is already playing or finished");
        }

        if (roomData.players.length >= 4) {
            throw new Error("Room is full");
        }

        await updateDoc(roomRef, {
            players: arrayUnion(playerProfile)
        });
        console.log(`Player ${playerProfile.uid} joined room ${roomId}`);

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
        const updatedPlayers = roomData.players.filter(p => p.uid !== userId);

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
        await updateDoc(roomRef, {
            status: RoomStatus.PLAYING,
            gameState: initialGameState
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
