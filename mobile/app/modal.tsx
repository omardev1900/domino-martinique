import { Link, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authService } from '../src/core/services/auth.service';

export default function ModalScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    router.dismissAll(); // Close modal
    router.replace('/login'); // Redirect to login
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Paramètres</ThemedText>

      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Retour à l'accueil</ThemedText>
      </Link>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  link: {
    paddingVertical: 15,
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
