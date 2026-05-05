import AsyncStorage from '@react-native-async-storage/async-storage';
import { TableTheme } from './themes/tableThemes';

const SFX_ENABLED_KEY = '@domino_settings_sfx_enabled';
const VIBRATION_ENABLED_KEY = '@domino_settings_vibration_enabled';
const TABLE_THEME_KEY = '@domino_settings_table_theme';
const GAME_BGM_THEME_KEY = '@domino_settings_game_bgm_theme';
const BGM_VOLUME_KEY = '@domino_settings_bgm_volume';
const SFX_VOLUME_KEY = '@domino_settings_sfx_volume';

export type BgmTheme = 'mainMenu' | 'gameNormal' | 'gameIntense' | 'none';

function isLegacyBgmTheme(value: string | null): value is 'bgm1' | 'bgm2' | 'bgm3' {
    return value === 'bgm1' || value === 'bgm2' || value === 'bgm3';
}

function normalizeBgmTheme(value: string | null): BgmTheme | null {
    if (value === 'bgm1') return 'gameNormal';
    if (value === 'bgm2') return 'gameIntense';
    if (value === 'bgm3') return 'mainMenu';
    if (value === 'mainMenu' || value === 'gameNormal' || value === 'gameIntense' || value === 'none') {
        return value;
    }
    return null;
}

class SettingsManager {
    private static instance: SettingsManager;
    private isSfxEnabled: boolean = true;
    private isVibrationEnabled: boolean = true;
    private tableTheme: TableTheme = 'classic';
    private gameBgmTheme: BgmTheme = 'gameNormal';
    private bgmVolume: number = 0.25;
    private sfxVolume: number = 1.0;

    private constructor() { }

    static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    async loadSettings() {
        try {
            const sfx = await AsyncStorage.getItem(SFX_ENABLED_KEY);
            const vibro = await AsyncStorage.getItem(VIBRATION_ENABLED_KEY);
            const theme = await AsyncStorage.getItem(TABLE_THEME_KEY);
            const bgmTheme = await AsyncStorage.getItem(GAME_BGM_THEME_KEY);
            const savedBgmVol = await AsyncStorage.getItem(BGM_VOLUME_KEY);
            const savedSfxVol = await AsyncStorage.getItem(SFX_VOLUME_KEY);

            // Legacy support pour l'ancienne clé isSoundEnabled
            const legacySound = await AsyncStorage.getItem('@domino_settings_sound_enabled');
            if (sfx !== null) {
                this.isSfxEnabled = sfx === 'true';
            } else if (legacySound !== null) {
                this.isSfxEnabled = legacySound === 'true';
            }

            if (vibro !== null) this.isVibrationEnabled = vibro === 'true';
            if (theme !== null) this.tableTheme = theme as TableTheme;
            const normalizedBgmTheme = normalizeBgmTheme(bgmTheme);
            if (normalizedBgmTheme) {
                this.gameBgmTheme = normalizedBgmTheme;
                if (isLegacyBgmTheme(bgmTheme)) {
                    await AsyncStorage.setItem(GAME_BGM_THEME_KEY, normalizedBgmTheme);
                }
            }
            if (savedBgmVol !== null) this.bgmVolume = parseFloat(savedBgmVol);
            if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);

        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }

    getSettings() {
        return {
            isSfxEnabled: this.isSfxEnabled,
            isVibrationEnabled: this.isVibrationEnabled,
            tableTheme: this.tableTheme,
            gameBgmTheme: this.gameBgmTheme,
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
        };
    }

    async setSfxEnabled(enabled: boolean) {
        this.isSfxEnabled = enabled;
        try {
            await AsyncStorage.setItem(SFX_ENABLED_KEY, enabled.toString());
        } catch (e) {
            console.error('Failed to save sfx setting', e);
        }
    }

    async setGameBgmTheme(theme: BgmTheme) {
        this.gameBgmTheme = theme;
        try {
            await AsyncStorage.setItem(GAME_BGM_THEME_KEY, theme);
        } catch (e) {
            console.error('Failed to save BGM theme setting', e);
        }
    }

    async setBgmVolume(volume: number) {
        this.bgmVolume = volume;
        try {
            await AsyncStorage.setItem(BGM_VOLUME_KEY, volume.toString());
        } catch (e) {
            console.error('Failed to save bgm volume', e);
        }
    }

    async setSfxVolume(volume: number) {
        this.sfxVolume = volume;
        try {
            await AsyncStorage.setItem(SFX_VOLUME_KEY, volume.toString());
        } catch (e) {
            console.error('Failed to save sfx volume', e);
        }
    }

    async setVibrationEnabled(enabled: boolean) {
        this.isVibrationEnabled = enabled;
        try {
            await AsyncStorage.setItem(VIBRATION_ENABLED_KEY, enabled.toString());
        } catch (e) {
            console.error('Failed to save vibration setting', e);
        }
    }

    async setTableTheme(theme: TableTheme) {
        this.tableTheme = theme;
        try {
            await AsyncStorage.setItem(TABLE_THEME_KEY, theme);
        } catch (e) {
            console.error('Failed to save table theme setting', e);
        }
    }
}

export default SettingsManager.getInstance();
