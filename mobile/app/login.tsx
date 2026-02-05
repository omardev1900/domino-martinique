
import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../src/core/services/auth.service';

export default function LoginScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    /**
     * Map Firebase error codes to user-friendly French messages
     */
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
            await authService.signIn(email, password);
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
                        <Text style={styles.guestButtonText}>Jouer en Invité</Text>
                    </TouchableOpacity>

                    <Text style={styles.orText}>- ou -</Text>

                    {/* Email Input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                        textContentType="username"
                    />

                    {/* Password Input Container */}
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Mot de passe"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoComplete="password"
                            textContentType="password"
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

                    {/* Error Message Display */}
                    {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                    {isLoading && <ActivityIndicator color="#FFD700" style={{ marginTop: 10 }} />}
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
        marginBottom: 30,
        borderRadius: 2,
    },
    formContainer: {
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        gap: 16,
    },
    welcomeText: {
        fontSize: 20,
        color: '#FFFFFF',
        marginBottom: 6,
        opacity: 0.8,
    },
    guestButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#FFD700',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    guestButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0d1f0d',
    },
    orText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 14,
        marginVertical: 4,
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    passwordContainer: {
        width: '100%',
        height: 50,
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
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#FFFFFF',
    },
    eyeIcon: {
        padding: 10,
    },
    authButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginTop: 8,
    },
    authButton: {
        flex: 1,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    signUpButton: {
        backgroundColor: 'rgba(33, 150, 243, 0.3)',
        borderColor: '#2196F3',
    },
    authButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    errorText: {
        color: '#FF5252',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
        fontWeight: '500',
    },
});
