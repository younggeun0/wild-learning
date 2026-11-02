#!/bin/bash
# 위젯 뷰를 ImageRenderer로 그려 .verify/widget-*.png로 남긴다. 알림 센터에 올리지 않고 모양을 확인할 때 쓴다
set -euo pipefail
cd "$(dirname "$0")/.."
out=.verify
bin=src-tauri/target/widget/render-preview
mkdir -p "$out" "$(dirname "$bin")"
xcrun swiftc -O -target "$(uname -m)-apple-macosx14.0" -o "$bin" \
  widget/Sources/Stage.swift widget/Sources/StageViews.swift widget/Sources/AdvanceIntent.swift widget/Preview/main.swift
"$bin" "$out"
