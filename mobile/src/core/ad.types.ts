/**
 * ad.types.ts
 *
 * Types du système publicitaire Phase 1 (popup admin-managed).
 * Source de vérité des structures de données — aucune logique métier.
 *
 * Spec : docs/specs/ADS_SYSTEM.md
 */

/** Fréquence d'affichage d'une pub pour un placement donné */
export type AdFrequency =
    | 'EVERY_TIME'        // À chaque fois que le placement est atteint
    | 'ONCE_PER_SESSION'  // Une seule fois par session (depuis l'ouverture de l'app)
    | 'ONCE_PER_DAY';     // Une seule fois par jour calendaire

/** Point d'injection d'une pub dans l'app */
export type AdPlacement =
    | 'HOME'                // Focus sur l'écran d'accueil
    | 'BEFORE_SOLO'         // Avant de lancer une partie solo
    | 'AFTER_ROUND_SOLO'    // Après chaque round (solo)
    | 'END_OF_MANCHE_SOLO'  // Fin de manche (solo)
    | 'END_OF_MATCH_SOLO'   // Fin de match complet (solo)
    | 'BEFORE_MULTI'        // Avant de rejoindre/créer une table multi
    | 'END_OF_MATCH_MULTI'  // Fin de match complet (multi)
    | 'STORE'               // Boutique
    | 'COLLECTION'          // Vestiaire
    | 'STATS'               // Mes Stats
    | 'LEADERBOARD'         // Classement
    | 'LIGUE';              // Ligue des Cochons

/** Format du média principal de la pub */
export type AdMediaType = 'IMAGE' | 'VIDEO';

/** Document d'une pub hydraté côté mobile (Timestamps convertis en ms). */
export interface Ad {
    id:            string;
    title:         string;            // Label admin uniquement (non affiché in-app)
    mediaType:     AdMediaType;       // 'IMAGE' (défaut rétrocompat) | 'VIDEO'
    imageUrl:      string;            // URL du média (image ou vidéo .mp4)
    targetUrl:     string | null;     // Lien ouvert au tap (optionnel)
    active:        boolean;           // Toggle ON/OFF global
    isDailyReward: boolean;           // Si true : utilisée pour le cadeau quotidien
    startsAt:      number;            // Timestamp de début de diffusion (ms)
    endsAt:        number;            // Timestamp de fin de diffusion (ms)
    placements:    AdPlacement[];     // Points d'injection activés
    frequency:     AdFrequency;       // Fréquence d'affichage
    createdAt:     number;            // Timestamp de création (ms) — tri en cas de conflit
}
