aides moi a adapter mon manifest pour etre accepté par gogole play dans le tests interne

E:\PROJETS\clients\domino_matrinique\mobile\android\app\src\main\AndroidManifest.xml
Je vais lire le manifest actuel.

Read E:\PROJETS\clients\domino_matrinique\mobile\android\app\src\main\AndroidManifest.xml
J'identifie plusieurs problèmes qui peuvent bloquer l'acceptation sur Google Play :

INTERNET et MODIFY_AUDIO_SETTINGS déclarés deux fois (doublons)
SYSTEM_ALERT_WINDOW — permission ultra-sensible (overlay sur d'autres apps), Google Play la refuse sans justification béton
WRITE_EXTERNAL_STORAGE — ignorée depuis Android 10 (API 29+), mais flag quand même un warning de sécurité
READ_EXTERNAL_STORAGE — dépréciée depuis Android 13, non justifiée pour un jeu de dominos
RECORD_AUDIO tools:node="remove" — la laisser même avec remove peut créer de la confusion, autant la supprimer
Voici le manifest corrigé :

Edit E:\PROJETS\clients\domino_matrinique\mobile\android\app\src\main\AndroidManifest.xml
Removed 4 lines
Vérifions le résultat final :

Read E:\PROJETS\clients\domino_matrinique\mobile\android\app\src\main\AndroidManifest.xml
Propre. Voici le récapitulatif de ce qui a été fait et pourquoi :

Permissions supprimées :

Permission	Raison
SYSTEM_ALERT_WINDOW	Permet de dessiner sur d'autres apps — Google Play exige une justification stricte, rejection quasi-garantie pour un jeu
READ_EXTERNAL_STORAGE	Dépréciée Android 13+, non nécessaire pour un jeu de dominos
WRITE_EXTERNAL_STORAGE	Ignorée depuis Android 10, non nécessaire
RECORD_AUDIO (avec tools:node="remove")	Supprimée complètement — si tu n'en as pas besoin, autant ne pas la mentionner du tout
Doublons INTERNET + MODIFY_AUDIO_SETTINGS	Nettoyés
Permissions conservées (toutes justifiables) :

INTERNET — Firebase / multijoueur
MODIFY_AUDIO_SETTINGS — gestion du volume in-app
VIBRATE — retour haptique sur le tour du joueur
Prochaine étape : Lance ton build EAS (eas build --platform android --profile production) avec ce manifest nettoyé avant de soumettre en test interne.

/model opus
gemini n'est aps d'accord avec toi et je ne sais pas si il a raison ou tort. voici son retour

Claude a tout à fait raison sur l'analyse technique, mais il y a une nuance cruciale concernant le micro.

En tant que senior dev, vous savez que les bibliothèques comme Expo ou React Native Video injectent automatiquement des permissions lors de la compilation (le "Manifest Merger"). Si vous supprimez simplement la ligne RECORD_AUDIO comme Claude le suggère, la bibliothèque la remettra sans vous demander votre avis, et Google Play bloquera à nouveau votre bundle.

Voici le manifeste final optimisé, en tenant compte des conseils de Claude et de la réalité technique de votre projet Domino :

XML
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"> 

    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>

    <uses-permission android:name="android.permission.RECORD_AUDIO" tools:node="remove" />

    <queries>
        <intent>
            <action android:name="android.intent.action.VIEW"/>
            <category android:name="android.intent.category.BROWSABLE"/>
            <data android:scheme="https"/>
        </intent>
    </queries>

    <application 
        android:name=".MainApplication" 
        android:label="@string/app_name" 
        android:icon="@mipmap/ic_launcher" 
        android:roundIcon="@mipmap/ic_launcher_round" 
        android:allowBackup="true" 
        android:theme="@style/AppTheme" 
        android:supportsRtl="true">
        
        </application>
</manifest>
Pourquoi mon avis diffère légèrement de celui de Claude ?
SYSTEM_ALERT_WINDOW : Claude a raison, supprimez-la. À moins que votre jeu de domino ne doive s'afficher par-dessus un appel téléphonique ou d'autres apps (ce qui serait très étrange), Google rejettera votre app à cause de cette permission.

RECORD_AUDIO : Contrairement à ce que dit Claude, ne la supprimez pas totalement. Laisser le tools:node="remove" est votre seule garantie que le micro ne sera pas réinjecté par une dépendance npm mal configurée. C'est une sécurité invisible pour vous.

Stockage (READ/WRITE) : Supprimées. Votre jeu utilisera le stockage interne privé, ce qui est bien plus performant et ne nécessite aucune déclaration sur le Store.

Prochaine étape immédiate
Enregistrez ce manifest nettoyé.

Relancez .\gradlew bundleRelease.

Allez sur la console dans la section Contenu de l'application pour remplir la déclaration Annonces et Cible et contenu pendant que ça compile.
Gemini a raison sur ce point, et j'ai eu tort. Laisse-moi vérifier dans ton projet pour confirmer :

Grep ""expo-av|expo-audio|react-native-video|react-native-voice" (in E:\PROJETS\clients\domino_matrinique\mobile\package.json)
2 lines of output
Confirmé : ton projet utilise expo-av et expo-audio. Les deux déclarent RECORD_AUDIO dans leur propre manifest. Sans tools:node="remove", le Manifest Merger va la réinjecter silencieusement dans ton bundle final → Google Play la détectera et demandera une justification micro pour un jeu de dominos.

Gemini a raison, je corrige mon erreur :

Edit E:\PROJETS\clients\domino_matrinique\mobile\android\app\src\main\AndroidManifest.xml
Added 3 lines
Le manifest est maintenant correct. Voici le résumé du débat avec Gemini :

Point	Mon analyse initiale	Gemini	Verdict
SYSTEM_ALERT_WINDOW	Supprimer	Supprimer	✅ D'accord
READ/WRITE_EXTERNAL_STORAGE	Supprimer	Supprimer	✅ D'accord
Doublons INTERNET/MODIFY_AUDIO_SETTINGS	Nettoyer	(non mentionné)	✅ OK
RECORD_AUDIO tools:node="remove"	Supprimer totalement	Garder avec remove	❌ Gemini a raison
Pourquoi j'avais tort sur RECORD_AUDIO :

Le Manifest Merger d'Android fusionne automatiquement les manifests de toutes tes dépendances au build. expo-av et expo-audio (tous deux dans ton package.json) déclarent RECORD_AUDIO dans leur propre manifest. Sans la directive tools:node="remove", cette permission est réinjectée dans ton APK/AAB final, et Google Play la verra — sans justification micro, rejet.

La ligne tools:node="remove" n'ajoute pas la permission : elle dit au merger "même si une dépendance la déclare, retire-la du manifest final". C'est exactement l'usage prévu.

Pour vérifier après ton bundleRelease, tu peux inspecter le manifest final fusionné :


mobile/android/app/build/outputs/logs/manifest-merger-release-report.txt
Tu y verras la liste des permissions injectées par chaque dépendance et confirmeras que RECORD_AUDIO est bien "Rejected" par ta règle.

voici un manifest proposé par gemini qui le considdère comme blidé. dit moi ce que tu en epsnes :

<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"> 

  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
  <uses-permission android:name="android.permission.VIBRATE"/>
  
  <uses-permission android:name="android.permission.RECORD_AUDIO" tools:node="remove" />

  <queries>
    <intent>
      <action android:name="android.intent.action.VIEW"/>
      <category android:name="android.intent.category.BROWSABLE"/>
      <data android:scheme="https"/>
    </intent>
  </queries>

  <application 
    android:name=".MainApplication" 
    android:label="@string/app_name" 
    android:icon="@mipmap/ic_launcher" 
    android:roundIcon="@mipmap/ic_launcher_round" 
    android:allowBackup="true" 
    android:theme="@style/AppTheme" 
    android:supportsRtl="true">
    
    </application>
</manifest>
Non, ce manifest n'est pas "blindé" — il est cassé. Gemini a vidé tout le contenu de <application>, ce qui rend l'app non fonctionnelle. Si tu l'appliques tel quel :

Ce qui est CORRECT dans sa proposition
Les 3 permissions essentielles ✓
RECORD_AUDIO avec tools:node="remove" ✓
<queries> https ✓
Ce qui est SUPPRIMÉ et qui casse tout
Élément supprimé	Conséquence
<activity android:name=".MainActivity">	L'app ne se lance pas — aucun point d'entrée
Intent filter MAIN + LAUNCHER	Aucune icône dans le tiroir d'applis
android:screenOrientation="landscape"	Le jeu tournerait en portrait (UI conçue pour paysage)
Intent filter domino-martinique://	Deep links legacy cassés
Intent filter https://domino-martinique.online/join + autoVerify="true"	Universal Links WhatsApp Android cassés (tu viens de livrer R2-T1 hier — v2.3)
meta-data expo.modules.updates.*	Expo Updates non configuré
android:enableOnBackInvokedCallback="false"	Comportement back button non prévisible sur Android 13+
android:configChanges=...	Rotation/resize → Activity se relance (perte d'état de partie)
android:launchMode="singleTask"	Deep links peuvent créer des instances dupliquées
Verdict
Gemini avait raison sur RECORD_AUDIO, mais il a clairement copié-collé un squelette de manifest générique en effaçant tout le reste. Le fait qu'il t'envoie <application>...</application> vide devrait être un gros red flag.

Ton manifest actuel (celui qu'on a nettoyé ensemble) est déjà correct. Il a :

Les permissions propres (nettoyées)
RECORD_AUDIO avec tools:node="remove" (corrigé après le retour Gemini)
L'activity complète avec orientation landscape
Les deep links (custom scheme + Universal Links)
Les meta-data Expo Updates
Ne touche plus à ton manifest. Lance ton bundleRelease directement avec ce qui est déjà en place. Si tu veux absolument un "diff" à voir, je peux te relire le fichier actuel ligne par ligne pour validation finale.

je veux exclusre les non smartphones de mon applicaiton mobile. gemini m'a proopsé d'ajouetr directemtn ce code :
<supports-screens 
    android:smallScreens="true" 
    android:normalScreens="true" 
    android:largeScreens="false" 
    android:xlargeScreens="false" 
    android:requiresSmallestWidthDp="320" />

tu en penses quoi?
Non, c'est une mauvaise solution. Gemini utilise un élément déprécié depuis Android 2.3 (API 9) qui ne fait pas ce que tu crois.

Pourquoi <supports-screens> ne t'exclut PAS des tablettes
<supports-screens> est deprecated — Google le mentionne explicitement dans la doc officielle.
Ça ne filtre PAS le Play Store : ta tablette peut toujours installer l'app.
largeScreens="false" active le "screen compatibility mode" → ton jeu s'affiche en mode zoomé/pixelisé sur tablette (comme les vieilles apps iPhone sur iPad). UX dégradée, pas exclusion.
requiresSmallestWidthDp="320" veut dire "au moins 320dp" — toutes les tablettes passent ce seuil.
La VRAIE solution : Play Console, pas manifest
Google Play Console → Release → [Ton app] → Production → Advanced settings → Device catalog

Tu peux exclure explicitement par catégorie :

✅ Exclure les tablettes (par Form factor: Tablet)
✅ Exclure les Chromebooks
✅ Exclure Android TV
✅ Exclure Wear OS / Automotive
C'est la méthode officielle recommandée par Google, tu gardes un manifest propre, et tu peux changer d'avis plus tard sans rebuild.

Complément manifest optionnel (défensif)
Si tu veux renforcer au niveau manifest contre TV/Wear/Auto (qui pourraient passer outre le Device Catalog), ajoute plutôt :


<uses-feature android:name="android.hardware.touchscreen" android:required="true"/>
<uses-feature android:name="android.software.leanback" android:required="false"/>
<uses-feature android:name="android.hardware.type.watch" android:required="false"/>
<uses-feature android:name="android.hardware.type.automotive" android:required="false"/>
touchscreen required="true" exclut Android TV (télécommande) et certains Chromebooks sans écran tactile. Les required="false" signalent à Play Store "ce n'est pas une app TV/Wear/Auto".

Verdict
Proposition	Verdict
<supports-screens> de Gemini	❌ Déprécié + ne fait pas le job
Device Catalog dans Play Console	✅ La bonne méthode
<uses-feature touchscreen required="true">	✅ Utile en complément
Mon conseil : ne touche pas au manifest pour ça. Gère l'exclusion depuis la Play Console après le premier upload du bundle — tu verras l'option "Managed devices" apparaître. C'est deux clics et réversible.

Tu veux que je t'ajoute quand même les <uses-feature> défensifs au manifest ?

J'ai déployé en Test Interne. Le jeu se lance, mais j'ai deux crashs de type TypeError: Cannot read property 'hostname' of undefined :

Quand je clique sur le profil.

Quand je quitte une partie solo.
Peux-tu scanner le projet pour trouver où l'API URL ou .hostname est utilisée sans protection sur des variables potentiellement undefined ?
Je vais chercher où .hostname est utilisé dans le projet mobile.

Grep "\.hostname" (in E:\PROJETS\clients\domino_matrinique\mobile, glob: !node_modules/**)
6 lines of output
Grep "new URL\(" (in E:\PROJETS\clients\domino_matrinique\mobile, glob: !node_modules/**)
3 lines of output
Grep "window\.location" (in E:\PROJETS\clients\domino_matrinique\mobile, glob: !node_modules/**)
2 lines of output
Trouvé deux coupables probables. Je vais vérifier chacun pour confirmer.

Read E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx (lines 301-325)
Read E:\PROJETS\clients\domino_matrinique\mobile\src\core\avatars.ts
Crash #1 confirmé. Pour le crash #2 (quitter solo), le try/catch dans avatars.ts devrait le catcher — donc c'est probablement ailleurs. Je vais chercher plus largement.

Grep "location\.(hostname|host|origin|href)|document\.location|URL\.parse" (in E:\PROJETS\clients\domino_matrinique\mobile, glob: !node_modules/**)
2 lines of output
Grep "typeof window" (in E:\PROJETS\clients\domino_matrinique\mobile, glob: !node_modules/**)
7 lines of output
Je cherche plus largement pour le crash "quitter partie solo" — le try/catch dans avatars.ts devrait le catcher, donc c'est ailleurs.

Grep "process\.env\.\w*URL|EXPO_PUBLIC_\w*URL|apiUrl|API_URL" (in E:\PROJETS\clients\domino_matrinique\mobile, glob: !node_modules/**)
1 line of output
Grep "new URL\(|URL\(" (in E:\PROJETS\clients\domino_matrinique\mobile, glob: !node_modules/**)
6 lines of output
Grep "connectFunctionsEmulator|connectFirestoreEmulator|connectAuthEmulator" (in E:\PROJETS\clients\domino_matrinique\mobile, glob: !node_modules/**)
3 lines of output
Je vérifie aussi le flow de quit solo pour voir quoi se passe au unmount.

Grep "hostname" (in E:\PROJETS\clients\domino_matrinique\mobile\src)
2 lines of output
Grep "getAvatarImage|\.avatar(Id|URL|Url)" (in E:\PROJETS\clients\domino_matrinique\mobile\src\components)
6 lines of output
Le seul .hostname applicatif du crash #2 est dans avatars.ts:55, déjà protégé par un try/catch — donc c'est ailleurs. Je vais corriger le #1 confirmé et renforcer le #2 préventivement, puis il me faudra la stack trace pour trancher.

Crash #1 confirmé — profile.tsx:308
Le bug est clair : sur React Native Android, typeof window peut retourner 'object' (polyfill partiel), mais window.location n'existe pas → lecture de .hostname sur undefined.

Read E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx (lines 2-31)
Je corrige avec un garde Platform.OS === 'web' et optional chaining :

Edit E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx
Modified
Crash #2 — pas de coupable évident dans le code applicatif
Le seul .hostname actif est avatars.ts:55, et il est déjà protégé par un try/catch qui englobe à la fois new URL() et url.hostname.endsWith(). Le crash "quitter solo" vient probablement :

d'un polyfill URL manquant au runtime (très courant sur RN + Hermes si react-native-url-polyfill/auto n'est pas importé quelque part tôt)
ou d'une lib tierce appelée pendant le teardown de la partie solo (Firebase, expo-linking, expo-notifications…)
Je vérifie si le polyfill URL est bien chargé :

Grep "react-native-url-polyfill" (in E:\PROJETS\clients\domino_matrinique\mobile, glob: !node_modules/**)
1 line of output
Grep "url-polyfill|URL.*polyfill" (in E:\PROJETS\clients\domino_matrinique\mobile\package.json)
1 line of output
Voilà la cause racine probable du crash #2 : aucun polyfill URL n'est installé. Or l'appli utilise new URL() et sur React Native + Hermes (Expo SDK 51+), l'objet URL natif est incomplet sur Android — new URL("https://...") peut retourner un objet avec hostname undefined, ou même undefined directement.

Quand tu quittes une partie solo, le flow recordMatchResult → processMatchReward fait des appels Firebase, et Firebase SDK utilise new URL() en interne pour valider ses endpoints → crash.

Solution recommandée
Installer et importer react-native-url-polyfill au tout début de l'app :


cd mobile
npx expo install react-native-url-polyfill
Puis dans mobile/index.js ou mobile/app/_layout.tsx, première ligne (avant tout autre import) :


import 'react-native-url-polyfill/auto';
L'import /auto patche immédiatement le global URL avec une implémentation complète. C'est la solution officielle recommandée par Expo et Firebase pour les apps RN.

Défense supplémentaire dans avatars.ts
Pendant qu'on y est, je renforce ce fichier avec de l'optional chaining au cas où :

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\core\avatars.ts
Added 1 line
Récap
#	Fichier	Cause	Correction
1	profile.tsx:308	window.location undefined sur Android natif	✅ Ajout Platform.OS === 'web' + optional chaining
2	Global (polyfill URL absent)	new URL() incomplet sur Hermes Android → Firebase SDK crash au teardown solo	⚠️ À faire : installer + importer react-native-url-polyfill/auto
2bis	avatars.ts:55	Défense préventive	✅ Optional chaining sur hostname
Action utilisateur requise
Lance les commandes suivantes :


cd mobile
npx expo install react-native-url-polyfill
Puis ouvre mobile/index.js (ou le point d'entrée — généralement géré par Expo Router) et ajoute en toute première ligne :


import 'react-native-url-polyfill/auto';
Si le point d'entrée est géré par Expo Router (pas de index.js manuel), mets l'import en première ligne de mobile/app/_layout.tsx.

Veux-tu que je fasse l'ajout de l'import moi-même ? Si oui, dis-moi quel fichier est ton vrai point d'entrée (vérifier package.json → "main") et je l'insère.


image.png
1600×720
clude, je rencontre quelques erreurs avec mon apk telechargé.
1- impossible de modifier puis sauvegarder le profio (nom ou avatar) depuis le lien issu de son image  avatar du menu latéral. mais on peut le modifier depuis les réglages.

le changement de l'image du profil ne focntionne pas, m^me en version web ça bloque et je vois cette erreur :
E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134 ❌ [ERROR][AuthService] Sign In Error: FirebaseError: Firebase: Error (auth/invalid-credential).
    at createErrorInternal (E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@firebase\auth\dist\esm\index-36fcbc82.js:509:41)
    at _fail (E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@firebase\auth\dist\esm\index-36fcbc82.js:474:11)
    at _performFetchWithErrorHandling (E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@firebase\auth\dist\esm\index-36fcbc82.js:971:17)
    at async _performSignInRequest (E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@firebase\auth\dist\esm\index-36fcbc82.js:986:28)
    at async _signInWithCredential (E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@firebase\auth\dist\esm\index-36fcbc82.js:5839:22)
    at async AuthService.signIn (E:\PROJETS\clients\domino_matrinique\mobile\src\core\services\auth.service.ts:69:36)
    at async handleAuthAction (E:\PROJETS\clients\domino_matrinique\mobile\app\login.tsx:127:30)
registerError @ E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134
E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134 FirebaseError: Firebase: Error (auth/invalid-credential).
    at createErrorInternal (E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@firebase\auth\dist\esm\index-36fcbc82.js:509:41)
    at _fail (E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@firebase\auth\dist\esm\index-36fcbc82.js:474:11)
    at _performFetchWithErrorHandling (E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@firebase\auth\dist\esm\index-36fcbc82.js:971:17)
    at async _performSignInRequest (E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@firebase\auth\dist\esm\index-36fcbc82.js:986:28)
    at async _signInWithCredential (E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@firebase\auth\dist\esm\index-36fcbc82.js:5839:22)
    at async AuthService.signIn (E:\PROJETS\clients\domino_matrinique\mobile\src\core\services\auth.service.ts:69:36)
    at async handleAuthAction (E:\PROJETS\clients\domino_matrinique\mobile\app\login.tsx:127:30)
registerError @ E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134
firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?VER=8&database=projects%2Fdomino-martinique-v1%2Fdatabases%2F(default)&gsessionid=xYnBpLBQLQLeN5NM5FESZ1wABp1k19Sdy9PKSHa8WkehAv9pr4YCxA&SID=ibD_PAETIsVl_ElVeXpfQw&RID=47491&TYPE=terminate&zx=42t7g7ao9baf:1  Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134 ❌ [ERROR][AdBannerModal] video error: undefined
registerError @ E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134
E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134 [Profile] Error auto-saving avatar: Error: Seuls les lettres, chiffres et espaces sont autorisés
    at AuthService.updateProfile (E:\PROJETS\clients\domino_matrinique\mobile\src\core\services\auth.service.ts:218:44)
    at async handleAvatarSelect (E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx:142:13)
registerError @ E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134
E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134 [Profile] Error saving profile: Error: Seuls les lettres, chiffres et espaces sont autorisés
    at AuthService.updateProfile (E:\PROJETS\clients\domino_matrinique\mobile\src\core\services\auth.service.ts:218:44)
    at async handleSave (E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx:117:13)
registerError @ E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134
E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134 [Profile] Error auto-saving avatar: Error: Seuls les lettres, chiffres et espaces sont autorisés
    at AuthService.updateProfile (E:\PROJETS\clients\domino_matrinique\mobile\src\core\services\auth.service.ts:218:44)
    at async handleAvatarSelect (E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx:142:13)
registerError @ E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134
9E:\PROJETS\clients\domino_matrinique\mobile\node_modules\@expo\metro-runtime\src\error-overlay\LogBox.web.ts:134 [Profile] Error saving profile: Error: Seuls les lettres, chiffres et espaces sont autorisés
    at AuthService.updateProfile (E:\PROJETS\clients\domino_matrinique\mobile\src\core\services\auth.service.ts:218:44)
    at async handleSave (E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx:117:13)

on peut par exemple, rendre l'icone du barre menu lateréal en lecture seule et si il clique sur modifier, on le redirige vers parametres , non ?

2- affichage des infos de lige des cochons très moche. le contenu est forcé pour ete visible en hauteur mais il est complétement compressé (regarde la capture). tu peux a'aérer quite a scroller) ou proposes une eilleure disposition
Deux bugs distincts. Je lis les fichiers concernés pour comprendre la cause.

Read E:\PROJETS\clients\domino_matrinique\mobile\src\core\services\auth.service.ts (lines 181-240)
Read E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx (lines 101-160)
Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\LeagueInfoModal.tsx
Je vais trouver le schema de validation du pseudo pour comprendre la regex bloquante.

Grep "playerNameSchema" (in E:\PROJETS\clients\domino_matrinique\mobile\src)
3 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\src\core\validation\schemas.ts (lines 2-41)
J'ai les deux causes. Je les corrige.

Bug 1 — Regex trop stricte
La regex ^[a-zA-Z0-9À-ÿ\s]+$ bloque apostrophes ('), tirets (-), underscores (_), points (.). Si le displayName Firebase (notamment via Google Sign-In ou déjà saisi) contient un de ces caractères, tout appel à updateProfile échoue, y compris un simple changement d'avatar (parce que handleAvatarSelect envoie aussi le displayName existant pour validation).

Ta suggestion UX (sidebar en lecture seule → redirect Réglages) ne règle pas le fond : depuis les Réglages, le bug serait identique pour les users dont le nom actuel contient ces caractères. La vraie fix = assouplir la regex.

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\core\validation\schemas.ts
Modified
Défense supplémentaire côté handleAvatarSelect : ne renvoyer displayName que s'il est valide, pour éviter qu'un nom historiquement stocké (venant d'avant la validation, ou d'un SSO) bloque le changement d'avatar :

Edit E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx
Removed 1 line
Bug 2 — Layout Ligue compressé
La cause : flex: 1 empilés dans une hauteur paysage trop courte — le contenu des badges se fait écraser jusqu'à disparaître. Je refactor pour donner des hauteurs naturelles aux cartes et ajouter un scroll si nécessaire.

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\LeagueInfoModal.tsx
Added 4 lines
Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\LeagueInfoModal.tsx
Modified
Maintenant je retire les flex: 1 qui écrasaient le contenu et donne des dimensions naturelles/minimales :

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\LeagueInfoModal.tsx
Added 3 lines
Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\LeagueInfoModal.tsx
Added 2 lines
Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\LeagueInfoModal.tsx
Modified
Récap des corrections
Bug	Fichier	Correction
1. Save profile bloqué	schemas.ts:14	Regex étendue : accepte ' ’ - _ . en plus des lettres/chiffres/espaces
1. Avatar auto-save KO	profile.tsx:137	handleAvatarSelect n'envoie plus le displayName — pas de revalidation du nom existant
2. Ligue compressée	LeagueInfoModal.tsx	<View> → <ScrollView>, flex: 1 remplacé par minHeight sur groupCard, subBadge, eliteCard
Concernant ta proposition UX "sidebar en lecture seule"
Ne l'applique pas. Ça déplace le problème sans le régler : les Réglages auraient eu le même bug pour les users avec un nom historique non conforme. Le fix de regex est la vraie solution — elle débloque toutes les entrées du profil en même temps.

Note sur les erreurs secondaires que tu as envoyées
Ces deux lignes de log ne sont pas liées aux bugs traités :

auth/invalid-credential → tentative de login avec mauvais mot de passe ou compte inexistant. Comportement normal, géré ailleurs.
ERR_BLOCKED_BY_CLIENT sur Firestore → un AdBlock / extension navigateur bloque Firestore (seulement en web, pas en APK). Rien à corriger côté code.
AdBannerModal video error: undefined → fallback image qui joue son rôle (déjà livré dans v2.3).
Prochaine étape : rebuild APK + re-test. Si tu veux, je peux aussi vérifier que sidebar.tsx n'a pas un comportement douteux sur le clic avatar (ouvre bien /profile et pas un flow différent des Réglages).

ok, avant de tester, on va améliorer le UI UX après la validation de la barre latérale par le client .
On va simplifier la navigation en supprimant les fléches et titres qui apparaissent dans les différents écran. apportes ces changements :

- enleves l'icone home dans l'ecran du profile. et enleves le bouton enregistrer
- dans jouer, mets choisir un mode au centre et remplace la croix X par une fleche retour et place la a gauche de l'ecran
- dans ligues des cochons enleves la fleche retour et l'icone cochon et placer le titre et e niveau au centre de l'ecran
- dans Ranks, enleves la fleche et le titre Classement geneal
- dans stats enleves la fleche et le titre STATISTIQUES
- dans boutiques, enleves l'icone home et le titre BOUTIQUE
- dans vestiaire, enleves l'icone home et le titre vestiaire
- l'icone profil du menu latéral renvt au même endroit que l'icone avatar. Supprimes complèteent l'icone Profil
Je vais commencer par identifier tous les fichiers concernés, puis trier les modifications.

Globpattern: "mobile/app/**/*.{tsx,ts}"
Found 22 files
Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\Sidebar.tsx
Update Todos

profile.tsx : retirer icône home + bouton Enregistrer

game-modes.tsx : centrer titre, X → flèche retour gauche

LeagueInfoModal : retirer flèche, icône cochon, centrer titre + grade

leaderboard.tsx : retirer flèche + titre Classement général

stats.tsx : retirer flèche + titre STATISTIQUES

store.tsx : retirer icône home + titre BOUTIQUE

collection.tsx : retirer icône home + titre VESTIAIRE

Sidebar.tsx : retirer item Profil (avatar seul)
Read E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx (lines 291-370)
Grep "handleSave|Enregistrer|saveButton|Button.*save" (in E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx)
8 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx (lines 256-295)
Grep "renderFormControls|homeHeader" (in E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx)
4 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx (lines 381-395)
Je retire le header home + bouton Enregistrer. Je garde le bouton Debug Ligue en DEV ailleurs sur la page.

Edit E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx
Removed 19 lines
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx
Added 3 lines
Je nettoie la fonction renderFormControls devenue morte, et handleSave si plus utilisée.

Grep "handleSave|renderFormControls" (in E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx)
3 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx (lines 108-142)
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx
Removed 30 lines
Read E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx (lines 231-260)
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx
Removed 23 lines
Update Todos

profile.tsx : retirer icône home + bouton Enregistrer

game-modes.tsx : centrer titre, X → flèche retour gauche

LeagueInfoModal : retirer flèche, icône cochon, centrer titre + grade

leaderboard.tsx : retirer flèche + titre Classement général

stats.tsx : retirer flèche + titre STATISTIQUES

store.tsx : retirer icône home + titre BOUTIQUE

collection.tsx : retirer icône home + titre VESTIAIRE

Sidebar.tsx : retirer item Profil (avatar seul)
Read E:\PROJETS\clients\domino_matrinique\mobile\app\game-modes.tsx
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\game-modes.tsx
Added 1 line
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\game-modes.tsx
Modified
Update Todos

profile.tsx : retirer icône home + bouton Enregistrer

game-modes.tsx : centrer titre, X → flèche retour gauche

LeagueInfoModal : retirer flèche, icône cochon, centrer titre + grade

leaderboard.tsx : retirer flèche + titre Classement général

stats.tsx : retirer flèche + titre STATISTIQUES

store.tsx : retirer icône home + titre BOUTIQUE

collection.tsx : retirer icône home + titre VESTIAIRE

Sidebar.tsx : retirer item Profil (avatar seul)
Read E:\PROJETS\clients\domino_matrinique\mobile\app\ligue-cochons.tsx
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\ligue-cochons.tsx
Modified
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\ligue-cochons.tsx
Removed 1 line
Update Todos

profile.tsx : retirer icône home + bouton Enregistrer

game-modes.tsx : centrer titre, X → flèche retour gauche

LeagueInfoModal : retirer flèche, icône cochon, centrer titre + grade

leaderboard.tsx : retirer flèche + titre Classement général

stats.tsx : retirer flèche + titre STATISTIQUES

store.tsx : retirer icône home + titre BOUTIQUE

collection.tsx : retirer icône home + titre VESTIAIRE

Sidebar.tsx : retirer item Profil (avatar seul)
Grep "arrow-back|Classement|CLASSEMENT" (in E:\PROJETS\clients\domino_matrinique\mobile\app\leaderboard.tsx)
2 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\leaderboard.tsx (lines 216-270)
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\leaderboard.tsx
Removed 13 lines
Grep "^import|tabsContainer:|StatusBar" (in E:\PROJETS\clients\domino_matrinique\mobile\app\leaderboard.tsx)
15 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\leaderboard.tsx (lines 269-288)
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\leaderboard.tsx
Added 2 lines
Update Todos

profile.tsx : retirer icône home + bouton Enregistrer

game-modes.tsx : centrer titre, X → flèche retour gauche

LeagueInfoModal : retirer flèche, icône cochon, centrer titre + grade

leaderboard.tsx : retirer flèche + titre Classement général

stats.tsx : retirer flèche + titre STATISTIQUES

store.tsx : retirer icône home + titre BOUTIQUE

collection.tsx : retirer icône home + titre VESTIAIRE

Sidebar.tsx : retirer item Profil (avatar seul)
Grep "arrow-back|STATISTIQUES|Statistiques|headerShown" (in E:\PROJETS\clients\domino_matrinique\mobile\app\stats.tsx)
1 line of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\stats.tsx (lines 101-150)
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\stats.tsx
Removed 10 lines
Grep "header:|headerTitle:|backButton:|backButtonText:|historyButton:" (in E:\PROJETS\clients\domino_matrinique\mobile\app\stats.tsx)
5 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\stats.tsx (lines 281-325)
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\stats.tsx
Modified
Update Todos

profile.tsx : retirer icône home + bouton Enregistrer

game-modes.tsx : centrer titre, X → flèche retour gauche

LeagueInfoModal : retirer flèche, icône cochon, centrer titre + grade

leaderboard.tsx : retirer flèche + titre Classement général

stats.tsx : retirer flèche + titre STATISTIQUES

store.tsx : retirer icône home + titre BOUTIQUE

collection.tsx : retirer icône home + titre VESTIAIRE

Sidebar.tsx : retirer item Profil (avatar seul)
Grep "name=.home.|BOUTIQUE|Boutique|headerShown|arrow-back" (in E:\PROJETS\clients\domino_matrinique\mobile\app\store.tsx)
2 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\store.tsx (lines 246-285)
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\store.tsx
Removed 5 lines
Update Todos

profile.tsx : retirer icône home + bouton Enregistrer

game-modes.tsx : centrer titre, X → flèche retour gauche

LeagueInfoModal : retirer flèche, icône cochon, centrer titre + grade

leaderboard.tsx : retirer flèche + titre Classement général

stats.tsx : retirer flèche + titre STATISTIQUES

store.tsx : retirer icône home + titre BOUTIQUE

collection.tsx : retirer icône home + titre VESTIAIRE

Sidebar.tsx : retirer item Profil (avatar seul)
Grep "name=.home.|VESTIAIRE|Vestiaire|headerShown|arrow-back" (in E:\PROJETS\clients\domino_matrinique\mobile\app\collection.tsx)
2 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\collection.tsx (lines 186-215)
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\collection.tsx
Removed 5 lines
Update Todos

profile.tsx : retirer icône home + bouton Enregistrer

game-modes.tsx : centrer titre, X → flèche retour gauche

LeagueInfoModal : retirer flèche, icône cochon, centrer titre + grade

leaderboard.tsx : retirer flèche + titre Classement général

stats.tsx : retirer flèche + titre STATISTIQUES

store.tsx : retirer icône home + titre BOUTIQUE

collection.tsx : retirer icône home + titre VESTIAIRE

Sidebar.tsx : retirer item Profil (avatar seul)
Maintenant la Sidebar : retirer l'item "Profil". L'avatar cliquable (top) route déjà vers /profile (ligne 113 du fichier Sidebar.tsx lu précédemment), donc on retire juste l'entrée Profil de NAV_ITEMS.

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\Sidebar.tsx
Removed 1 line
Update Todos

profile.tsx : retirer icône home + bouton Enregistrer

game-modes.tsx : centrer titre, X → flèche retour gauche

LeagueInfoModal : retirer flèche, icône cochon, centrer titre + grade

leaderboard.tsx : retirer flèche + titre Classement général

stats.tsx : retirer flèche + titre STATISTIQUES

store.tsx : retirer icône home + titre BOUTIQUE

collection.tsx : retirer icône home + titre VESTIAIRE

Sidebar.tsx : retirer item Profil (avatar seul)
Tout est fait. Récap :

#	Écran	Modification
1	profile.tsx	Supprimé header home + bouton Enregistrer (+ fonctions handleSave et renderFormControls devenues mortes). Sauvegarde reste auto sur blur du champ pseudo et sur sélection d'avatar.
2	game-modes.tsx	X → flèche retour à gauche, titre CHOISIR UN MODE centré (structure [←][titre][spacer])
3	ligue-cochons.tsx	Retiré flèche retour et 🐷. Ligue des Cochons + sous-titre Niveau Boucher centrés
4	leaderboard.tsx	Retiré Stack.Screen entier (flèche + "Classement Général") + padding-top compensatoire sur les onglets
5	stats.tsx	Retiré bouton ← Retour et titre Statistiques. Bouton 🕒 historique conservé à droite
6	store.tsx	Retiré icône home + titre BOUTIQUE
7	collection.tsx	Retiré icône home + titre VESTIAIRE
8	Sidebar.tsx	Retiré item Profil de NAV_ITEMS. L'avatar cliquable en haut de la sidebar renvoie déjà vers /profile (ligne 113 inchangée)
Note légère : sur store.tsx et collection.tsx, certains styles (backButton, headerTitle) ne sont plus utilisés mais pas supprimés — ce sont des styles orphelins sans impact. Je peux les nettoyer si tu veux, sinon on laisse pour éviter de toucher 2 fichiers supplémentaires avant test.

quelques modif de plus :
Dans Parmètres, retire l'onglet THEM.

Modifier le bloc qui indique le grade du jueur dans la ligue des cochons pour affiher le nom du grade avec l'icone ou image du grade un peu plus grand, le nombre des cochons du joueur, le prochain grade et l'icone (i) pour afficher le modal ligue des cochons.

dans ce modal, reorganiser les onglets : classement des onglets :
Ma ligue, Classement et enfin Infos
Update Todos

Paramètres : retirer onglet Thème

Refonte bloc grade joueur dans ligue-cochons (icône + cochons + prochain grade + (i))

LeagueInfoModal : réordonner onglets Ma Ligue → Classement → Infos
Grep "THEME|THÈME|Thème|THEM|theme|Theme" (in E:\PROJETS\clients\domino_matrinique\mobile\app\modal.tsx)
50 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\modal.tsx (lines 181-205)
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\modal.tsx
Removed 3 lines
Read E:\PROJETS\clients\domino_matrinique\mobile\app\modal.tsx (lines 316-355)
Edit E:\PROJETS\clients\domino_matrinique\mobile\app\modal.tsx
Removed 28 lines
Maintenant je nettoie le type activeTab (plus de 'theme') :

Edit E:\PROJETS\clients\domino_matrinique\mobile\app\modal.tsx
Modified
Update Todos

Paramètres : retirer onglet Thème

Refonte bloc grade joueur dans ligue-cochons (icône + cochons + prochain grade + (i))

LeagueInfoModal : réordonner onglets Ma Ligue → Classement → Infos
Je cherche où est le bloc actuel affichant le grade du joueur.

Grep "leagueGrade|LEAGUE_LABELS\[|LEAGUE_ICONS\[|cochonsGiven" (in E:\PROJETS\clients\domino_matrinique\mobile\app\home.tsx)
4 lines of output
Grep "renderLeagueBlock" (in E:\PROJETS\clients\domino_matrinique\mobile\app\profile.tsx)
2 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\home.tsx (lines 331-370)
Globpattern: "**/LeagueProgressWidget*"
Found 1 file
Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\LeagueProgressWidget.tsx
Je refais le LeagueProgressWidget avec la nouvelle disposition :

Write E:\PROJETS\clients\domino_matrinique\mobile\src\components\LeagueProgressWidget.tsx
226 lines
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    LEAGUE_FRAME_THRESHOLDS,
    LEAGUE_LABELS,
    LEAGUE_ICONS,
    LEAGUE_GRADE_COLORS,
    LEAGUE_GRADE_ORDER,
} from '../core/economy.constants';
import { getLeagueGrade } from '../core/RewardEngine';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface LeagueProgressWidgetProps {
    points: number;
    onInfoPress?: () => void;
    style?: any;
}

export const LeagueProgressWidget: React.FC<LeagueProgressWidgetProps> = ({ points, onInfoPress, style }) => {
    const currentGrade = useMemo(() => getLeagueGrade(points), [points]);

    // Prochain grade (null si déjà au max)
    const nextGrade = useMemo(() => {
        if (!currentGrade) return LEAGUE_GRADE_ORDER[0];
        const idx = LEAGUE_GRADE_ORDER.indexOf(currentGrade);
        return idx < LEAGUE_GRADE_ORDER.length - 1 ? LEAGUE_GRADE_ORDER[idx + 1] : null;
    }, [currentGrade]);

    const currentThreshold = currentGrade ? LEAGUE_FRAME_THRESHOLDS[currentGrade] : 0;
    const nextThreshold = nextGrade ? LEAGUE_FRAME_THRESHOLDS[nextGrade] : null;

    const gradeColor = currentGrade ? LEAGUE_GRADE_COLORS[currentGrade] : '#888';
    const gradeIcon = currentGrade ? LEAGUE_ICONS[currentGrade] : '🔰';
    const gradeLabel = currentGrade ? LEAGUE_LABELS[currentGrade] : 'Sans grade';

    const progressPct = nextThreshold
        ? Math.min(1, (points - currentThreshold) / Math.max(1, nextThreshold - currentThreshold))
        : 1;

    return (
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={[styles.container, style]}>
            <LinearGradient colors={['#0A1938', '#010619']} style={[styles.card, { borderColor: `${gradeColor}55` }]}>

                {/* Ligne 1 : icône + nom du grade (à gauche) + bouton (i) (à droite) */}
                <View style={styles.headerRow}>
                    <View style={styles.gradeIdentity}>
                        <Text style={styles.gradeIcon}>{gradeIcon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.gradeLabelLine}>Mon grade</Text>
                            <Text style={[styles.gradeName, { color: gradeColor }]} numberOfLines={1}>
                                {gradeLabel}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.infoButton}
                        onPress={onInfoPress}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="information-circle-outline" size={22} color="#FFD700" />
                    </TouchableOpacity>
                </View>

                {/* Ligne 2 : compteur cochons */}
                <Text style={styles.cochonsLine}>
                    🐷 <Text style={styles.cochonsNumber}>{points.toLocaleString()}</Text> cochons infligés
                </Text>

                {/* Ligne 3 : barre de progression */}
                <View style={styles.progressTrack}>
                    <LinearGradient
                        colors={[gradeColor, '#FFA500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${Math.round(progressPct * 100)}%` }]}
                    />
                </View>

                {/* Ligne 4 : prochain grade */}
                {nextGrade && nextThreshold !== null ? (
                    <View style={styles.nextRow}>
                        <Text style={styles.nextLabel}>Prochain</Text>
                        <View style={styles.nextRight}>
                            <Text style={styles.nextIcon}>{LEAGUE_ICONS[nextGrade]}</Text>
                            <Text style={[styles.nextName, { color: LEAGUE_GRADE_COLORS[nextGrade] }]} numberOfLines={1}>
                                {LEAGUE_LABELS[nextGrade]}
                            </Text>
                            <Text style={styles.nextRemaining}>{Math.max(0, nextThreshold - points)} 🐷</Text>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.maxRow}>🔥 Grade maximum atteint</Text>
                )}

            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 360,
        alignSelf: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    card: {
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        gap: 10,
    },

    // Header : identité grade + (i)
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    gradeIdentity: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    gradeIcon: {
        fontSize: 38,
    },
    gradeLabelLine: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    gradeName: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.3,
        marginTop: 1,
    },
    infoButton: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },

    // Compteur cochons
    cochonsLine: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
        textAlign: 'center',
    },
    cochonsNumber: {
        color: '#FFD700',
        fontWeight: '900',
        fontSize: 14,
    },

    // Barre de progression
    progressTrack: {
        height: 10,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
    },

    // Prochain grade
    nextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 2,
    },
    nextLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    nextRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 1,
    },
    nextIcon: {
        fontSize: 16,
    },
    nextName: {
        fontSize: 12,
        fontWeight: '800',
        flexShrink: 1,
    },
    nextRemaining: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    maxRow: {
        textAlign: 'center',
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
Update Todos

Paramètres : retirer onglet Thème

Refonte bloc grade joueur dans ligue-cochons (icône + cochons + prochain grade + (i))

LeagueInfoModal : réordonner onglets Ma Ligue → Classement → Infos
Maintenant le réordonnancement des onglets dans LeagueInfoModal.

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\LeagueInfoModal.tsx
Modified
Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\LeagueInfoModal.tsx
Modified
Update Todos

Paramètres : retirer onglet Thème

Refonte bloc grade joueur dans ligue-cochons (icône + cochons + prochain grade + (i))

LeagueInfoModal : réordonner onglets Ma Ligue → Classement → Infos
Tout est fait.

#	Modification	Fichier
1	Retiré l'onglet THÈME du modal Paramètres (onglet + section + type TS)	modal.tsx
2	Refonte LeagueProgressWidget — nouvelle disposition : ligne 1 icône grade (38px) + nom à gauche, (i) à droite ; ligne 2 compteur cochons ; ligne 3 barre de progression ; ligne 4 prochain grade + reste à faire	LeagueProgressWidget.tsx
3	Réordonné onglets : Ma Ligue → Classement → Infos. Onglet par défaut = MA_LIGUE	LeagueInfoModal.tsx
Points de design du nouveau widget :

La bordure de la carte prend la couleur du grade (teinté à 33 %) → le joueur voit au premier coup d'œil sa ligue
Icône de grade (38px) au lieu d'une ligne de 4 milestones — beaucoup plus lisible en paysage
La barre de progression mesure entre le grade actuel et le prochain seuil (pas 0 → 500), donc elle se remplit à vue d'œil palier par palier
Au grade max, le texte "🔥 Grade maximum atteint" remplace la ligne "Prochain"
Tu peux rebuild et tester — tout est non-destructif (aucun changement de data model).

très bien.
concernnt les publicits générés par l'admin, celles qui apparaissent à l'accueil sont trop intrusive. est ce u'on peut les retarder quelques secondes avant de s'afficher???
Je cherche où les pubs sont déclenchées sur l'accueil.

Grep "AdBannerModal|showAd|setShowAd|adService|trigger.*HOME|trigger.*LOGIN" (in E:\PROJETS\clients\domino_matrinique\mobile, glob: !node_modules/**)
31 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\app\home.tsx (lines 111-155)
Read E:\PROJETS\clients\domino_matrinique\mobile\app\home.tsx (lines 56-170)
Je ajoute un délai configurable (3.5s) avec cleanup propre quand l'user quitte l'accueil :

Edit E:\PROJETS\clients\domino_matrinique\mobile\app\home.tsx
Added 21 lines
Pub HOME retardée de 3,5 secondes avant affichage.

Comportement	Détail
Délai	HOME_AD_DELAY_MS = 3500 (en haut du composant — facile à ajuster)
Cleanup	clearTimeout + flag cancelled dans le return du useFocusEffect → si l'user clique sur Jouer / Sidebar pendant l'attente, la pub ne s'affiche pas a posteriori
Cadeau quotidien	Comportement préservé : si pub + cadeau disponibles, la pub s'affiche (après 3,5 s) puis le cadeau après fermeture. Si pas de pub, le cadeau s'affiche immédiatement (pas de délai inutile)
Portée	Uniquement la pub HOME. Les pubs BEFORE_SOLO / BEFORE_MULTI (dans solo.tsx et game/[id].tsx) restent en affichage immédiat — c'est leur rôle : interrompre avant la partie
Ajuster la valeur ? Si 3,5 s te paraît trop court ou trop long, change juste la constante home.tsx:113. Fourchette saine : 3-6 s. En dessous de 2 s, l'user n'a pas le temps de voir l'accueil ; au-delà de 6 s, il peut déjà avoir cliqué sur Jouer et la pub s'annulera (le flag cancelled fait son travail mais le taux d'impression chute).

est ce que c'est possibles d'imposer un petit texte "Ads" dans les publisités que generet l'admin et aussi idiquer un chrono descndant 10 secondes avant d'affiche le bouton X de fermeture de la pub ?


 je dois verifer tous les chnagements récents.
listes moi ce ue je dois vérifier
Je lis le composant AdBannerModal pour comprendre la structure actuelle.

Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\AdBannerModal.tsx
Update Todos

Ajouter badge 'Ads' + countdown 10s sur AdBannerModal

Établir la liste des points à tester
Write E:\PROJETS\clients\domino_matrinique\mobile\src\components\AdBannerModal.tsx
205 lines
/**
 * AdBannerModal.tsx
 *
 * Popup plein écran pour les publicités admin-managed.
 * - IMAGE : expo-image (comportement initial)
 * - VIDEO : expo-av, autoplay muet en boucle
 * - Badge "Ads" visible en haut à gauche (disclosure)
 * - Bouton ✕ visible uniquement après un countdown de AD_SKIP_DELAY_SEC secondes
 * - Tap sur le média → ouvre targetUrl (si défini)
 * Spec : docs/specs/ADS_SYSTEM.md
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Ad } from '../core/ad.types';
import { LogService } from '../core/services/LogService';

const AD_SKIP_DELAY_SEC = 10;

interface AdBannerModalProps {
    ad: Ad | null;
    onClose: () => void;
}

export const AdBannerModal: React.FC<AdBannerModalProps> = ({ ad, onClose }) => {
    const videoRef = useRef<Video>(null);
    const [videoFailed, setVideoFailed] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(AD_SKIP_DELAY_SEC);

    // Countdown : reset à chaque nouvelle pub, puis tick chaque seconde jusqu'à 0.
    useEffect(() => {
        if (!ad) return;
        setSecondsLeft(AD_SKIP_DELAY_SEC);
        const interval = setInterval(() => {
            setSecondsLeft(s => {
                if (s <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [ad?.id]);

    if (!ad) return null;

    const canClose = secondsLeft === 0;

    const handleTap = () => {
        if (!ad.targetUrl) return;
        Linking.openURL(ad.targetUrl).catch(e =>
            LogService.error('AdBannerModal', 'openURL failed:', e)
        );
        onClose();
    };

    const isVideo = ad.mediaType === 'VIDEO' && !videoFailed;

    return (
        <Modal
            transparent
            visible
            animationType="fade"
            statusBarTranslucent
            // Bloquer la fermeture via le bouton back Android tant que le countdown n'est pas fini
            onRequestClose={() => { if (canClose) onClose(); }}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.mediaWrapper}
                    onPress={ad.targetUrl ? handleTap : undefined}
                    activeOpacity={ad.targetUrl ? 0.88 : 1}
                >
                    {isVideo ? (
                        <Video
                            ref={videoRef}
                            source={{ uri: ad.imageUrl }}
                            style={styles.media}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay
                            isMuted
                            isLooping
                            useNativeControls={false}
                            onError={e => {
                                LogService.error('AdBannerModal', 'video error:', e);
                                setVideoFailed(true);
                            }}
                        />
                    ) : (
                        <Image
                            source={{ uri: ad.imageUrl }}
                            style={styles.media}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                        />
                    )}

                    {/* Badge "Ads" — disclosure permanente en haut à gauche du média */}
                    <View style={styles.adsBadge} pointerEvents="none">
                        <Text style={styles.adsBadgeText}>Ads</Text>
                    </View>
                </TouchableOpacity>

                {/* Countdown ou bouton de fermeture */}
                {canClose ? (
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                        <Ionicons name="close" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.countdownBubble} pointerEvents="none">
                        <Text style={styles.countdownText}>{secondsLeft}</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaWrapper: {
        width: '90%',
        height: '76%',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 14,
    },
    media: {
        width: '100%',
        height: '100%',
    },
    adsBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.55)',
    },
    adsBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    closeButton: {
        position: 'absolute',
        top: 44,
        right: 18,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownBubble: {
        position: 'absolute',
        top: 44,
        right: 18,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
});
Update Todos

Ajouter badge 'Ads' + countdown 10s sur AdBannerModal

Établir la liste des points à tester
Fait. Maintenant la checklist de vérification à faire avant ton rebuild APK.

🔍 Checklist — tous les changements récents
1. Crashs corrigés
 Clic sur l'avatar sidebar → Profile : ne crashe plus ("hostname of undefined")
 Quitter une partie Solo : ne crashe plus (vérif aussi que tu as bien installé et importé react-native-url-polyfill/auto — sans ça, le fix n'est pas complet)
2. Profil & validation pseudo
 Changer d'avatar depuis l'écran Profile → pas d'erreur "Seuls les lettres…"
 Changer le pseudo avec des caractères : - _ . ' à é ï ô ù → sauvegarde OK
 Plus de bouton home ni de bouton ENREGISTRER sur l'écran profil (sauvegarde auto sur blur + sélection avatar)
 Plus d'item Profil dans la sidebar — l'avatar en haut ouvre bien /profile
3. Headers d'écrans simplifiés (sidebar visible, pas de double-nav)
 Jouer (game-modes) : flèche retour à gauche + titre "CHOISIR UN MODE" centré
 Ligue des Cochons : plus de flèche ni 🐷 → titre "Ligue des Cochons" + sous-titre "Niveau Boucher" centrés
 Classement (leaderboard) : plus de flèche ni "Classement Général" → directement les 3 onglets
 Statistiques : plus de bouton Retour ni titre → seule l'icône 🕒 historique à droite
 Boutique : plus d'icône home ni titre "BOUTIQUE" → directement les onglets
 Vestiaire : plus d'icône home ni titre "VESTIAIRE" → directement les onglets
4. Paramètres (via Sidebar → Réglages)
 Onglets restants : PROFIL / AUDIO / HAPTIQUE / COMPTE (THÈME retiré)
 Bouton Se déconnecter toujours présent dans l'onglet COMPTE
5. Ligue des Cochons — UI
 Widget accueil (LeagueProgressWidget) : icône grade grande + nom du grade, compteur cochons, barre colorée, ligne "Prochain : ..." + (i) à droite
 Clic sur (i) → ouvre le modal, onglet Ma Ligue actif par défaut
 Ordre des onglets : Ma Ligue → Classement → Infos
 Onglet Infos : les badges APPRENTI et MAÎTRE ne sont plus écrasés → on lit bien les chiffres 1/2/3 et les seuils 🐷
 L'écran plein /ligue-cochons (depuis sidebar) : header centré, sous-titre visible
6. Publicités admin (R2-M7)
 Accueil : la pub n'apparaît plus immédiatement → ~3,5 s de délai
 Si tu cliques sur Jouer avant les 3,5 s → la pub ne s'affiche pas (annulée)
 Pub affichée → badge "Ads" visible en haut à gauche
 Compte à rebours 10 → 1 en haut à droite, puis remplacé par le bouton ✕
 Sur Android, bouton hardware back pendant le countdown → ne ferme PAS la pub (attendu)
 Clic sur la pub (si targetUrl défini) → ouvre le lien (fonctionne aussi pendant le countdown)
 Fallback vidéo KO → bascule automatique sur image (déjà livré v2.3)
7. Auth (déjà livré v2.3 — re-vérifier)
 Reset mot de passe (lien "Mot de passe oublié ?" sur login) → email reçu
 Universal Links WhatsApp Android → partager une invitation, cliquer le lien bleu → ouvre la bonne table
8. Non-régressions à surveiller
 Partie solo : début, déroulement, Boudé, Cochon, fin de manche, fin de match
 Partie multi : création table, rejoindre, jouer, fin de match
 Audio : BGM + SFX en jeu, bouton mute
 Plein écran immersive (barre système masquée)
 Cadeau quotidien : s'affiche après la pub (si pub) ou directement (sinon)
Rappel crucial avant build : tu n'as pas confirmé avoir installé le polyfill URL. Si ce n'est pas fait :


cd mobile && npx expo install react-native-url-polyfill
puis ajoute import 'react-native-url-polyfill/auto'; en première ligne de _layout.tsx. Sans ça, le crash "quitter solo" reviendra.


image.png
700×416
1- ajoutes dans le backlog la focntionnalité de suppression du compte
2- dans le modal de fin de match (voir capture) enlèves le header qui continet icone trophé et titre VAINQUEUR DU LATCH et en dessous le nom du vainquer, puis déplace l'icone de l'histirue de ce latch en bas et ecris a coté - historique match, puis ajoutes un bouton quitter a gauche en bas de cet ecrann
Update Todos

Vérifier/ajouter suppression de compte au BACKLOG

Modifier le modal fin de match : retirer header, déplacer historique + bouton Quitter
Grep "Soft delete|Supprimer.*compte|suppression.*compte|SUPPR|delete.*account|deleteAccount" (in E:\PROJETS\clients\domino_matrinique\docs)
5 lines of output
Read E:\PROJETS\clients\domino_matrinique\docs\pilotage\BACKLOG.md (lines 146-160)
L'entrée existe déjà ligne 151. Je l'enrichis pour refléter son caractère prioritaire (Google Play exige l'option "Supprimer mon compte" depuis 2024) :

Edit E:\PROJETS\clients\domino_matrinique\docs\pilotage\BACKLOG.md
Added 7 lines
Update Todos

Vérifier/ajouter suppression de compte au BACKLOG

Modifier le modal fin de match : retirer header, déplacer historique + bouton Quitter
Maintenant le modal fin de match. Je cherche le composant.

Grep "VAINQUEUR DU MATCH|VAINQUEUR|CHAMPION|MES GAINS" (in E:\PROJETS\clients\domino_matrinique\mobile\src)
4 lines of output
Grep "VAINQUEUR DU MATCH|MES GAINS|trophy|historique|history" (in E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx)
36 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx (lines 241-380)
Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx (lines 381-480)
Grep "renderFooter" (in E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx)
3 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx (lines 156-185)
Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx (lines 479-548)
Grep "footer:|actionBtn:|actionBtnText:|waitingBtn:" (in E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx)
4 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx (lines 648-687)
Je refais le renderMatchEndMain (plus de header) et le renderFooter (bouton Quitter à gauche + Historique match à droite, uniquement en fin de match) :

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx
Added 21 lines
Maintenant je retire le matchHeader (VAINQUEUR DU MATCH + nom + icône historique) :

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx
Removed 15 lines
Maintenant j'ajoute les styles pour le nouveau footer split (Quitter / Historique match) :

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx
Added 38 lines
Update Todos

Vérifier/ajouter suppression de compte au BACKLOG

Modifier le modal fin de match : retirer header, déplacer historique + bouton Quitter
Fait.

1. Backlog — Suppression de compte
L'entrée existait déjà ligne 151 du backlog sous le Bloc 10 mais sans détails. Je l'ai étoffée en tâche opérationnelle [ACCOUNT-DELETE] avec :

Justification Google Play (exigence depuis 2024 — bloquant pour les MAJ)
Découpage : UI mobile, Cloud Function deleteUserAccount, Firestore rules, délai de grâce, URL Play Console
Estimation : ~1,5 jour
Voir docs/pilotage/BACKLOG.md § Bloc 10.

2. Modal fin de match
Modifications dans UnifiedResultOverlay.tsx :

Élément	Avant	Après
Header	🏆 VAINQUEUR DU MATCH + "OKI" + icône 🕒 à droite	Supprimé
Podium	inchangé	inchangé (le nom du vainqueur reste affiché sous la couronne, pas besoin de le répéter en header)
"MES GAINS"	inchangé	inchangé
Footer (fin de match)	Bouton centré "QUITTER & ACCUEIL"	Quitter à gauche + 🕒 Historique match à droite (lien souligné)
Footer (round intermédiaire)	Bouton CONTINUER	inchangé (comportement préservé)
Le lien "Historique match" ouvre la même vue qu'avant, avec son propre bouton Retour.

À tester :

Fin de match solo : header absent, Quitter en bas à gauche ramène à l'accueil, Historique match ouvre la table
Fin de manche (partie en cours) : bouton CONTINUER toujours centré (pas de régression)
Fin de match multi côté non-hôte : à vérifier — actuellement le non-hôte voit le footer split aussi (il peut quitter et voir l'historique). À confirmer si ça correspond à ton intention.
ok, pour le modal de fin de match : 
1- remplaces Histiruque match par détails et supprimes là de l'hisoriques lui même
2- remplaces le bouton quitter par une icone Accueil
3- forces l'animation des objets volant a etre plus longuees ou a jouer en continnue, jusqu'a ce que le jouur quitte ou va a l'historique match
Je lis les sections concernées pour bien cibler les modifications.

Grep "ConfettiCannon|confettiRef|autoStart|fadeOut|explosionSpeed" (in E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx)
8 lines of output
Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx (lines 96-120)
Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx (lines 346-395)
Trois modifications :

1. "Historique match" → "Détails" + retrait du titre "HISTORIQUE" dans la vue

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx
Modified
Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx
Removed 2 lines
2. Bouton "Quitter" → icône Accueil seule

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx
Added 5 lines
Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx
Removed 8 lines
3. Confettis en boucle jusqu'à Quitter / Détails

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\UnifiedResultOverlay.tsx
Added 14 lines
Fait.

#	Changement	Fichier
1	"Historique match" renommé Détails (+ icône list-outline). Titre "HISTORIQUE" supprimé de la vue elle-même, il reste juste le bouton Retour.	UnifiedResultOverlay.tsx:296
2	Bouton "Quitter" remplacé par icône 🏠 seule (cercle 44×44), accessibilityLabel conservé pour lecteurs d'écran	UnifiedResultOverlay.tsx:276
3	Confettis en boucle toutes les 3 s via un useEffect dédié. S'arrête automatiquement si : user ouvre Détails, user quitte, composant invisible, ou reducedMotion actif	UnifiedResultOverlay.tsx
Points à vérifier en test
Fin de match solo victoire → confettis tombent toutes les ~3 s en continu jusqu'à ce que tu cliques 🏠 ou Détails
Clic sur Détails → confettis s'arrêtent immédiatement, vue historique apparaît sans titre
Retour depuis Détails → confettis reprennent la boucle (c'est voulu puisqu'on revient à la vue "fin de match")
Fin de match défaite → même boucle (les confettis jouent aussi pour les non-gagnants — si tu veux les limiter au gagnant uniquement, il faut ajouter isMeWinner au useEffect)
Réduction de mouvements activée (iOS : accessibility settings) → aucun confetti, comme avant
Question design : veux-tu que les confettis jouent uniquement si le joueur gagne (isMeWinner) ? Actuellement ils jouent pour tous — ce qui est un peu étrange si tu finis 3ᵉ. Dis-moi si je dois ajouter cette condition.


image.png
856×503
Le modal de fin d'un round est trop petit:
1- Agrandis le modal pour qu'il occupe 80% de l'ecran minimum 
2- Agrandi les dominos restats des joeuurs 
3- supprimes les textes : "VICTOIRE PAR DEFAUT", "DANS LA MAIN", "SCORES DES MAINS",
4- enlèves la men,tions PTS devant le cumult des points dominos
Je lis le composant responsable (probablement RoundResultCard).

Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx
Je refonte le composant. Modifications :

Taille modal : width: '92%', height: '82%', maxWidth: 720
Dominos : size: 40 (au lieu de 22), main complète affichée
Suppression : VICTOIRE DE / PAR DÉFAUT, dans la main, SCORES DES MAINS / MAINS RESTANTES
Retrait du suffixe " pts"
Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx
Removed 5 lines
Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx
Removed 2 lines
Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx
Removed 15 lines
Maintenant j'agrandis le modal + ajuste les tailles de texte :

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx
Removed 27 lines
Grep "victoryLabel|rightTitle|scoreChip[^T]|moreLabel" (in E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx)
1 line of output
Propre, aucune référence morte. Récap :

#	Demande	Implémentation
1	Modal à 80 % min	width: 92%, height: 82%, maxWidth: 780
2	Dominos plus grands	Taille 40 au lieu de 22 + main complète affichée (plus de .slice(0, 4) ni de +N)
3	Textes supprimés	VICTOIRE DE / PAR DÉFAUT + dans la main + SCORES DES MAINS / MAINS RESTANTES + MAINS DES JOUEURS (égalité)
4	Suffixe "pts" retiré	Partout — affichage brut du score (ex : 18 au lieu de 18 pts)
Ajustements UI qui accompagnent :

Header 🔒 PARTIE BLOQUÉE : police 10 → 12 px (plus lisible dans le modal agrandi)
Nom du vainqueur : 20 → 26 px
Score Boudé (colonne gauche) : 22 → 32 px
Noms adversaires : 11 → 14 px, scores : 12 → 16 px
Gap entre dominos : 2 → 4 px (pour ne pas qu'ils se touchent à cette nouvelle taille)
À tester :

Fin de round avec victoire normale (hand vide)
Fin de round avec Boudé (gagnant a encore la plus petite main)
Fin de round avec égalité parfaite (partie rejouée)
Vérifier que la main de 7 dominos tient en largeur : à la taille 40px × 7 + gaps ≈ 300 px, dans une colonne droite flex 1.35 d'un modal 780 px max → OK, mais sur petits écrans paysage (~600 px) ça pourrait wrap sur 2 lignes, ce qui reste lisible.

image.png
789×403
ok c'est mieux. l'image est meilleure ( voir capture)
petitchangement : mes le nombre de cumul des points de chaque joueur devant son nom. exemple OKI (1) Fifine (2) Doudou (3)
Read E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx (lines 41-70)
Je passe le score en inline Nom (score) dans les 3 cas (égalité, winner boudé, losers).

Égalité :

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx
Removed 3 lines
Winner Boudé + Losers :

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx
Added 2 lines
Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx
Removed 2 lines
Ajout des styles scoreInline et winnerScoreInline, et nettoyage de scoreChipText/boudedScore devenus partiellement obsolètes :

Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx
Modified
Edit E:\PROJETS\clients\domino_matrinique\mobile\src\components\game\RoundResultCard.tsx
Modified
Fait. Format appliqué : Nom (score) avec le chiffre coloré en orange accent.

Cas	Rendu avant	Rendu après
Winner Boudé (colonne gauche)	Grand nom + grand chiffre en dessous	OKI (1) — chiffre de 22 px à côté du nom
Losers (colonne droite)	Nom à gauche + chiffre à droite	Fifine (2) en ligne continue
Égalité	Nom à gauche + chiffre à droite	OKI (2) en ligne continue
Victoire normale (main vide)	Nom simple	Nom simple inchangé (pas de parenthèses, main vide = pas de cumul)
Rendu attendu d'après ta capture :


OKI (1)                Fifine (2)
🀱                     🀲
                       Doudou (3)
                       🀳
Note : j'ai aussi retiré le gros chiffre orange qui apparaissait isolé au-dessus des dominos du winner boudé (rendu redondant avec l'inline). Le layout est maintenant plus aéré.

ajoutes un symbole de victoire juste avant le nom du vainqueur, exemple une courronne suivi du nom du vainqueur d'une partie bloquée
