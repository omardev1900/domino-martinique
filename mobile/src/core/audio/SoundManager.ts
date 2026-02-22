import { createAudioPlayer, AudioPlayer, setAudioModeAsync, AudioSource } from 'expo-audio';
import { Platform } from 'react-native';
import SettingsManager from '../SettingsManager';

type SoundName = 'clack1' | 'clack2' | 'clack3' | 'notify' | 'win' | 'lose' | 'shuffle' | 'bgm1' | 'bgm2' | 'bgm3' | 'boude' | 'toktok';

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
        boude: null,
        toktok: null,
    };

    private currentMusic: AudioPlayer | null = null;
    private currentMusicName: SoundName | null = null;

    // DEBOUNCE: Track last play time per sound to prevent saturation
    private lastPlayTime: Record<string, number> = {};
    private readonly DEBOUNCE_MS = 100;

    // WEB AUTOPLAY GUARD: Browsers require a user gesture before calling .play()
    // On mobile (native), audio can always play. On Web, we wait for unlockAudio().
    private userInteracted = Platform.OS !== 'web'; // true immediately on native, false on web
    private pendingMusicName: ('bgm1' | 'bgm2' | 'bgm3') | null = null;
    private pendingMusicVolume = 0.5;

    private constructor() { }

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    /**
     * Call this on the FIRST user interaction (tap, click) to unlock Web audio.
     * This follows the browser autoplay policy — audio can only play after a gesture.
     */
    unlockAudio() {
        if (this.userInteracted) return; // Already unlocked
        this.userInteracted = true;
        console.log('[SoundManager] Audio unlocked by user interaction.');

        // Resume any pending background music that was requested before the gesture
        if (this.pendingMusicName) {
            this.playMusic(this.pendingMusicName, this.pendingMusicVolume);
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
                console.warn('[SoundManager] setAudioModeAsync not supported on this platform:', e);
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
                boude: require('@/assets/sounds/boude.mp3'),
                toktok: require('@/assets/sounds/toktok.mp3'),
            };

            for (const [key, source] of Object.entries(soundMap)) {
                try {
                    const player = createAudioPlayer(source);
                    this.sounds[key as SoundName] = player;
                } catch (e) {
                    console.error(`Error loading ${key}:`, e);
                }
            }
        } catch (error) {
            console.warn('Failed to configure or preload sounds', error);
        }
    }

    async playClack() {
        const clacks: SoundName[] = ['clack1', 'clack2', 'clack3'];
        const randomClack = clacks[Math.floor(Math.random() * clacks.length)];
        await this.playSound(randomClack);
    }

    // ─── Background Music ─────────────────────────────────────────────────────

    async playMusic(name: 'bgm1' | 'bgm2' | 'bgm3', volume = 0.5) {
        // On Web, defer until user has interacted (browser autoplay policy)
        if (!this.userInteracted) {
            console.warn(`[SoundManager] Audio blocked on Web (no gesture yet). Music "${name}" queued.`);
            this.pendingMusicName = name;
            this.pendingMusicVolume = volume;
            return;
        }

        try {
            if (this.currentMusicName === name && this.currentMusic) {
                // Already playing this track
                if (!this.currentMusic.playing) {
                    this.currentMusic.play();
                }
                return;
            }

            if (this.currentMusic) {
                this.currentMusic.pause();
                this.currentMusic.seekTo(0);
            }

            if (!SettingsManager.getSettings().isSoundEnabled) return;

            const player = this.sounds[name];
            if (player) {
                player.loop = true;
                player.volume = volume;
                player.play();
                this.currentMusic = player;
                this.currentMusicName = name;
            } else {
                console.warn(`Music ${name} not found`);
            }
        } catch (error) {
            console.warn(`[SoundManager] Error playing music "${name}" — browser may have blocked autoplay:`, error);
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
            console.warn('Error stopping music', error);
        }
    }

    async setMusicVolume(volume: number) {
        if (this.currentMusic) {
            this.currentMusic.volume = volume;
        }
    }

    async playSound(name: SoundName) {
        // On Web, block all sound until user has interacted
        if (!this.userInteracted) {
            console.warn(`[SoundManager] Sound "${name}" blocked — waiting for user gesture.`);
            return;
        }

        try {
            if (!SettingsManager.getSettings().isSoundEnabled) return;

            // DEBOUNCE: Prevent same sound playing within 100ms
            const now = Date.now();
            const lastTime = this.lastPlayTime[name] || 0;
            if (now - lastTime < this.DEBOUNCE_MS) {
                return; // Skip - too soon
            }
            this.lastPlayTime[name] = now;

            const player = this.sounds[name];
            if (player) {
                player.seekTo(0);
                player.play();
            }
            // Silently ignore if sound not loaded yet
        } catch (error) {
            console.warn(`[SoundManager] Error playing sound "${name}":`, error);
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
        const current = SettingsManager.getSettings().isSoundEnabled;
        const newState = !current;
        await SettingsManager.setSoundEnabled(newState);

        if (newState) {
            // Resume music if we were playing something
            if (this.currentMusicName && (this.currentMusicName === 'bgm1' || this.currentMusicName === 'bgm2' || this.currentMusicName === 'bgm3')) {
                this.playMusic(this.currentMusicName);
            }
        } else {
            this.stopMusic();
        }

        return newState;
    }
}

export default SoundManager.getInstance();
