# ─────────────────────────────────────────────────────────────────────────────
# build-release.ps1
# Script de build sécurisé pour Domino Martiniquais
#
# Usage :
#   .\scripts\build-release.ps1              # Build AAB + vérification signature
#   .\scripts\build-release.ps1 -SkipCheck   # Sans vérification du keystore
#   .\scripts\build-release.ps1 -Prebuild    # Lance expo prebuild avant le build
# ─────────────────────────────────────────────────────────────────────────────

param(
    [switch]$SkipCheck,
    [switch]$Prebuild,
    [switch]$Help
)

# Couleurs
function Write-Step  { param($msg) Write-Host "▶ $msg" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-Info  { param($msg) Write-Host "  ℹ️  $msg" -ForegroundColor Gray }

if ($Help) {
    Write-Host @"
build-release.ps1 - Build AAB signé pour le Play Store

Usage:
  .\scripts\build-release.ps1              Build normal
  .\scripts\build-release.ps1 -Prebuild    Lance expo prebuild --clean avant
  .\scripts\build-release.ps1 -SkipCheck   Ignore la vérification du keystore

Variables requises dans ~/.gradle/gradle.properties :
  UPLOAD_KEYSTORE_PATH
  UPLOAD_STORE_PASSWORD
  UPLOAD_KEY_ALIAS
  UPLOAD_KEY_PASSWORD
"@
    exit 0
}

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot   # Dossier /mobile
$KEYSTORE_PATH = "$ROOT\upload-keystore.jks"
$GRADLE_USER_PROPS = "$env:USERPROFILE\.gradle\gradle.properties"
$AAB_PATH = "$ROOT\android\app\build\outputs\bundle\release\app-release.aab"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkCyan
Write-Host "  🎯 Domino Martiniquais — Build Release AAB" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkCyan
Write-Host ""

# ─── ÉTAPE 1 : Vérification du keystore ────────────────────────────────────
if (-not $SkipCheck) {
    Write-Step "Vérification du keystore..."

    if (-not (Test-Path $KEYSTORE_PATH)) {
        Write-Fail "upload-keystore.jks INTROUVABLE !"
        Write-Info "Chemin attendu : $KEYSTORE_PATH"
        Write-Info "Copiez votre keystore à cet emplacement avant de relancer."
        exit 1
    }
    Write-OK "Keystore trouvé : $KEYSTORE_PATH"

    # Vérifier les credentials dans ~/.gradle/gradle.properties
    if (-not (Test-Path $GRADLE_USER_PROPS)) {
        Write-Fail "~/.gradle/gradle.properties introuvable !"
        Write-Info "Créez ce fichier avec vos credentials :"
        Write-Info "  UPLOAD_KEYSTORE_PATH=E:/PROJETS/clients/domino_matrinique/mobile/upload-keystore.jks"
        Write-Info "  UPLOAD_STORE_PASSWORD=..."
        Write-Info "  UPLOAD_KEY_ALIAS=upload"
        Write-Info "  UPLOAD_KEY_PASSWORD=..."
        exit 1
    }

    $gradleProps = Get-Content $GRADLE_USER_PROPS -Raw
    if ($gradleProps -notmatch 'UPLOAD_KEYSTORE_PATH') {
        Write-Fail "UPLOAD_KEYSTORE_PATH non défini dans ~/.gradle/gradle.properties !"
        exit 1
    }
    Write-OK "Credentials gradle trouvés dans ~/.gradle/gradle.properties"
}

# ─── ÉTAPE 2 : expo prebuild (optionnel) ───────────────────────────────────
if ($Prebuild) {
    Write-Step "Lancement de expo prebuild --clean..."
    Set-Location $ROOT
    & npx expo prebuild --clean --platform android
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "expo prebuild a échoué (code $LASTEXITCODE)"
        exit $LASTEXITCODE
    }
    Write-OK "prebuild terminé"
}

# ─── ÉTAPE 3 : Build Gradle ─────────────────────────────────────────────────
Write-Step "Lancement de ./gradlew bundleRelease..."
Set-Location "$ROOT\android"

# Nettoyer les anciens builds
if (Test-Path $AAB_PATH) {
    Remove-Item $AAB_PATH -Force
    Write-Info "Ancien AAB supprimé"
}

& .\gradlew bundleRelease --no-daemon

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Fail "Le build Gradle a échoué (code $LASTEXITCODE)"
    Write-Info "Consultez les logs ci-dessus pour le détail de l'erreur."
    exit $LASTEXITCODE
}

# ─── ÉTAPE 4 : Vérification du AAB généré ──────────────────────────────────
Write-Step "Vérification du AAB généré..."

if (-not (Test-Path $AAB_PATH)) {
    Write-Fail "AAB introuvable après build : $AAB_PATH"
    exit 1
}

$aabSize = (Get-Item $AAB_PATH).Length / 1MB
Write-OK ("AAB généré : {0:F1} MB" -f $aabSize)
Write-Info "Chemin : $AAB_PATH"

# ─── ÉTAPE 5 : Vérification de la signature ─────────────────────────────────
Write-Step "Vérification de la signature..."

$jarsignerOutput = & jarsigner -verify -verbose -certs $AAB_PATH 2>&1 | Select-String "jar verified|WARNING|ERROR" | Head -5
if ($LASTEXITCODE -eq 0) {
    Write-OK "Signature valide (jarsigner verify OK)"
} else {
    Write-Warn "Impossible de vérifier la signature avec jarsigner."
    Write-Info "Vérification manuelle : jarsigner -verify $AAB_PATH"
}

# ─── RÉSUMÉ ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkGreen
Write-Host "  🚀 Build terminé avec succès !" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkGreen
Write-Host ""
Write-Host "  AAB : $AAB_PATH" -ForegroundColor White
Write-Host ""
Write-Host "  Prochaines étapes :" -ForegroundColor Gray
Write-Host "  1. Ouvrez Google Play Console" -ForegroundColor Gray
Write-Host "  2. Production > Nouvelle version > Uploader l'AAB" -ForegroundColor Gray
Write-Host ""
