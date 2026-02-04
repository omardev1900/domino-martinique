import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { FadeInUp } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

interface SettingsScreenProps {
    onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
    // Mock State for UI
    const [soundEnabled, setSoundEnabled] = React.useState(true);
    const [vibrationEnabled, setVibrationEnabled] = React.useState(true);

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} />

            <Animated.View entering={FadeInUp.springify()} style={styles.modal}>
                <Text style={styles.title}>Settings</Text>

                <View style={styles.row}>
                    <Text style={styles.label}>Sound Effects</Text>
                    <Switch
                        value={soundEnabled}
                        onValueChange={setSoundEnabled}
                        trackColor={{ false: "#767577", true: "#81c784" }}
                        thumbColor={soundEnabled ? "#2e7d32" : "#f4f3f4"}
                    />
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Vibration</Text>
                    <Switch
                        value={vibrationEnabled}
                        onValueChange={setVibrationEnabled}
                        trackColor={{ false: "#767577", true: "#81c784" }}
                        thumbColor={vibrationEnabled ? "#2e7d32" : "#f4f3f4"}
                    />
                </View>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        zIndex: 200,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 30,
        minHeight: 300,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1b5e20',
        marginBottom: 30,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    label: {
        fontSize: 18,
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 20,
    },
    closeButton: {
        backgroundColor: '#eee',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    closeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
    },
});
