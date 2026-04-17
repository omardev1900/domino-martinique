import { createAudioPlayer, AudioPlayer, setAudioModeAsync, AudioSource } from 'expo-audio';
import { Platform } from 'react-native';
import SettingsManager from '../SettingsManager';
import { LogService } from '../services/LogService';

type SoundName = 'clack1' | 'clack2' | 'clack3' | 'notify' | 'win' | 'lose' | 'shuffle' | 'bgm1' | 'bgm2' | 'bgm3' | 'end' | 'toktok' | 'startGame' | 'timer' | 'end_time';

class SoundManager {
    private static instance: SoundManager;
    private sounds: Record<SoundName, AudioPlayer | null> = {
        clack1: null, clack2: null, clack3: null,
        notify: null, win: null, lose: null,
        shuffle: null, bgm1: null, bgm2: null,
        bgm3: null, end: null, toktok: null,
        startGame: null, timer: null, end_time: null,
    };

    private currentMusic: AudioPlayer | null = null;
    private currentMusicName: SoundName | null = null;
    private baseMusicVolume = 0.3; // Volume de base cible pour la musique en cours
    private duckingTimeout: NodeJS.Timeout | null = null;

    // DEBOUNCE: Track last play time per sound to prevent saturation
    private lastPlayTime: Record<string, number> = {};
    private readonly DEBOUNCE_MS = 100;

    // WEB AUTOPLAY GUARD
    private userInteracted = Platform.OS !== 'web';
    private pendingMusicName: ('bgm1' | 'bgm2' | 'bgm3') | null = null;

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
        if (typeof navigator !== 'undefined' && 'userActivation' in navigator) {
            return (navigator as any).userActivation.hasBeenActive;
        }
        return this.userInteracted;
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
        try {
            try {
                await setAudioModeAsync({
                    allowsRecording: false,
                    playsInSilentMode: true,
                    interruptionModeIOS: 1, // DoNotMix
                    shouldRouteThroughEarpieceAndroid: false
                });
            } catch (e) {
                LogService.warn('SoundManager', 'setAudioModeAsync issue', e);
            }

            // 1. Fetch Remote Config & Assignments
            let remoteBGMs: Record<string, string> = {};
            try {
                const docRef = doc(db, 'config', 'audio');
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    const bgmList = data.bgmList || [];
                    const assignments = data.assignments || {};

                    // Résoudre chaque slot (bgm1, bgm2, bgm3) en fonction de l'ID assigné
                    ['bgm1', 'bgm2', 'bgm3'].forEach(slot => {
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
                // TOUTES les musiques utilisent bgm3.mp3 par défaut localement (Généralisation)
                bgm1: remoteBGMs['bgm1'] || require('@/assets/sounds/bgm3.mp3'),
                bgm2: remoteBGMs['bgm2'] || require('@/assets/sounds/bgm3.mp3'),
                bgm3: remoteBGMs['bgm3'] || require('@/assets/sounds/bgm3.mp3'),
                end: require('@/assets/sounds/end.mp3'),
                toktok: require('@/assets/sounds/toktok.mp3'),
                startGame: require('@/assets/sounds/start-game.mp3'),
                timer: require('@/assets/sounds/timer.mp3'),
                end_time: require('@/assets/sounds/end_time.mp3'),
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

    // ─── Background Music ─────────────────────────────────────────────────────

    async playMusic(name: 'bgm1' | 'bgm2' | 'bgm3', volume = 0.3) {
        if (!this.isAudioAllowed) {
            this.pendingMusicName = name;
            return;
        }

        try {
            // Éviter de relancer la même musique si elle joue déjà
            if (this.currentMusicName === name && this.currentMusic?.playing) {
                return;
            }

            // Arrêt en douceur de la musique précédente
            if (this.currentMusic) {
                await this.fadeMusic(0, 500);
                this.currentMusic.pause();
                this.currentMusic.seekTo(0);
            }

            const player = this.sounds[name];
            if (player) {
                this.baseMusicVolume = volume;
                const settings = SettingsManager.getSettings();
                
                player.loop = true;
                player.volume = 0; // Commencer à 0 pour le fade-in
                player.play();
                
                this.currentMusic = player;
                this.currentMusicName = name;
                
                // Entrée en fondu
                await this.fadeMusic(this.baseMusicVolume * settings.bgmVolume, 1000);
            }
        } catch (error) {
            LogService.warn('SoundManager', `Music error "${name}"`, error);
        }
    }

    async stopMusic(fadeDuration = 800) {
        if (!this.currentMusic) return;
        try {
            await this.fadeMusic(0, fadeDuration);
            this.currentMusic.pause();
            this.currentMusic.seekTo(0);
            this.currentMusic = null;
            this.currentMusicName = null;
        } catch (error) {
            LogService.warn('SoundManager', 'Error stopping music', error);
        }
    }

    /**
     * Baisse temporairement le volume (Ducking) lors d'un effet sonore
     */
    private duckMusic() {
        if (!this.currentMusic || !this.currentMusic.playing) return;
        
        const settings = SettingsManager.getSettings();
        const targetVol = this.baseMusicVolume * settings.bgmVolume;
        const duckVol = targetVol * 0.4; // Baisser à 40% du volume normal

        // Annuler tout timeout précédent
        if (this.duckingTimeout) clearTimeout(this.duckingTimeout);

        this.currentMusic.volume = duckVol;

        // Rétablir le volume après 800ms
        this.duckingTimeout = setTimeout(() => {
            if (this.currentMusic) {
                // Rétablissement progressif (simple)
                this.currentMusic.volume = targetVol;
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
                this.currentMusic.volume = Math.max(0, Math.min(1, startVol + (volStep * i)));
            }
        }
    }

    /**
     * Surveille l'état de la musique et la relance si nécessaire (Watchdog)
     */
    private startWatchdog() {
        setInterval(() => {
            if (this.currentMusic && !this.currentMusic.playing && this.currentMusicName) {
                const settings = SettingsManager.getSettings();
                if (settings.bgmVolume > 0) {
                    LogService.info('SoundManager', 'Watchdog: Music stalled, restarting...');
                    this.currentMusic.play();
                }
            }
        }, 3000);
    }

    // ─── Sound Effects ───────────────────────────────────────────────────────

    async playSound(name: SoundName) {
        if (!this.isAudioAllowed) return;

        try {
            const settings = SettingsManager.getSettings();
            if (!settings.isSfxEnabled || settings.sfxVolume <= 0) return;

            // Débridage Safari/Web : s'assurer qu'on a bien l'autorisation
            this.unlockAudio();

            // DEBOUNCE
            const now = Date.now();
            if (now - (this.lastPlayTime[name] || 0) < this.DEBOUNCE_MS) return;
            this.lastPlayTime[name] = now;

            const player = this.sounds[name];
            if (player) {
                // DUCKING : Baisser la musique si c'est un son important
                if (['win', 'lose', 'notify', 'shuffle', 'startGame', 'end'].includes(name)) {
                    this.duckMusic();
                }

                player.volume = settings.sfxVolume;
                player.seekTo(0);
                player.play();
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
    async playEvent(event: 'WIN' | 'LOSE' | 'ROUND_END' | 'START') {
        const map: Record<string, SoundName> = {
            WIN: 'win',
            LOSE: 'lose',
            ROUND_END: 'end',
            START: 'startGame'
        };

        const sound = map[event];
        if (sound) {
            // Pour les événements majeurs, on peut couper la musique 2 secondes
            if (event === 'WIN' || event === 'LOSE') {
                this.stopMusic(500);
            }
            this.playSound(sound);
        }
    }

    async updateVolumes() {
        const settings = SettingsManager.getSettings();
        if (this.currentMusic) {
            this.currentMusic.volume = this.baseMusicVolume * settings.bgmVolume;
        }
    }

    async unloadSounds() {
        for (const player of Object.values(this.sounds)) {
            player?.remove();
        }
    }
}

export default SoundManager.getInstance();
