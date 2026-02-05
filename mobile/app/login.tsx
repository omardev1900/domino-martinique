
import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../src/core/services/auth.service';

export default function LoginScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleGuestLogin = async () => {
        setIsLoading(true);
        try {
            await authService.loginAsGuest();
            router.replace('/home');
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible de se connecter en invité.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#0d1f0d', '#1a3d1a', '#2d5f2e']}
            style={styles.container}
        >
            <View style={styles.content}>
                <Text style={styles.logo}>🁡</Text>
                <Text style={styles.title}>DOMINO</Text>
                <Text style={styles.subtitle}>MARTINIQUE</Text>

                <View style={styles.divider} />

                <View style={styles.formContainer}>
                    <Text style={styles.welcomeText}>Bienvenue</Text>

                    <TouchableOpacity
                        style={styles.guestButton}
                        onPress={handleGuestLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#0d1f0d" />
                        ) : (
                            <Text style={styles.guestButtonText}>Jouer en Invité</Text>
                        )}
                    </TouchableOpacity>

                    {/* Placeholder for future auth methods */}
                    <Text style={styles.orText}>- ou -</Text>

                    <TouchableOpacity style={[styles.secondaryButton, { opacity: 0.5 }]} disabled>
                        <Text style={styles.secondaryButtonText}>Connexion (Bientôt)</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '300',
        color: '#FFD700',
        letterSpacing: 10,
        marginTop: 8,
    },
    divider: {
        width: 120,
        height: 3,
        backgroundColor: 'rgba(255,215,0,0.5)',
        marginTop: 30,
        marginBottom: 50,
        borderRadius: 2,
    },
    formContainer: {
        width: '100%',
        maxWidth: 300,
        alignItems: 'center',
        gap: 20,
    },
    welcomeText: {
        fontSize: 20,
        color: '#FFFFFF',
        marginBottom: 10,
        opacity: 0.8,
    },
    guestButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#FFD700',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    guestButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0d1f0d',
    },
    orText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 14,
    },
    secondaryButton: {
        width: '100%',
        height: 56,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    secondaryButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
