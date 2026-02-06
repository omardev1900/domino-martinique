
import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { FadeInUp, FadeInScaleIn } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import SettingsManager from '../core/SettingsManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsScreenProps {
    onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isLandscape = width > height;

    const settings = SettingsManager.getSettings();
    const [soundEnabled, setSoundEnabled] = React.useState(settings.isSoundEnabled);
    const [vibrationEnabled, setVibrationEnabled] = React.useState(settings.isVibrationEnabled);

    const toggleSound = (val: boolean) => {
        setSoundEnabled(val);
        SettingsManager.setSoundEnabled(val);
    };

    const toggleVibration = (val: boolean) => {
        setVibrationEnabled(val);
        SettingsManager.setVibrationEnabled(val);
    };

    return (
        <View style={[styles.container, isLandscape && styles.containerLandscape]}>
            <TouchableOpacity
                activeOpacity={1}
                style={styles.backdrop}
                onPress={onClose}
            />

            <Animated.View
                entering={FadeInUp.springify()}
                style={[
                    styles.modal,
                    isLandscape ? styles.modalLandscape : styles.modalPortrait,
                    { paddingBottom: isLandscape ? 20 : insets.bottom + 20 }
                ]}
            >
                <Text style={styles.title}>Paramètres</Text>

                <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.label}>Effets Sonores</Text>
                            <Text style={styles.hint}>Bruitages et musique</Text>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={toggleSound}
                            trackColor={{ false: "#767577", true: "#81c784" }}
                            thumbColor={soundEnabled ? "#2e7d32" : "#f4f3f4"}
                        />
                    </View>

                    <View style={styles.row}>
                        <View>
                            <Text style={styles.label}>Vibrations</Text>
                            <Text style={styles.hint}>Retours haptiques</Text>
                        </View>
                        <Switch
                            value={vibrationEnabled}
                            onValueChange={toggleVibration}
                            trackColor={{ false: "#767577", true: "#81c784" }}
                            thumbColor={vibrationEnabled ? "#2e7d32" : "#f4f3f4"}
                        />
                    </View>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeText}>Fermer</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 200,
    },
    containerLandscape: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modal: {
        backgroundColor: '#fff',
        padding: 24,
    },
    modalPortrait: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        maxHeight: '80%',
    },
    modalLandscape: {
        width: 400,
        borderRadius: 20,
        maxHeight: '90%',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1b5e20',
        marginBottom: 24,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    hint: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15,
    },
    closeButton: {
        backgroundColor: '#1b5e20',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 5,
    },
    closeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
