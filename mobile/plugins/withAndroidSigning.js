/**
 * withAndroidSigning.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Config Plugin Expo — injecte la signingConfig release dans build.gradle
 * automatiquement à chaque `npx expo prebuild` ou `npx expo prebuild --clean`.
 *
 * Les credentials sont lus depuis ~/.gradle/gradle.properties (niveau machine)
 * et ne sont JAMAIS supprimés par un clean.
 *
 * Pour ajouter/mettre à jour les credentials, éditez :
 *   C:\Users\<vous>\.gradle\gradle.properties
 *
 * Variables requises :
 *   UPLOAD_KEYSTORE_PATH   = chemin absolu vers upload-keystore.jks (slashes /)
 *   UPLOAD_STORE_PASSWORD  = mot de passe du keystore
 *   UPLOAD_KEY_ALIAS       = alias de la clé (ex: upload)
 *   UPLOAD_KEY_PASSWORD    = mot de passe de la clé
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { withAppBuildGradle } = require('@expo/config-plugins');

const RELEASE_SIGNING_CONFIG = `
        release {
            // Credentials chargés depuis ~/.gradle/gradle.properties (jamais supprimé par prebuild --clean)
            if (project.hasProperty('UPLOAD_KEYSTORE_PATH')) {
                storeFile file(UPLOAD_KEYSTORE_PATH)
                storePassword UPLOAD_STORE_PASSWORD
                keyAlias UPLOAD_KEY_ALIAS
                keyPassword UPLOAD_KEY_PASSWORD
            } else {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
                println "⚠️  WARNING: UPLOAD_KEYSTORE_PATH non défini. Build signé avec debug key."
                println "   → Ajoutez vos credentials dans ~/.gradle/gradle.properties"
            }
        }`;

/**
 * Injecte le bloc `release` dans signingConfigs si absent.
 */
function addReleaseSigningConfig(buildGradle) {
  if (buildGradle.includes('UPLOAD_KEYSTORE_PATH')) {
    // Déjà patché, rien à faire
    return buildGradle;
  }

  // Cherche la fin du bloc signingConfigs { debug { ... } }
  // et insère le bloc release juste avant la fermeture du signingConfigs
  const signingConfigsEnd = buildGradle.indexOf(
    '    }\n    buildTypes {'
  );

  if (signingConfigsEnd === -1) {
    console.warn('[withAndroidSigning] Impossible de localiser signingConfigs dans build.gradle');
    return buildGradle;
  }

  return (
    buildGradle.slice(0, signingConfigsEnd) +
    RELEASE_SIGNING_CONFIG +
    '\n    }\n    buildTypes {' +
    buildGradle.slice(signingConfigsEnd + '    }\n    buildTypes {'.length)
  );
}

/**
 * Remplace signingConfig signingConfigs.debug par signingConfigs.release
 * dans le bloc buildTypes.release uniquement.
 */
function fixReleaseBuildType(buildGradle) {
  // On cherche le bloc release { ... } dans buildTypes et on remplace debug par release
  // Stratégie : remplacer après le marqueur "buildTypes {"
  const buildTypesIdx = buildGradle.indexOf('    buildTypes {');
  if (buildTypesIdx === -1) {
    console.warn('[withAndroidSigning] Impossible de localiser buildTypes dans build.gradle');
    return buildGradle;
  }

  const beforeBuildTypes = buildGradle.slice(0, buildTypesIdx);
  const afterBuildTypes = buildGradle.slice(buildTypesIdx);

  // Dans la section buildTypes, cherche "signingConfig signingConfigs.debug"
  // dans le bloc release (pas dans le bloc debug)
  const releaseBlockStart = afterBuildTypes.indexOf('        release {');
  if (releaseBlockStart === -1) {
    console.warn('[withAndroidSigning] Bloc release introuvable dans buildTypes');
    return buildGradle;
  }

  const releaseSection = afterBuildTypes.slice(releaseBlockStart);
  const patchedRelease = releaseSection.replace(
    'signingConfig signingConfigs.debug',
    'signingConfig signingConfigs.release'
  );

  return beforeBuildTypes + afterBuildTypes.slice(0, releaseBlockStart) + patchedRelease;
}

const withAndroidSigning = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      console.warn('[withAndroidSigning] build.gradle non Groovy, plugin ignoré');
      return config;
    }

    let contents = config.modResults.contents;

    contents = addReleaseSigningConfig(contents);
    contents = fixReleaseBuildType(contents);

    config.modResults.contents = contents;

    console.log('[withAndroidSigning] ✅ signingConfig release injectée dans build.gradle');
    return config;
  });
};

module.exports = withAndroidSigning;
