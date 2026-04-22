/**
 * ad.service.ts
 *
 * ╔══════════════════════════════════════════════════════╗
 * ║  AD SERVICE — Publicité interne admin-managed       ║
 * ║  • Charge les pubs actives depuis Firestore         ║
 * ║  • Filtre par placement, fenêtre de dates, fréquence║
 * ║  • Gère les cooldowns via AsyncStorage              ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Spec : docs/specs/ADS_SYSTEM.md
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    collection,
    query,
    where,
    getDocs,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { LogService } from './LogService';
import { Ad, AdPlacement } from '../ad.types';

const ADS_COLLECTION = 'ads';

// Clé AsyncStorage : liste JSON des adIds déjà affichés dans la session courante.
// Vidée au démarrage via `resetSessionCooldowns()`.
const STORAGE_KEY_SESSION = 'ad_session_cooldowns';

// Préfixe AsyncStorage : `ad_daily_cooldown_{adId}` → date 'YYYY-MM-DD' du dernier affichage.
const STORAGE_KEY_DAILY_PREFIX = 'ad_daily_cooldown_';

/** Date locale au format YYYY-MM-DD — utilisée pour le cooldown journalier. */
function todayKey(now: Date = new Date()): string {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

class AdService {
    private cached: Ad[] | null = null;
    private sessionShown: Set<string> = new Set();
    private sessionLoaded = false;

    // ──────────────────────────────────────────────────────────────────────────
    // API publique
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Charge en mémoire toutes les pubs `active: true` depuis Firestore.
     * À appeler au démarrage de l'app (avant la navigation principale).
     */
    async preload(): Promise<void> {
        try {
            const q = query(collection(db, ADS_COLLECTION), where('active', '==', true));
            const snapshot = await getDocs(q);
            this.cached = snapshot.docs.map((doc) => this.mapDocToAd(doc.id, doc.data()));
            LogService.info('AdService', `Loaded ${this.cached.length} active ads.`);
        } catch (e) {
            LogService.error('AdService', 'preload error:', e);
            this.cached = [];
        }
    }

    /**
     * Retourne la pub à afficher pour ce placement, ou null si aucune n'est éligible.
     * Si une pub est retournée, son cooldown est marqué automatiquement.
     */
    async getAdForPlacement(placement: AdPlacement): Promise<Ad | null> {
        if (!this.cached) await this.preload();
        if (!this.sessionLoaded) await this.loadSessionCooldowns();

        const now = Date.now();

        // Filtrer les candidats (active + fenêtre + placement), tri plus récent d'abord.
        const candidates = (this.cached ?? [])
            .filter(ad => ad.active)
            .filter(ad => ad.startsAt <= now && now <= ad.endsAt)
            .filter(ad => ad.placements.includes(placement))
            .sort((a, b) => b.createdAt - a.createdAt);

        // Première pub qui passe le cooldown.
        for (const ad of candidates) {
            if (await this.canShow(ad)) {
                await this.markShown(ad);
                LogService.info('AdService', `Ad ${ad.id} shown at placement ${placement}.`);
                return ad;
            }
        }

        return null;
    }

    /**
     * Vide les cooldowns ONCE_PER_SESSION.
     * À appeler au démarrage de l'app (AVANT `preload()` n'est pas nécessaire).
     */
    async resetSessionCooldowns(): Promise<void> {
        this.sessionShown.clear();
        this.sessionLoaded = true;
        try {
            await AsyncStorage.removeItem(STORAGE_KEY_SESSION);
        } catch (e) {
            LogService.error('AdService', 'resetSessionCooldowns error:', e);
        }
    }

    /** Invalide le cache en mémoire (logout, rechargement forcé). */
    clearCache(): void {
        this.cached = null;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers privés — cooldowns
    // ──────────────────────────────────────────────────────────────────────────

    private async canShow(ad: Ad): Promise<boolean> {
        switch (ad.frequency) {
            case 'EVERY_TIME':
                return true;
            case 'ONCE_PER_SESSION':
                return !this.sessionShown.has(ad.id);
            case 'ONCE_PER_DAY': {
                try {
                    const last = await AsyncStorage.getItem(STORAGE_KEY_DAILY_PREFIX + ad.id);
                    return last !== todayKey();
                } catch (e) {
                    LogService.error('AdService', 'canShow (daily) error:', e);
                    // Fail-closed : on évite le spam en cas d'erreur de lecture.
                    return false;
                }
            }
        }
    }

    private async markShown(ad: Ad): Promise<void> {
        switch (ad.frequency) {
            case 'EVERY_TIME':
                return;
            case 'ONCE_PER_SESSION':
                this.sessionShown.add(ad.id);
                try {
                    await AsyncStorage.setItem(
                        STORAGE_KEY_SESSION,
                        JSON.stringify([...this.sessionShown])
                    );
                } catch (e) {
                    LogService.error('AdService', 'markShown (session) error:', e);
                }
                return;
            case 'ONCE_PER_DAY':
                try {
                    await AsyncStorage.setItem(
                        STORAGE_KEY_DAILY_PREFIX + ad.id,
                        todayKey()
                    );
                } catch (e) {
                    LogService.error('AdService', 'markShown (daily) error:', e);
                }
                return;
        }
    }

    private async loadSessionCooldowns(): Promise<void> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEY_SESSION);
            if (json) {
                const ids = JSON.parse(json) as string[];
                this.sessionShown = new Set(ids);
            }
        } catch (e) {
            LogService.error('AdService', 'loadSessionCooldowns error:', e);
        } finally {
            this.sessionLoaded = true;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers privés — mapping Firestore
    // ──────────────────────────────────────────────────────────────────────────

    private mapDocToAd(id: string, data: Record<string, unknown>): Ad {
        const startsAt = data.startsAt instanceof Timestamp ? data.startsAt.toMillis() : (data.startsAt as number ?? 0);
        const endsAt   = data.endsAt   instanceof Timestamp ? data.endsAt.toMillis()   : (data.endsAt   as number ?? 0);
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (data.createdAt as number ?? 0);

        return {
            id,
            title:      (data.title as string) ?? '',
            imageUrl:   (data.imageUrl as string) ?? '',
            targetUrl:  (data.targetUrl as string | null) ?? null,
            active:     data.active === true,
            startsAt,
            endsAt,
            placements: Array.isArray(data.placements) ? (data.placements as Ad['placements']) : [],
            frequency:  (data.frequency as Ad['frequency']) ?? 'EVERY_TIME',
            createdAt,
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Test helpers — @internal, n'utilise jamais en production
    // ──────────────────────────────────────────────────────────────────────────

    /** @internal — injection directe du cache pour les tests unitaires. */
    _setCachedForTest(ads: Ad[]): void {
        this.cached = ads;
    }

    /** @internal — remise à zéro complète de l'état pour les tests unitaires. */
    _resetForTest(): void {
        this.cached = null;
        this.sessionShown = new Set();
        this.sessionLoaded = false;
    }
}

export const adService = new AdService();
