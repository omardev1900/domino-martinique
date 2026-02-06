import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = '@domino_settings_sound_enabled';
const VIBRATION_ENABLED_KEY = '@domino_settings_vibration_enabled';

class SettingsManager {
    private static instance: SettingsManager;
    private isSoundEnabled: boolean = true;
    private isVibrationEnabled: boolean = true;

    private constructor() { }

    static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    async loadSettings() {
        try {
            const sound = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
            const vibro = await AsyncStorage.getItem(VIBRATION_ENABLED_KEY);

            if (sound !== null) this.isSoundEnabled = sound === 'true';
            if (vibro !== null) this.isVibrationEnabled = vibro === 'true';
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }

    getSettings() {
        return {
            isSoundEnabled: this.isSoundEnabled,
            isVibrationEnabled: this.isVibrationEnabled,
        };
    }

    async setSoundEnabled(enabled: boolean) {
        this.isSoundEnabled = enabled;
        try {
            await AsyncStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
        } catch (e) {
            console.error('Failed to save sound setting', e);
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
}

export default SettingsManager.getInstance();
