import * as Haptics from 'expo-haptics';

const HapticManager = {
    triggerImpact: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    triggerSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    triggerError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
};

export default HapticManager;
