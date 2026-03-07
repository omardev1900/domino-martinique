import { collection, getDocs, query, where, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface BotProfile {
    id: string;
    name: string;
    avatarId: string;
    difficulty: 'TI_MANMAY' | 'MAPIPI' | 'GRAN_MOUN';
}

export const LOCAL_BOTS_FALLBACK: Record<'TI_MANMAY' | 'MAPIPI' | 'GRAN_MOUN', BotProfile[]> = {
    'TI_MANMAY': [
        { id: 'bot_ti_1', name: 'Ti-Sonson', avatarId: 'avatar_ti_sonson', difficulty: 'TI_MANMAY' },
        { id: 'bot_ti_2', name: 'Man-Yaya', avatarId: 'avatar_man_yaya', difficulty: 'TI_MANMAY' },
        { id: 'bot_ti_3', name: 'Doudou', avatarId: 'avatar_doudou', difficulty: 'TI_MANMAY' },
        { id: 'bot_ti_4', name: 'Chabin', avatarId: 'avatar_chabin', difficulty: 'TI_MANMAY' },
        { id: 'bot_ti_5', name: 'Fifine', avatarId: 'avatar_fifine', difficulty: 'TI_MANMAY' }
    ],
    'MAPIPI': [
        { id: 'bot_mapipi_1', name: 'Dédé', avatarId: 'avatar_dede', difficulty: 'MAPIPI' },
        { id: 'bot_mapipi_2', name: 'Maxime', avatarId: 'avatar_maxime', difficulty: 'MAPIPI' },
        { id: 'bot_mapipi_3', name: 'Tatie', avatarId: 'avatar_tatie', difficulty: 'MAPIPI' },
        { id: 'bot_mapipi_4', name: 'Jojo', avatarId: 'avatar_jojo', difficulty: 'MAPIPI' },
        { id: 'bot_mapipi_5', name: 'Béké', avatarId: 'avatar_beke', difficulty: 'MAPIPI' }
    ],
    'GRAN_MOUN': [
        { id: 'bot_gran_1', name: 'Tonton-Léon', avatarId: 'avatar_tonton_leon', difficulty: 'GRAN_MOUN' },
        { id: 'bot_gran_2', name: 'Eudorge', avatarId: 'avatar_eudorge', difficulty: 'GRAN_MOUN' },
        { id: 'bot_gran_3', name: 'Man-Zouzou', avatarId: 'avatar_man_zouzou', difficulty: 'GRAN_MOUN' },
        { id: 'bot_gran_4', name: 'Papi-Jo', avatarId: 'avatar_papi_jo', difficulty: 'GRAN_MOUN' },
        { id: 'bot_gran_5', name: 'Tante-Rose', avatarId: 'avatar_tante_rose', difficulty: 'GRAN_MOUN' }
    ]
};

class BotService {
    async getBotsForLevel(level: 'TI_MANMAY' | 'MAPIPI' | 'GRAN_MOUN', count: number = 2): Promise<BotProfile[]> {
        // Fallback de sécurité immédiat si le niveau n'existe pas localement (prévention crash absolu)
        const localPool = LOCAL_BOTS_FALLBACK[level];
        if (!localPool || !Array.isArray(localPool)) {
            console.error(`[BotService] Niveau invalide ou pool local corrompu pour: ${level}`);
            return [];
        }

        try {
            const botsRef = collection(db, 'bots');
            const q = query(botsRef, where('difficulty', '==', level));
            const querySnapshot = await getDocs(q);

            const botsFromDb: BotProfile[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                botsFromDb.push({
                    id: doc.id,
                    name: data.name,
                    avatarId: data.avatarId,
                    difficulty: data.difficulty
                } as BotProfile);
            });

            // 1. Dédoublonnage et surchage : Les bots Remote écrasent les Locaux ayant le même ID
            const localBots = [...LOCAL_BOTS_FALLBACK[level]];
            const mergedBotsMap = new Map<string, BotProfile>();

            // On met les locaux en premier
            localBots.forEach(bot => mergedBotsMap.set(bot.id, bot));
            // On surcharge par les distants (remplace ou ajoute)
            botsFromDb.forEach(bot => mergedBotsMap.set(bot.id, bot));

            const allAvailableBots = Array.from(mergedBotsMap.values());

            // Vérification de sécurité supplémentaire sur la liste finale
            if (!allAvailableBots || allAvailableBots.length === 0) {
                console.warn(`[BotService] Pas de bots fusionnés trouvés pour ${level}. Utilisation du fallback strict.`);
                return this.getRandomBots(LOCAL_BOTS_FALLBACK[level] || [], count);
            }

            return this.getRandomBots(allAvailableBots, count);

        } catch (error) {
            console.error('[BotService] Error fetching bots from Firestore:', error);
            // Fallback ultime en cas d'erreur réseau
            console.warn(`[BotService] Réseau défaillant. Utilisation exclusive du pool local pour ${level}`);
            return this.getRandomBots(LOCAL_BOTS_FALLBACK[level], count);
        }
    }

    private getRandomBots(bots: BotProfile[], count: number): BotProfile[] {
        // Sécurité absolue : si le tableau est invalide, on retourne un tableau vide pour ne pas crasher
        if (!bots || !Array.isArray(bots) || bots.length === 0) {
            console.error('[BotService] Erreur critique : bots manquant ou invalide. Fallback vide retourné.');
            return [];
        }

        const shuffled = [...bots].sort(() => 0.5 - Math.random());
        // Sécurité si count est plus grand que le pool disponible
        return shuffled.slice(0, Math.min(count, bots.length));
    }

    /**
     * Bouton Magique : Injecte les bots locaux dans Firestore s'ils n'existent pas.
     */
    async seedDatabase(): Promise<number> {
        let addedCount = 0;
        try {
            console.log('[BotService] Début de l\'injection (Seeding) vers Firestore...');
            const botsRef = collection(db, 'bots');

            for (const [level, bots] of Object.entries(LOCAL_BOTS_FALLBACK)) {
                for (const bot of bots) {
                    // Vérifier si le bot existe déjà par ID
                    const q = query(botsRef, where('id', '==', bot.id));
                    const snapshot = await getDocs(q);

                    if (snapshot.empty) {
                        // On force le document à avoir le même ID que le bot local (optionnel, mais propre)
                        // ou on le laisse générer un ID, mais pour surcharge on préfère setDoc avec l'ID du bot
                        // Pour l'interface existante, on l'ajoute avec l'ID natif
                        await addDoc(botsRef, bot);
                        console.log(`[BotService] Bot ajouté : ${bot.name} (${level})`);
                        addedCount++;
                    } else {
                        console.log(`[BotService] Bot existant, ignoré : ${bot.name}`);
                    }
                }
            }
            console.log(`[BotService] Seeding terminé. ${addedCount} bots insérés.`);
        } catch (error) {
            console.error('[BotService] Erreur lors du seeding :', error);
        }
        return addedCount;
    }
}

export const botService = new BotService();
