import { Audio } from 'expo-av';
import SettingsManager from '../SettingsManager';

type SoundName = 'clack1' | 'clack2' | 'clack3' | 'notify' | 'win' | 'lose' | 'shuffle' | 'bgm1' | 'bgm2' | 'bgm3' | 'boude';

class SoundManager {
    private static instance: SoundManager;
    private sounds: Record<SoundName, Audio.Sound | null> = {
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
    };

    private currentMusic: Audio.Sound | null = null;

    // DEBOUNCE: Track last play time per sound to prevent saturation
    private lastPlayTime: Record<string, number> = {};
    private readonly DEBOUNCE_MS = 100;

    private constructor() { }

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    async preloadSounds() {
        try {
            // Configure Audio behavior (crucial for iOS silent mode)
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: false,
                interruptionModeIOS: 1, // InterruptionModeIOS.DoNotMix
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                interruptionModeAndroid: 1, // InterruptionModeAndroid.DoNotMix
                playThroughEarpieceAndroid: false,
            });

            // Load sounds
            const soundMap: Record<SoundName, any> = {
                clack1: require('../../../assets/sounds/clack1.mp3'),
                clack2: require('../../../assets/sounds/clack2.mp3'),
                clack3: require('../../../assets/sounds/clack3.mp3'),
                notify: require('../../../assets/sounds/notify.mp3'),
                win: require('../../../assets/sounds/win.mp3'),
                lose: require('../../../assets/sounds/lose.mp3'),
                shuffle: require('../../../assets/sounds/distribute.mp3'),
                bgm1: require('../../../assets/sounds/bgm1.mp3'),
                bgm2: require('../../../assets/sounds/bgm2.mp3'),
                bgm3: require('../../../assets/sounds/bgm3.mp3'),
                boude: require('../../../assets/sounds/boude.mp3'),
            };

            for (const [key, source] of Object.entries(soundMap)) {
                try {
                    const { sound } = await Audio.Sound.createAsync(source);
                    this.sounds[key as SoundName] = sound;
                    // console.log(`Loaded ${key}`);
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

    // Background Music Methods

    async playMusic(name: 'bgm1' | 'bgm2' | 'bgm3', volume = 0.5) {
        try {
            if (this.currentMusic) {
                await this.currentMusic.stopAsync();
            }

            if (!SettingsManager.getSettings().isSoundEnabled) return;

            const sound = this.sounds[name];
            if (sound) {
                await sound.setIsLoopingAsync(true);
                await sound.setVolumeAsync(volume);
                await sound.playAsync();
                this.currentMusic = sound;
            } else {
                console.warn(`Music ${name} not found`);
            }
        } catch (error) {
            console.warn(`Error playing music ${name}`, error);
        }
    }

    async stopMusic() {
        try {
            if (this.currentMusic) {
                await this.currentMusic.stopAsync();
                this.currentMusic = null;
            }
        } catch (error) {
            console.warn('Error stopping music', error);
        }
    }

    async setMusicVolume(volume: number) {
        if (this.currentMusic) {
            await this.currentMusic.setVolumeAsync(volume);
        }
    }

    async playSound(name: SoundName) {
        try {
            if (!SettingsManager.getSettings().isSoundEnabled) return;
            // DEBOUNCE: Prevent same sound playing within 100ms
            const now = Date.now();
            const lastTime = this.lastPlayTime[name] || 0;
            if (now - lastTime < this.DEBOUNCE_MS) {
                return; // Skip - too soon
            }
            this.lastPlayTime[name] = now;

            const soundObject = this.sounds[name];
            if (soundObject) {
                // Reset to start just in case
                await soundObject.replayAsync();
            }
            // Silently ignore if sound not loaded yet
        } catch (error) {
            console.warn(`Error playing sound ${name}`, error);
        }
    }

    async unloadSounds() {
        for (const sound of Object.values(this.sounds)) {
            if (sound) {
                await sound.unloadAsync();
            }
        }
    }
}

export default SoundManager.getInstance();
