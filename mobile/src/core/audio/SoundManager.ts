import { createAudioPlayer, AudioPlayer, setAudioModeAsync, AudioSource } from 'expo-audio';
import { Platform } from 'react-native';
import SettingsManager from '../SettingsManager';
import { LogService } from '../services/LogService';

type SoundName = 'clack1' | 'clack2' | 'clack3' | 'notify' | 'win' | 'lose' | 'shuffle' | 'bgm1' | 'bgm2' | 'bgm3' | 'end' | 'toktok' | 'startGame' | 'timer' | 'end_time';

class SoundManager {
    private static instance: SoundManager;
    private sounds: Record<SoundName, AudioPlayer | null> = {
        clack1: null,
        clack2: null,
        clack3: null,
        notify: null,
        win: null,
        lose: null,
        shuffle: null,
        bgm1: null,
        bgm2: null,
        bgm3: null,
        end: null,
        toktok: null,
        startGame: null,
        timer: null,
        end_time: null,
    };

    private currentMusic: AudioPlayer | null = null;
    private currentMusicName: SoundName | null = null;

    // DEBOUNCE: Track last play time per sound to prevent saturation
    private lastPlayTime: Record<string, number> = {};
    private readonly DEBOUNCE_MS = 100;

    // WEB AUTOPLAY GUARD: Browsers require a user gesture before calling .play()
    private userInteracted = Platform.OS !== 'web'; // true immediately on native, false on web
    private pendingMusicName: ('bgm1' | 'bgm2' | 'bgm3') | null = null;
    private pendingMusicVolume = 0.3;

    private constructor() { }

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private get isAudioAllowed(): boolean {
        if (Platform.OS !== 'web') return true;
        // Strict guard: modern browsers reliably report if the user has interacted with the document
        if (typeof navigator !== 'undefined' && 'userActivation' in navigator) {
            return (navigator as any).userActivation.hasBeenActive;
        }
        return this.userInteracted;
    }

    /**
     * Call this on the FIRST user interaction (tap, click) to unlock Web audio.
     * This follows the browser autoplay policy — audio can only play after a gesture.
     */
    unlockAudio() {
        if (this.userInteracted) return; // Already unlocked
        this.userInteracted = true;
        LogService.info('SoundManager', 'Audio unlocked by user interaction.');

        // Resume any pending background music that was requested before the gesture
        if (this.pendingMusicName) {
            this.playMusic(this.pendingMusicName, this.pendingMusicVolume).catch(e => LogService.warn('SoundManager', String(e)));
            this.pendingMusicName = null;
        }
    }

    async preloadSounds() {
        try {
            // Configure Audio behavior (crucial for silent mode on native)
            // On Web, setAudioModeAsync may not exist — guard with try/catch
            try {
                await setAudioModeAsync({
                    allowsRecording: false,
                    playsInSilentMode: true,
                });
            } catch (e) {
                LogService.warn('SoundManager', 'setAudioModeAsync not supported on this platform:', e);
            }

            // Load sounds
            const soundMap: Record<SoundName, AudioSource> = {
                clack1: require('@/assets/sounds/clack1.mp3'),
                clack2: require('@/assets/sounds/clack2.mp3'),
                clack3: require('@/assets/sounds/clack3.mp3'),
                notify: require('@/assets/sounds/notify.mp3'),
                win: require('@/assets/sounds/win.mp3'),
                lose: require('@/assets/sounds/lose.mp3'),
                shuffle: require('@/assets/sounds/distribute.mp3'),
                bgm1: require('@/assets/sounds/bgm1.mp3'),
                bgm2: require('@/assets/sounds/bgm2.mp3'),
                bgm3: require('@/assets/sounds/bgm3.mp3'),
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
            LogService.warn('SoundManager', 'Failed to configure or preload sounds', error);
        }
    }

    async playClack() {
        const clacks: SoundName[] = ['clack1', 'clack2', 'clack3'];
        const randomClack = clacks[Math.floor(Math.random() * clacks.length)];
        await this.playSound(randomClack);
    }

    // ─── Background Music ─────────────────────────────────────────────────────

    async playMusic(name: 'bgm1' | 'bgm2' | 'bgm3', volume = 0.3) {
        // On Web, defer until user has interacted (browser autoplay policy)
        if (!this.isAudioAllowed) {
            LogService.warn('SoundManager', `Audio blocked on Web (no gesture yet). Music "${name}" queued.`);
            this.pendingMusicName = name;
            this.pendingMusicVolume = volume;
            return;
        }

        try {
            if (this.currentMusicName === name && this.currentMusic) {
                // Already playing this track
                if (!this.currentMusic.playing) {
                    try {
                        const playResult = this.currentMusic.play() as any;
                        if (playResult instanceof Promise) {
                            playResult.catch((e: any) => LogService.warn('SoundManager', 'Autoplay prevented on web', e));
                        } else if (playResult && typeof playResult.catch === 'function') {
                            playResult.catch((e: any) => LogService.warn('SoundManager', 'Autoplay prevented on web', e));
                        }
                    } catch (e) {
                        LogService.warn('SoundManager', 'Autoplay prevented on web', e);
                    }
                }
                return;
            }

            if (this.currentMusic) {
                this.currentMusic.pause();
                this.currentMusic.seekTo(0);
            }

            const settings = SettingsManager.getSettings();
            // Le volume final est le volume de base de la piste * le volume BGM des réglages
            const finalVolume = volume * settings.bgmVolume;

            const player = this.sounds[name];
            if (player) {
                player.loop = true;
                player.volume = finalVolume;
                try {
                    const playResult = player.play() as any;
                    if (playResult instanceof Promise) {
                        playResult.catch((e: any) => LogService.warn('SoundManager', 'Autoplay prevented on web', e));
                    } else if (playResult && typeof playResult.catch === 'function') {
                        playResult.catch((e: any) => LogService.warn('SoundManager', 'Autoplay prevented on web', e));
                    }
                } catch (e) {
                    LogService.warn('SoundManager', 'Autoplay prevented on web', e);
                }
                this.currentMusic = player;
                this.currentMusicName = name;
            } else {
                LogService.warn('SoundManager', `Music ${name} not found`);
            }
        } catch (error) {
            LogService.warn('SoundManager', `Error playing music "${name}" — browser may have blocked autoplay:`, error);
        }
    }

    async stopMusic() {
        try {
            if (this.currentMusic) {
                this.currentMusic.pause();
                this.currentMusic.seekTo(0);
                this.currentMusic = null;
                this.currentMusicName = null;
            }
            // Also clear any pending music
            this.pendingMusicName = null;
        } catch (error) {
            LogService.warn('SoundManager', 'Error stopping music', error);
        }
    }

    async setMusicVolume(volume: number) {
        if (this.currentMusic) {
            const settings = SettingsManager.getSettings();
            this.currentMusic.volume = volume * settings.bgmVolume;
        }
    }

    async updateVolumes() {
        const settings = SettingsManager.getSettings();
        if (this.currentMusic) {
            // Restore intended volume multiplier properly if we stored base volume. 
            // For now, simpler to just use 0.5 as base BGM volume.
            this.currentMusic.volume = 0.5 * settings.bgmVolume;
        }
    }

    async playSound(name: SoundName) {
        // On Web, block all sound until user has interacted
        if (!this.isAudioAllowed) {
            LogService.warn('SoundManager', `Sound "${name}" blocked — waiting for user gesture.`);
            return;
        }

        try {
            const settings = SettingsManager.getSettings();
            if (!settings.isSfxEnabled || settings.sfxVolume <= 0) return;

            // DEBOUNCE: Prevent same sound playing within 100ms
            const now = Date.now();
            const lastTime = this.lastPlayTime[name] || 0;
            if (now - lastTime < this.DEBOUNCE_MS) {
                return; // Skip - too soon
            }
            this.lastPlayTime[name] = now;

            const player = this.sounds[name];
            if (player) {
                player.volume = settings.sfxVolume;
                player.seekTo(0);
                // Fire and forget, catching errors internally
                try {
                    const playResult = player.play() as any;
                    if (playResult instanceof Promise) {
                        playResult.catch((e: any) => LogService.warn('SoundManager', `Autoplay blocked for ${name}`, e));
                    } else if (playResult && typeof playResult.catch === 'function') {
                        playResult.catch((e: any) => LogService.warn('SoundManager', `Autoplay blocked for ${name}`, e));
                    }
                } catch (err) {
                    LogService.warn('SoundManager', `Audio play error for ${name}`, err);
                }
            }
            // Silently ignore if sound not loaded yet
        } catch (error) {
            LogService.warn('SoundManager', `Error playing sound "${name}"`, error);
        }
    }

    async unloadSounds() {
        for (const player of Object.values(this.sounds)) {
            if (player) {
                player.remove();
            }
        }
    }

    async toggleMute(): Promise<boolean> {
        const current = SettingsManager.getSettings().isSfxEnabled;
        const newState = !current;
        await SettingsManager.setSfxEnabled(newState);
        // Also mute/unmute BGM music
        if (this.currentMusic) {
            if (newState) {
                const settings = SettingsManager.getSettings();
                this.currentMusic.volume = 0.5 * settings.bgmVolume;
            } else {
                this.currentMusic.volume = 0;
            }
        }
        return newState;
    }
}

export default SoundManager.getInstance();
