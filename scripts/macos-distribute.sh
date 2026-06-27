#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESKTOP_DIR="$ROOT_DIR/platforms/desktop"
APPSTORE_DIR="$DESKTOP_DIR/.appstore"

APP_NAME="${MACOS_APP_NAME:-Notit}"
BUNDLE_ID="${MACOS_BUNDLE_ID:-dev.misei.notit}"
TEAM_ID="${APPLE_TEAM_ID:-GJDZ27K9YA}"
APP_VERSION="${MACOS_APP_VERSION:-0.1.0}"
BUILD_NUMBER="${MACOS_BUILD_NUMBER:-1}"
APP_PATH="$DESKTOP_DIR/target/release/bundle/macos/$APP_NAME.app"
PKG_PATH="$APPSTORE_DIR/$APP_NAME-$APP_VERSION-$BUILD_NUMBER-mas.pkg"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "macos-distribute must run on macOS." >&2
  exit 1
fi

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

valid_identity() {
  local pattern="$1"
  security find-identity -v -p codesigning \
    | awk -v pattern="$pattern" '$0 !~ /REVOKED|CSSMERR/ && $0 ~ pattern { match($0, /"[^"]+"/); print substr($0, RSTART + 1, RLENGTH - 2); exit }'
}

find_profile() {
  local profile
  while IFS= read -r profile; do
    if security cms -D -i "$profile" 2>/dev/null | grep -q "<string>$TEAM_ID.$BUNDLE_ID</string>"; then
      printf '%s\n' "$profile"
      return 0
    fi
  done < <(find "$APPSTORE_DIR" "$HOME/Library/MobileDevice/Provisioning Profiles" -maxdepth 1 -type f \( -name '*.provisionprofile' -o -name '*.mobileprovision' \) 2>/dev/null)
  return 1
}

require_cmd node
require_cmd npm
require_cmd security
require_cmd codesign
require_cmd productbuild
require_cmd pkgutil

source "$HOME/.cargo/env"

APP_SIGNING_IDENTITY="${APPLE_SIGNING_IDENTITY:-$(valid_identity "Apple Distribution: .*\\($TEAM_ID\\)")}"
INSTALLER_SIGNING_IDENTITY="${APPLE_INSTALLER_SIGNING_IDENTITY:-$(valid_identity "(3rd Party Mac Developer Installer|Mac Installer Distribution): .*\\($TEAM_ID\\)")}"
PROFILE_PATH="${MACOS_PROVISION_PROFILE:-$(find_profile || true)}"

if [[ -z "$APP_SIGNING_IDENTITY" ]]; then
  echo "Missing Apple app signing identity. Install a valid Apple Distribution certificate or set APPLE_SIGNING_IDENTITY." >&2
  exit 1
fi

if [[ -z "$INSTALLER_SIGNING_IDENTITY" ]]; then
  echo "Missing Mac App Store installer identity. Install a valid Mac Installer Distribution / 3rd Party Mac Developer Installer certificate or set APPLE_INSTALLER_SIGNING_IDENTITY." >&2
  exit 1
fi

if [[ -z "$PROFILE_PATH" || ! -f "$PROFILE_PATH" ]]; then
  echo "Missing Mac App Store provisioning profile for $BUNDLE_ID. Set MACOS_PROVISION_PROFILE=/path/to/profile.provisionprofile." >&2
  exit 1
fi

mkdir -p "$APPSTORE_DIR"

ENTITLEMENTS_PATH="$APPSTORE_DIR/Entitlements.plist"
INFO_PLIST_PATH="$APPSTORE_DIR/Info.plist"
TAURI_CONFIG_PATH="$APPSTORE_DIR/tauri.appstore.conf.json"

cat > "$ENTITLEMENTS_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.application-identifier</key>
  <string>$TEAM_ID.$BUNDLE_ID</string>
  <key>com.apple.developer.team-identifier</key>
  <string>$TEAM_ID</string>
  <key>com.apple.security.app-sandbox</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
</dict>
</plist>
EOF

cat > "$INFO_PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>ITSAppUsesNonExemptEncryption</key>
  <false/>
</dict>
</plist>
EOF

node --input-type=module <<EOF
import fs from 'node:fs'

const config = {
  version: '$APP_VERSION',
  bundle: {
    targets: ['app'],
    macOS: {
      signingIdentity: '$APP_SIGNING_IDENTITY',
      hardenedRuntime: true,
      entitlements: '$ENTITLEMENTS_PATH',
      infoPlist: '$INFO_PLIST_PATH'
    }
  }
}

fs.writeFileSync('$TAURI_CONFIG_PATH', JSON.stringify(config, null, 2))
EOF

echo "Building $APP_NAME.app for Mac App Store..."
(cd "$DESKTOP_DIR" && ../../node_modules/.bin/tauri build --bundles app --config "$TAURI_CONFIG_PATH" --ci)

if [[ ! -d "$APP_PATH" ]]; then
  echo "Expected app bundle missing: $APP_PATH" >&2
  exit 1
fi

cp "$PROFILE_PATH" "$APP_PATH/Contents/embedded.provisionprofile"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$APP_PATH/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $APP_VERSION" "$APP_PATH/Contents/Info.plist"

echo "Re-signing $APP_NAME.app with embedded provisioning profile..."
codesign --force --deep --options runtime --entitlements "$ENTITLEMENTS_PATH" --sign "$APP_SIGNING_IDENTITY" "$APP_PATH"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

rm -f "$PKG_PATH"
echo "Creating Mac App Store package..."
productbuild --component "$APP_PATH" /Applications --sign "$INSTALLER_SIGNING_IDENTITY" "$PKG_PATH"
pkgutil --check-signature "$PKG_PATH"

echo "Created: $PKG_PATH"
echo "Upload this .pkg with Transporter or App Store Connect."
