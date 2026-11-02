#!/bin/bash
# 앱에 위젯 확장을 넣고 Developer ID로 서명한 .app과 .dmg를 만든다.
# NOTARY_PROFILE(xcrun notarytool store-credentials로 저장한 키체인 프로필 이름)이 있으면 공증하고 staple까지 한다
set -euo pipefail
cd "$(dirname "$0")/.."

version=$(node -p "require('./package.json').version")
identity=${SIGN_IDENTITY:-$(security find-identity -v -p codesigning | sed -n 's/.*"\(Developer ID Application: .*\)"$/\1/p' | head -1)}
if [ -z "$identity" ]; then
  echo "키체인에 Developer ID Application 인증서가 없다. SIGN_IDENTITY로 지정할 수도 있다" >&2
  exit 1
fi

app=src-tauri/target/release/bundle/macos/wild-learning.app
appex=src-tauri/target/widget/Build/Products/Release/WildLearningWidget.appex
dmg=src-tauri/target/release/bundle/dmg/wild-learning_${version}_$(uname -m).dmg

notarize() {
  xcrun notarytool submit "$1" --keychain-profile "$NOTARY_PROFILE" --wait
}

npx tauri build
xcodegen --spec widget/project.yml --quiet
xcodebuild -quiet -project widget/WildLearningWidget.xcodeproj -scheme WildLearningWidget -configuration Release \
  -destination "platform=macOS,arch=$(uname -m)" -derivedDataPath src-tauri/target/widget CODE_SIGNING_ALLOWED=NO \
  MARKETING_VERSION="$version" CURRENT_PROJECT_VERSION="$version" build

rm -rf "$app/Contents/PlugIns"
mkdir -p "$app/Contents/PlugIns"
cp -R "$appex" "$app/Contents/PlugIns/"

# 확장을 먼저 서명해야 앱 서명이 확장 서명까지 봉인한다
codesign --force --options runtime --timestamp --sign "$identity" \
  --entitlements widget/WildLearningWidget.entitlements "$app/Contents/PlugIns/WildLearningWidget.appex"
codesign --force --options runtime --timestamp --sign "$identity" \
  --entitlements src-tauri/wild-learning.entitlements "$app"
codesign --verify --deep --strict "$app"

if [ -n "${NOTARY_PROFILE:-}" ]; then
  ditto -c -k --keepParent "$app" "$app.zip"
  notarize "$app.zip"
  rm "$app.zip"
  xcrun stapler staple "$app"
fi

staging=$(mktemp -d)
cp -R "$app" "$staging/"
ln -s /Applications "$staging/Applications"
mkdir -p "$(dirname "$dmg")"
hdiutil create -quiet -volname 야생학습 -srcfolder "$staging" -format UDZO -ov "$dmg"
rm -rf "$staging"
codesign --force --timestamp --sign "$identity" "$dmg"

if [ -n "${NOTARY_PROFILE:-}" ]; then
  notarize "$dmg"
  xcrun stapler staple "$dmg"
else
  echo "NOTARY_PROFILE이 없어 공증을 건너뛴다. 내려받아 여는 Mac에서는 Gatekeeper가 막는다"
fi

echo "app: $app"
echo "dmg: $dmg"
