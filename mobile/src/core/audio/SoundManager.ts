import { createAudioPlayer, AudioPlayer, setAudioModeAsync, AudioSource } from 'expo-audio';
import { Platform } from 'react-native';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import SettingsManager, { BgmTheme } from '../SettingsManager';
import { LogService } from '../services/LogService';

type MusicContext = Exclude<BgmTheme, 'none'>;
type LegacyMusicContext = 'bgm1' | 'bgm2' | 'bgm3';
type SoundName = 'clack1' | 'clack2' | 'clack3' | 'notify' | 'win' | 'lose' | 'shuffle' | MusicContext | 'end' | 'toktok' | 'startGame' | 'timer' | 'end_time' | 'leagueJingle' | 'roundEnd' | 'mancheEnd' | 'matchEnd';
type SoundCategory = 'ui' | 'gameplay' | 'stinger_major';

type AudioAssignments = Record<MusicContext, string | null>;
type SoundPolicy = {
    category: SoundCategory;
    cooldownMs: number;
    ducksMusic?: boolean;
    duckFactor?: number;
    duckDurationMs?: number;
    exclusiveGroup?: string;
    exclusiveGroupCooldownMs?: number;
    majorStingerLockMs?: number;
};

const MUSIC_CONTEXT_FALLBACK: Record<MusicContext, AudioSource> = {
    mainMenu: require('@/assets/sounds/bgm.mp3'),
    gameNormal: require('@/assets/sounds/bgm.mp3'),
    gameIntense: require('@/assets/sounds/bgm.mp3'),
};

const SOUND_POLICIES: Partial<Record<SoundName, SoundPolicy>> = {
    clack1: { category: 'gameplay', cooldownMs: 80 },
    clack2: { category: 'gameplay', cooldownMs: 80 },
    clack3: { category: 'gameplay', cooldownMs: 80 },
    toktok: { category: 'gameplay', cooldownMs: 180 },
    timer: { category: 'gameplay', cooldownMs: 450 },
    end_time: { category: 'gameplay', cooldownMs: 700, ducksMusic: true, duckFactor: 0.55, duckDurationMs: 900 },
    notify: { category: 'ui', cooldownMs: 250, ducksMusic: true, duckFactor: 0.55, duckDurationMs: 600 },
    shuffle: { category: 'gameplay', cooldownMs: 500, ducksMusic: true, duckFactor: 0.45, duckDurationMs: 850 },
    startGame: { category: 'stinger_major', cooldownMs: 1200, ducksMusic: true, duckFactor: 0.2, duckDurationMs: 1400, exclusiveGroup: 'major_stinger', exclusiveGroupCooldownMs: 1400, majorStingerLockMs: 1400 },
    win: { category: 'stinger_major', cooldownMs: 1400, ducksMusic: true, duckFactor: 0.2, duckDurationMs: 1800, exclusiveGroup: 'terminal', exclusiveGroupCooldownMs: 2200, majorStingerLockMs: 2000 },
    lose: { category: 'stinger_major', cooldownMs: 1400, ducksMusic: true, duckFactor: 0.2, duckDurationMs: 1800, exclusiveGroup: 'terminal', exclusiveGroupCooldownMs: 2200, majorStingerLockMs: 2000 },
    end: { category: 'stinger_major', cooldownMs: 1400, ducksMusic: true, duckFactor: 0.2, duckDurationMs: 1800, exclusiveGroup: 'terminal', exclusiveGroupCooldownMs: 2200, majorStingerLockMs: 2000 },
    roundEnd: { category: 'stinger_major', cooldownMs: 1400, ducksMusic: true, duckFactor: 0.22, duckDurationMs: 1800, exclusiveGroup: 'terminal', exclusiveGroupCooldownMs: 2200, majorStingerLockMs: 2000 },
    mancheEnd: { category: 'stinger_major', cooldownMs: 1600, ducksMusic: true, duckFactor: 0.2, duckDurationMs: 2000, exclusiveGroup: 'terminal', exclusiveGroupCooldownMs: 2400, majorStingerLockMs: 2200 },
    matchEnd: { category: 'stinger_major', cooldownMs: 1800, ducksMusic: true, duckFactor: 0.18, duckDurationMs: 2200, exclusiveGroup: 'terminal', exclusiveGroupCooldownMs: 2600, majorStingerLockMs: 2400 },
    leagueJingle: { category: 'stinger_major', cooldownMs: 1800, ducksMusic: true, duckFactor: 0.18, duckDurationMs: 2200, exclusiveGroup: 'major_stinger', exclusiveGroupCooldownMs: 2400, majorStingerLockMs: 2200 },
};

const DEFAULT_SOUND_POLICY: SoundPolicy = {
    category: 'gameplay',
    cooldownMs: 100,
};

const SOUND_MIX_GAINS: Partial<Record<SoundName, number>> = {
    clack1: 0.42,
    clack2: 0.38,
    clack3: 0.36,
    notify: 0.5,
    shuffle: 0.58,
    toktok: 0.48,
    timer: 0.28,
    end_time: 0.52,
    startGame: 0.5,
    win: 0.58,
    lose: 0.52,
    end: 0.55,
    roundEnd: 0.62,
    mancheEnd: 0.68,
    matchEnd: 0.74,
    leagueJingle: 0.66,
};

function normalizeMusicContext(value: string): MusicContext | null {
    if (value === 'bgm1' || value === 'gameNormal') return 'gameNormal';
    if (value === 'bgm2' || value === 'gameIntense') return 'gameIntense';
    if (value === 'bgm3' || value === 'mainMenu') return 'mainMenu';
    return null;
}

function normalizeAssignments(assignments: Record<string, string | null | undefined> | undefined): AudioAssignments {
    return {
        mainMenu: assignments?.mainMenu ?? assignments?.bgm3 ?? null,
        gameNormal: assignments?.gameNormal ?? assignments?.bgm1 ?? null,
        gameIntense: assignments?.gameIntense ?? assignments?.bgm2 ?? null,
    };
}

class SoundManager {
    private static instance: SoundManager;
    private sounds: Record<SoundName, AudioPlayer | null> = {
        clack1: null, clack2: null, clack3: null,
        notify: null, win: null, lose: null,
        shuffle: null, mainMenu: null, gameNormal: null,
        gameIntense: null, end: null, toktok: null,
        startGame: null, timer: null, end_time: null, leagueJingle: null, roundEnd: null, mancheEnd: null, matchEnd: null,
    };

    private currentMusic: AudioPlayer | null = null;
    private currentMusicName: SoundName | null = null;
    private baseMusicVolume = 0.3; // Volume de base cible pour la musique en cours
    private duckingTimeout: ReturnType<typeof setTimeout> | null = null;
    private watchdogInterval: ReturnType<typeof setInterval> | null = null;
    private preloadPromise: Promise<void> | null = null;
    private isPreloaded = false;
    private musicTransitionToken = 0;
    private lastGroupPlayTime: Record<string, number> = {};
    private activeMajorStingerUntil = 0;

    private lastPlayTime: Record<string, number> = {};

    // WEB AUTOPLAY GUARD
    private userInteracted = Platform.OS !== 'web';
    private pendingMusicName: MusicContext | null = null;

    private constructor() {
        this.startWatchdog();
    }

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private get isAudioAllowed(): boolean {
        if (Platform.OS !== 'web') return true;
        // Safari iOS : l'API HTMLMediaElement.play() jette NotSupportedError dans plusieurs
        // contextes (mode privé, Low Power Mode, iOS < 14.5). On désactive l'audio plutôt
        // que de polluer Sentry de 135+ erreurs/jour. À retirer si on ajoute un fallback WebAudio.
        if (typeof navigator !== 'undefined') {
            const ua = navigator.userAgent || '';
            const isIOSSafari = /iPad|iPhone|iPod/.test(ua) && /WebKit/.test(ua) && !/CriOS|FxiOS/.test(ua);
            if (isIOSSafari) return false;
        }
        if (typeof navigator !== 'undefined' && 'userActivation' in navigator) {
            return (navigator as any).userActivation.hasBeenActive;
        }
        return this.userInteracted;
    }

    private getTargetMusicVolume(): number {
        const settings = SettingsManager.getSettings();
        if (!settings.isBgmEnabled) return 0;
        return Math.max(0, Math.min(1, this.baseMusicVolume * settings.bgmVolume));
    }

    unlockAudio() {
        if (this.userInteracted) return;
        this.userInteracted = true;
        LogService.info('SoundManager', 'Audio unlocked.');
        if (this.pendingMusicName) {
            this.playMusic(this.pendingMusicName).catch(e => LogService.warn('SoundManager', String(e)));
            this.pendingMusicName = null;
        }
    }

    async preloadSounds() {
        if (this.isPreloaded) return;
        if (this.preloadPromise) return this.preloadPromise;

        this.preloadPromise = this.doPreloadSounds();
        try {
            await this.preloadPromise;
            this.isPreloaded = true;
        } finally {
            this.preloadPromise = null;
        }
    }

    private async doPreloadSounds() {
        try {
            try {
                await setAudioModeAsync({
                    allowsRecording: false,
                    playsInSilentMode: true
                });
            } catch (e) {
                LogService.warn('SoundManager', 'setAudioModeAsync issue', e);
            }

            // 1. Fetch Remote Config & Assignments
            let remoteBGMs: Partial<Record<MusicContext, string>> = {};
            try {
                const docRef = doc(db, 'config', 'audio');
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    const bgmList = data.bgmList || [];
                    const assignments = normalizeAssignments(data.assignments);

                    // Résoudre chaque slot (bgm1, bgm2, bgm3) en fonction de l'ID assigné
                    (Object.keys(assignments) as MusicContext[]).forEach(slot => {
                        const trackId = assignments[slot];
                        if (trackId) {
                            const track = bgmList.find((t: any) => t.id === trackId);
                            if (track && track.url) {
                                remoteBGMs[slot] = track.url;
                            }
                        }
                    });
                }
            } catch (e) {
                LogService.warn('SoundManager', 'Failed to fetch remote audio config', e);
            }

            const soundMap: Record<SoundName, AudioSource> = {
                clack1: require('@/assets/sounds/clack1.mp3'),
                clack2: require('@/assets/sounds/clack2.mp3'),
                clack3: require('@/assets/sounds/clack3.mp3'),
                notify: require('@/assets/sounds/notify.mp3'),
                win: require('@/assets/sounds/win.mp3'),
                lose: require('@/assets/sounds/lose.mp3'),
                shuffle: require('@/assets/sounds/distribute.mp3'),
                // TOUTES les musiques utilisent bgm.mp3 par défaut localement (Généralisation)
                mainMenu: remoteBGMs.mainMenu || MUSIC_CONTEXT_FALLBACK.mainMenu,
                gameNormal: remoteBGMs.gameNormal || MUSIC_CONTEXT_FALLBACK.gameNormal,
                gameIntense: remoteBGMs.gameIntense || MUSIC_CONTEXT_FALLBACK.gameIntense,
                end: require('@/assets/sounds/end.mp3'),
                toktok: require('@/assets/sounds/toktok.mp3'),
                startGame: require('@/assets/sounds/start-game.mp3'),
                timer: require('@/assets/sounds/timer.mp3'),
                end_time: require('@/assets/sounds/end_time.mp3'),
                leagueJingle: require('@/assets/sounds/jingle-ligue.mp3'),
                roundEnd: require('@/assets/sounds/partie-end.mp3'),
                mancheEnd: require('@/assets/sounds/manche-end.mp3'),
                matchEnd: require('@/assets/sounds/match-end.mp3'),
            };

            for (const [key, source] of Object.entries(soundMap)) {
                try {
                    const player = createAudioPlayer(source);
                    this.sounds[key as SoundName] = player;
                } catch (e) {
                    LogService.error('SoundManager', `Error loading ${key}`, e);
                }
            }
        } catch (error) {
            LogService.warn('SoundManager', 'Failed to preload sounds', error);
        }
    }

    private async ensurePreloaded() {
        if (!this.isPreloaded) {
            await this.preloadSounds();
        }
    }

    private async pauseAndResetPlayer(player: AudioPlayer | null) {
        if (!player) return;
        player.pause();
        player.seekTo(0);
    }

    private safePlayPlayer(player: AudioPlayer | null) {
        if (!player) return;
        try {
            const result = player.play();
            if (result && typeof (result as Promise<void>).catch === 'function') {
                (result as Promise<void>).catch(() => {});
            }
        } catch {
            // Web runtimes may throw synchronously or return void.
        }
    }

    private getSoundPolicy(name: SoundName): SoundPolicy {
        return SOUND_POLICIES[name] ?? DEFAULT_SOUND_POLICY;
    }

    private getSoundGain(name: SoundName): number {
        return SOUND_MIX_GAINS[name] ?? 1;
    }

    private isMajorStingerActive(now: number): boolean {
        return this.activeMajorStingerUntil > now;
    }

    private shouldSuppressSound(policy: SoundPolicy, now: number): boolean {
        if (!this.isMajorStingerActive(now)) return false;
        return policy.category !== 'stinger_major';
    }

    // ─── Background Music ─────────────────────────────────────────────────────

    async playMusic(name: MusicContext | LegacyMusicContext, volume = 0.3) {
        const normalizedName = normalizeMusicContext(name);
        if (!normalizedName) return;
        if (!this.isAudioAllowed) {
            this.pendingMusicName = normalizedName;
            return;
        }
        await this.ensurePreloaded();
        const settings = SettingsManager.getSettings();
        if (!settings.isBgmEnabled || settings.bgmVolume <= 0) return;
        const transitionToken = ++this.musicTransitionToken;

        try {
            // Éviter de relancer la même musique si elle joue déjà
            if (this.currentMusicName === normalizedName && this.currentMusic) {
                this.baseMusicVolume = volume;
                if (!this.currentMusic.playing) {
                    this.safePlayPlayer(this.currentMusic);
                }
                this.currentMusic.volume = this.getTargetMusicVolume();
                return;
            }

            // Arrêt en douceur de la musique précédente
            const previousMusic = this.currentMusic;
            if (previousMusic) {
                await this.fadeMusic(0, 500);
                if (transitionToken !== this.musicTransitionToken) return;
                await this.pauseAndResetPlayer(previousMusic);
            }

            const player = this.sounds[normalizedName];
            if (player) {
                this.baseMusicVolume = volume;
                
                player.loop = true;
                player.volume = 0; // Commencer à 0 pour le fade-in
                this.safePlayPlayer(player);
                
                this.currentMusic = player;
                this.currentMusicName = normalizedName;

                // Entrée en fondu
                await this.fadeMusic(this.getTargetMusicVolume(), 1000);
                if (transitionToken !== this.musicTransitionToken) return;
            }
        } catch (error) {
            LogService.warn('SoundManager', `Music error "${name}"`, error);
        }
    }

    async stopMusic(fadeDuration = 800) {
        if (!this.currentMusic) return;
        const transitionToken = ++this.musicTransitionToken;
        try {
            await this.fadeMusic(0, fadeDuration);
            if (transitionToken !== this.musicTransitionToken) return;
            await this.pauseAndResetPlayer(this.currentMusic);
            this.currentMusic = null;
            this.currentMusicName = null;
        } catch (error) {
            LogService.warn('SoundManager', 'Error stopping music', error);
        }
    }

    /**
     * Baisse temporairement le volume (Ducking) lors d'un effet sonore
     */
    private duckMusic(duckFactor = 0.4, durationMs = 800) {
        if (!this.currentMusic || !this.currentMusic.playing) return;
        
        const targetVol = this.getTargetMusicVolume();
        const duckVol = targetVol * 0.4; // Baisser à 40% du volume normal

        // Annuler tout timeout précédent
        if (this.duckingTimeout) clearTimeout(this.duckingTimeout);

        this.currentMusic.volume = duckVol;

        // Rétablir le volume après 800ms
        this.duckingTimeout = setTimeout(() => {
            if (this.currentMusic) {
                this.currentMusic.volume = this.getTargetMusicVolume();
            }
            this.duckingTimeout = null;
        }, 800);
    }

    /**
     * Effectue un fondu de volume progressif (Fade)
     */
    private async fadeMusic(targetVolume: number, duration: number) {
        if (!this.currentMusic) return;
        const startVol = this.currentMusic.volume;
        const steps = 10;
        const stepTime = duration / steps;
        const volStep = (targetVolume - startVol) / steps;

        for (let i = 1; i <= steps; i++) {
            await new Promise(res => setTimeout(res, stepTime));
            if (this.currentMusic) {
                const calculatedVol = startVol + (volStep * i);
                this.currentMusic.volume = Math.max(0, Math.min(1, calculatedVol));
            }
        }
    }

    /**
     * Surveille l'état de la musique et la relance si nécessaire (Watchdog)
     */
    private startWatchdog() {
        if (this.watchdogInterval) return;

        this.watchdogInterval = setInterval(() => {
            const settings = SettingsManager.getSettings();
            if (!settings.isBgmEnabled || settings.bgmVolume <= 0) return;

            if (this.currentMusic && !this.currentMusic.playing && this.currentMusicName) {
                LogService.info('SoundManager', 'Watchdog: Music stalled, restarting...');
                this.currentMusic.play().catch(() => {});
            }
        }, 3000);
    }

    private stopWatchdog() {
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
            this.watchdogInterval = null;
        }
    }

    // ─── Sound Effects ───────────────────────────────────────────────────────

    async playSound(name: SoundName) {
        if (!this.isAudioAllowed) return;

        try {
            await this.ensurePreloaded();
            const settings = SettingsManager.getSettings();
            if (!settings.isSfxEnabled || settings.sfxVolume <= 0) return;

            // Débridage Safari/Web : s'assurer qu'on a bien l'autorisation
            this.unlockAudio();

            const now = Date.now();
            const policy = this.getSoundPolicy(name);

            if (this.shouldSuppressSound(policy, now)) return;
            if (now - (this.lastPlayTime[name] || 0) < policy.cooldownMs) return;

            if (policy.exclusiveGroup) {
                const lastGroupPlay = this.lastGroupPlayTime[policy.exclusiveGroup] || 0;
                const groupCooldown = policy.exclusiveGroupCooldownMs ?? policy.cooldownMs;
                if (now - lastGroupPlay < groupCooldown) return;
                this.lastGroupPlayTime[policy.exclusiveGroup] = now;
            }

            this.lastPlayTime[name] = now;

            const player = this.sounds[name];
            if (player) {
                if (policy.category === 'stinger_major') {
                    this.activeMajorStingerUntil = Math.max(
                        this.activeMajorStingerUntil,
                        now + (policy.majorStingerLockMs ?? policy.cooldownMs),
                    );
                }

                if (policy.ducksMusic) {
                    this.duckMusic(policy.duckFactor, policy.duckDurationMs);
                }

                player.volume = Math.max(0, Math.min(1, settings.sfxVolume * this.getSoundGain(name)));
                try {
                    player.seekTo(0);
                    const p = player.play();
                    if (p && typeof p.catch === 'function') p.catch(() => {});
                } catch {
                    // NotSupportedError / NotAllowedError / AbortError sur web : ignorer
                }
            }
        } catch (error) {
            LogService.warn('SoundManager', `SFX error "${name}"`, error);
        }
    }

    async playClack() {
        const clacks: SoundName[] = ['clack1', 'clack2', 'clack3'];
        await this.playSound(clacks[Math.floor(Math.random() * clacks.length)]);
    }

    /**
     * Gère un événement de fin de phase proprement
     */
    async playEvent(event: 'WIN' | 'LOSE' | 'ROUND_END' | 'MANCHE_END' | 'MATCH_END' | 'START') {
        const map: Record<string, SoundName> = {
            WIN: 'win',
            LOSE: 'lose',
            ROUND_END: 'roundEnd',
            MANCHE_END: 'mancheEnd',
            MATCH_END: 'matchEnd',
            START: 'startGame'
        };

        const sound = map[event];
        if (sound) {
            // Pour les événements majeurs, on peut couper la musique 2 secondes
            await this.playSound(sound);
        }
    }

    async updateVolumes() {
        const settings = SettingsManager.getSettings();
        if (this.currentMusic) {
            if (!settings.isBgmEnabled || settings.bgmVolume <= 0) {
                // Si la BGM est à zéro, on met en pause la musique au lieu de juste baisser le volume
                this.currentMusic.pause();
            } else {
                // Si on remonte la BGM, on s'assure que la musique repart
                if (!this.currentMusic.playing && this.currentMusicName) {
                    this.safePlayPlayer(this.currentMusic);
                }
                this.currentMusic.volume = this.getTargetMusicVolume();
            }
        }
    }

    /**
     * Bascule l'état sonore global et met à jour les volumes.
     * Retourne le nouvel état (true = activé, false = muet).
     */
    async toggleMute(): Promise<boolean> {
        const settings = SettingsManager.getSettings();
        const nextBgmState = !settings.isBgmEnabled;
        const nextSfxState = !settings.isSfxEnabled;

        await SettingsManager.setBgmEnabled(nextBgmState);
        await SettingsManager.setSfxEnabled(nextSfxState);
        await this.updateVolumes();

        return nextBgmState && nextSfxState;
    }

    async setBgmEnabled(enabled: boolean): Promise<boolean> {
        await SettingsManager.setBgmEnabled(enabled);
        await this.updateVolumes();
        return enabled;
    }

    async setSfxEnabled(enabled: boolean): Promise<boolean> {
        await SettingsManager.setSfxEnabled(enabled);
        return enabled;
    }

    async unloadSounds() {
        this.stopWatchdog();
        if (this.duckingTimeout) {
            clearTimeout(this.duckingTimeout);
            this.duckingTimeout = null;
        }
        this.musicTransitionToken += 1;
        this.currentMusic = null;
        this.currentMusicName = null;
        this.pendingMusicName = null;
        this.isPreloaded = false;
        this.preloadPromise = null;
        this.lastPlayTime = {};
        this.lastGroupPlayTime = {};
        this.activeMajorStingerUntil = 0;

        for (const player of Object.values(this.sounds)) {
            player?.remove();
        }

        Object.keys(this.sounds).forEach((key) => {
            this.sounds[key as SoundName] = null;
        });
    }

    async dispose() {
        await this.stopMusic(0);
        await this.unloadSounds();
    }
}

export default SoundManager.getInstance();
