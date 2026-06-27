# Infra Resilience360 — one-command Android release build (APK + AAB)
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

Write-Host "[release] npm install"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[release] npm run android:prepare:release"
npm run android:prepare:release
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$Android = Join-Path $Root "android"
Set-Location $Android

$KeystoreProps = Join-Path $Android "keystore.properties"
if (-not (Test-Path $KeystoreProps)) {
  Write-Warning "[release] keystore.properties not found — release signing will be skipped."
  Write-Warning "  Copy android/keystore.properties.template to android/keystore.properties and configure signing."
}

Write-Host "[release] gradlew assembleRelease"
.\gradlew assembleRelease
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[release] gradlew bundleRelease"
.\gradlew bundleRelease
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location $Root
Write-Host "[release] Done."
Write-Host "  Release APK: android/app/build/outputs/apk/release/"
Write-Host "  Release AAB: android/app/build/outputs/bundle/release/"
