
import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../src/core/services/auth.service';

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const getErrorMessage = (error: any) => {
        const code = error.code || '';
        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/invalid-email') {
            return "Email ou mot de passe incorrect.";
        }
        if (code === 'auth/user-not-found') {
            return "Aucun compte trouvé avec cet email.";
        }
        if (code === 'auth/email-already-in-use') {
            return "Cet email est déjà utilisé.";
        }
        if (code === 'auth/weak-password') {
            return "Le mot de passe est trop faible.";
        }
        return "Une erreur est survenue. Veuillez réessayer.";
    };

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

    const handleSignIn = async () => {
        setErrorMessage('');
        if (!email || !password) {
            setErrorMessage('Veuillez remplir tous les champs.');
            return;
        }
        setIsLoading(true);
        try {
            const user = await authService.signIn(email, password);
            console.log(`✅ User signed in: ${user?.uid}`);

            // Check for active room after successful login
            if (user) {
                try {
                    console.log('🔍 Checking for active room after login...');
                    const { findActiveRoomForUser } = require('../src/core/services/firebase');
                    const activeRoomId = await findActiveRoomForUser(user.uid);

                    if (activeRoomId) {
                        console.log(`✅ Active room found: ${activeRoomId} - showing reconnection alert`);

                        // Small delay to ensure DOM is ready
                        setTimeout(() => {
                            // Use window.confirm for web compatibility
                            const shouldReconnect = window.confirm(
                                "🎮 Reconnexion\n\nVous avez une partie en cours. Voulez-vous la reprendre ?"
                            );

                            if (shouldReconnect) {
                                console.log(`User accepted reconnection to room: ${activeRoomId}`);
                                router.replace({ pathname: '/game/[id]', params: { id: activeRoomId, userId: user.uid } });
                            } else {
                                console.log('User declined reconnection');
                                router.replace('/home');
                            }
                        }, 100);
                        return;
                    } else {
                        console.log('❌ No active room found - proceeding to home');
                    }
                } catch (e) {
                    console.error("❌ Rejoin check failed:", e);
                }
            }

            router.replace('/home');
        } catch (error: any) {
            console.error(error);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async () => {
        setErrorMessage('');
        if (!email || !password) {
            setErrorMessage('Veuillez remplir tous les champs.');
            return;
        }
        if (password.length < 6) {
            setErrorMessage('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        setIsLoading(true);
        try {
            await authService.signUp(email, password);
            router.replace('/home');
        } catch (error: any) {
            console.error(error);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const renderLogo = () => (
        <View style={[styles.logoSection, isLandscape && styles.logoSectionLandscape]}>
            <Image
                source={require('@/assets/images/logo.png')}
                style={[styles.logoImage, isLandscape && styles.logoImageLandscape]}
                resizeMode="contain"
            />
        </View>
    );

    const renderForm = () => (
        <View style={[styles.formContainer, isLandscape && styles.formContainerLandscape]}>
            <Text style={styles.welcomeText}>Bienvenue</Text>

            <TouchableOpacity
                style={styles.guestButton}
                onPress={handleGuestLogin}
                disabled={isLoading}
            >
                <Text style={styles.guestButtonText}>Jouer en Invité</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>- ou -</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="Mot de passe"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={24}
                        color="rgba(255,255,255,0.7)"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.authButtonsRow}>
                <TouchableOpacity
                    style={styles.authButton}
                    onPress={handleSignIn}
                    disabled={isLoading}
                >
                    <Text style={styles.authButtonText}>Connexion</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.authButton, styles.signUpButton]}
                    onPress={handleSignUp}
                    disabled={isLoading}
                >
                    <Text style={styles.authButtonText}>Inscription</Text>
                </TouchableOpacity>
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            {isLoading && <ActivityIndicator color="#FFD700" style={{ marginTop: 10 }} />}
        </View>
    );

    return (
        <LinearGradient
            colors={['#2D1B4E', '#1A0E2E']}
            style={[styles.container, { minHeight: height }]}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.mainLayout, isLandscape && styles.mainLayoutLandscape]}>
                        {renderLogo()}
                        {renderForm()}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    mainLayout: {
        width: '100%',
        alignItems: 'center',
    },
    mainLayoutLandscape: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: 20,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoSectionLandscape: {
        flex: 1,
        marginBottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: 180,
        height: 180,
    },
    logoImageLandscape: {
        width: 250,
        height: 250,
    },
    formContainer: {
        width: '100%',
        maxWidth: 320,
        gap: 12,
    },
    formContainerLandscape: {
        flex: 1.2,
        maxWidth: 400,
    },
    welcomeText: {
        fontSize: 18,
        color: '#FFFFFF',
        opacity: 0.8,
        textAlign: 'center',
        marginBottom: 4,
    },
    guestButton: {
        width: '100%',
        height: 48,
        backgroundColor: '#FFD700',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    guestButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a0505',
    },
    orText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        textAlign: 'center',
        marginVertical: 2,
    },
    input: {
        width: '100%',
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    passwordContainer: {
        width: '100%',
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#FFFFFF',
    },
    eyeIcon: {
        padding: 10,
    },
    authButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
        marginTop: 4,
    },
    authButton: {
        flex: 1,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    signUpButton: {
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderColor: '#2196F3',
    },
    authButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    errorText: {
        color: '#FF5252',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 4,
    },
});
