import { TileTracker, likelyTilesFor } from './TileTracker';
import { DominoSide } from '../types';

export type DangerLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface OpponentProfile {
    playerId: string;
    excludedValues: Set<number>;
    likelyTiles: string[];     // IDs des tuiles probablement en main
    handSize: number;
    playsDoubleFirst: boolean;
    playsHeavyFirst: boolean;
    dangerLevel: DangerLevel;
    movesObserved: number;
}

export type OpponentProfiles = Map<string, OpponentProfile>;

export function initOpponentProfiles(opponentIds: string[], initialHandSize = 7): OpponentProfiles {
    const profiles = new Map<string, OpponentProfile>();
    for (const id of opponentIds) {
        profiles.set(id, {
            playerId: id,
            excludedValues: new Set(),
            likelyTiles: [],
            handSize: initialHandSize,
            playsDoubleFirst: false,
            playsHeavyFirst: false,
            dangerLevel: 'LOW',
            movesObserved: 0,
        });
    }
    return profiles;
}

export function updateOnPlay(
    profiles: OpponentProfiles,
    tracker: TileTracker,
    playerId: string,
    tile: { id: string; left: number; right: number; isDouble: boolean }
): OpponentProfiles {
    const next = cloneProfiles(profiles);
    const profile = next.get(playerId);
    if (!profile) return next;

    profile.handSize = Math.max(0, profile.handSize - 1);
    profile.movesObserved++;

    if (tile.isDouble && profile.movesObserved <= 2) profile.playsDoubleFirst = true;
    if ((tile.left + tile.right) >= 10 && profile.movesObserved <= 3) profile.playsHeavyFirst = true;

    profile.likelyTiles = likelyTilesFor(tracker, playerId);
    profile.dangerLevel = computeDanger(profile.handSize);
    next.set(playerId, profile);
    return next;
}

export function updateOnPass(
    profiles: OpponentProfiles,
    tracker: TileTracker,
    playerId: string,
    leftValue: DominoSide | null,
    rightValue: DominoSide | null
): OpponentProfiles {
    const next = cloneProfiles(profiles);
    const profile = next.get(playerId);
    if (!profile) return next;

    if (leftValue !== null) profile.excludedValues.add(leftValue);
    if (rightValue !== null) profile.excludedValues.add(rightValue);
    profile.likelyTiles = likelyTilesFor(tracker, playerId);
    profile.dangerLevel = computeDanger(profile.handSize);
    next.set(playerId, profile);
    return next;
}

/**
 * Vérifie si jouer une tuile donnerait une extrémité de table jouable
 * par un adversaire en état CRITICAL.
 * Retourne true si le coup est risqué.
 */
export function wouldHelpCritical(
    profiles: OpponentProfiles,
    newLeftValue: number,
    newRightValue: number
): boolean {
    for (const profile of profiles.values()) {
        if (profile.dangerLevel !== 'CRITICAL') continue;
        const excluded = profile.excludedValues;
        // Si l'adversaire peut potentiellement jouer sur l'une des nouvelles extrémités
        const canPlayLeft = !excluded.has(newLeftValue);
        const canPlayRight = !excluded.has(newRightValue);
        if (canPlayLeft || canPlayRight) return true;
    }
    return false;
}

function computeDanger(handSize: number): DangerLevel {
    if (handSize <= 1) return 'CRITICAL';
    if (handSize <= 2) return 'HIGH';
    if (handSize <= 4) return 'MEDIUM';
    return 'LOW';
}

function cloneProfiles(profiles: OpponentProfiles): OpponentProfiles {
    const next = new Map<string, OpponentProfile>();
    for (const [k, v] of profiles) {
        next.set(k, { ...v, excludedValues: new Set(v.excludedValues), likelyTiles: [...v.likelyTiles] });
    }
    return next;
}
