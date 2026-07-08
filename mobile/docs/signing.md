# Signature Android — Domino Martiniquais

> Document de maintenance. Ne contient aucun secret (mot de passe, chemin absolu).
> Les credentials sont stockés uniquement dans `~/.gradle/gradle.properties` (local).

---

## Informations de référence du keystore

| Champ | Valeur |
|---|---|
| **Nom du fichier** | `upload-keystore.jks` |
| **Type** | PKCS12 |
| **Alias** | `upload` |
| **Propriétaire** | CN=Omar SAGHIR, OU=IT, O=Omatrice, L=Casablanca, ST=Anfa, C=MA |
| **Émetteur** | CN=Omar SAGHIR, OU=IT, O=Omatrice, L=Casablanca, ST=Anfa, C=MA |
| **Numéro de série** | `1dcc2c063bf0bd68` |
| **Valide de** | 23 juin 2026 |
| **Valide jusqu'au** | 17 juin 2051 |
| **SHA-1** | `46:83:0A:FA:0B:80:E2:31:F4:29:59:08:D0:89:69:04:C9:93:13:D6` |
| **SHA-256** | `76:04:38:AC:8C:7B:E3:A4:7D:22:FF:54:55:F9:8B:AA:FB:BC:AD:49:FD:09:FF:06:12:A0:8D:CF:33:D3:66:A8` |

> [!IMPORTANT]
> Le fichier `upload-keystore.jks` n'est **pas dans git**. Il doit être conservé dans un lieu sûr (gestionnaire de mots de passe, coffre-fort, sauvegarde chiffrée) et **ne jamais être partagé**.

---

## Architecture de la solution

```
Credentials de signature
│
├── Build LOCAL
│   └── ~/.gradle/gradle.properties          ← Machine uniquement, jamais git
│       ├── UPLOAD_KEYSTORE_PATH=...
│       ├── UPLOAD_STORE_PASSWORD=...
│       ├── UPLOAD_KEY_ALIAS=upload
│       └── UPLOAD_KEY_PASSWORD=...
│
├── EAS Build / CI/CD
│   └── Variables d'environnement            ← Secrets GitHub Actions / EAS
│       ├── UPLOAD_KEYSTORE_PATH
│       ├── UPLOAD_STORE_PASSWORD
│       ├── UPLOAD_KEY_ALIAS
│       └── UPLOAD_KEY_PASSWORD
│
└── expo prebuild --clean
    └── plugins/withAndroidSigning.js        ← Dans git, SANS aucun secret
        └── Injecte la structure Groovy dans build.gradle automatiquement
```

---

## Configuration sur une nouvelle machine

### Étape 1 — Récupérer le keystore

Le fichier `upload-keystore.jks` doit être récupéré depuis :
- Votre gestionnaire de mots de passe (recommandé : Bitwarden, 1Password)
- Votre sauvegarde sécurisée personnelle

**Emplacement recommandé sur la nouvelle machine** :
```
C:\Users\<vous>\Documents\android-keys\upload-keystore.jks
```

> [!CAUTION]
> Ne copiez jamais le keystore dans le dossier du projet git.

### Étape 2 — Vérifier l'intégrité du keystore

```powershell
keytool -list -v -keystore C:\chemin\upload-keystore.jks -alias upload
```

Comparez l'empreinte **SHA-256** affichée avec la valeur de référence dans ce document.
Si elle ne correspond pas, le fichier est corrompu ou incorrect.

### Étape 3 — Configurer les credentials locaux

**Option A (recommandée) — Script interactif :**
```powershell
cd mobile
.\scripts\setup-signing.ps1
```

**Option B — Manuel :**

Créer ou éditer `C:\Users\<vous>\.gradle\gradle.properties` :

```properties
# Domino Martiniquais — Signature Android
UPLOAD_KEYSTORE_PATH=C:/Users/<vous>/Documents/android-keys/upload-keystore.jks
UPLOAD_STORE_PASSWORD=<mot_de_passe>
UPLOAD_KEY_ALIAS=upload
UPLOAD_KEY_PASSWORD=<mot_de_passe>
```

> [!WARNING]
> Utilisez des slashes `/` (pas `\`) dans `UPLOAD_KEYSTORE_PATH` — Gradle sur Windows requiert ce format.

### Étape 4 — Vérifier la configuration

```powershell
cd mobile
.\scripts\build-release.ps1
```

Le script effectue 7 vérifications avant de lancer le build.

---

## Générer un AAB pour le Play Store

```powershell
# Méthode 1 — Script sécurisé (recommandé)
cd mobile
.\scripts\build-release.ps1

# Méthode 2 — Gradle direct
cd mobile\android
.\gradlew bundleRelease

# Méthode 3 — Avec prebuild (après un clean)
cd mobile
.\scripts\build-release.ps1 -Prebuild
```

Le fichier AAB généré se trouve dans :
```
mobile\android\app\build\outputs\bundle\release\app-release.aab
```

---

## Après un `expo prebuild --clean`

Le dossier `android/` est entièrement régénéré. Le plugin `withAndroidSigning.js`
s'exécute automatiquement et réinjecte la `signingConfig release` dans `build.gradle`.

Les credentials restent dans `~/.gradle/gradle.properties` — ils ne sont pas affectés.

Aucune action manuelle n'est requise.

---

## Compatibilité EAS Build

Pour utiliser EAS Build (cloud), définissez les variables d'environnement dans
les secrets EAS ou les secrets GitHub Actions :

```
UPLOAD_KEYSTORE_PATH   # chemin dans l'environnement de build EAS
UPLOAD_STORE_PASSWORD
UPLOAD_KEY_ALIAS
UPLOAD_KEY_PASSWORD
```

`build.gradle` les lit en priorité par rapport aux propriétés Gradle.

Pour les credentials EAS en mode local (`credentialsSource: "local"`),
référez-vous à : https://docs.expo.dev/app-signing/local-credentials/

---

## Que faire si le keystore est perdu

1. **Le keystore upload est perdu** : Demandez une réinitialisation de la clé d'upload à Google Play via :
   Play Console → Paramètres de l'application → Intégrité de l'application → Demander une réinitialisation

2. **Générer un nouveau keystore** :
   ```powershell
   keytool -genkey -v -keystore upload-keystore.jks -alias upload `
     -keyalg RSA -keysize 4096 -validity 9125
   ```

3. **Exporter le certificat public** et l'envoyer à Google :
   ```powershell
   keytool -export -rfc -keystore upload-keystore.jks `
     -alias upload -file upload_certificate.pem
   ```

4. Mettre à jour `~/.gradle/gradle.properties` avec le nouveau chemin/credentials.

5. Mettre à jour les empreintes SHA-1 et SHA-256 dans ce fichier.

---

## Vérifier la signature d'un AAB

```powershell
# Vérification rapide
jarsigner -verify mobile\android\app\build\outputs\bundle\release\app-release.aab

# Vérification avec détail du certificat
keytool -printcert -jarfile mobile\android\app\build\outputs\bundle\release\app-release.aab
```

L'empreinte affichée doit correspondre au SHA-256 listé dans la section "Informations de référence".
