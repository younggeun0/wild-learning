import SwiftUI
import WidgetKit

// src/renderer/App.css의 accent와 Tailwind stone 색
struct Palette {
    let accent: Color
    let background: Color
    let cell: Color
    let text: Color
    let muted: Color

    static func of(_ scheme: ColorScheme) -> Palette {
        scheme == .dark
            ? Palette(accent: Color(hex: 0x4FAE78), background: Color(hex: 0x1C1917), cell: Color(hex: 0x292524),
                      text: Color(hex: 0xF5F5F4), muted: Color(hex: 0x78716C))
            : Palette(accent: Color(hex: 0x3A8F5C), background: Color(hex: 0xFAFAF9), cell: Color(hex: 0xE7E5E4),
                      text: Color(hex: 0x292524), muted: Color(hex: 0xA8A29E))
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(red: Double(hex >> 16 & 0xFF) / 255, green: Double(hex >> 8 & 0xFF) / 255, blue: Double(hex & 0xFF) / 255)
    }
}

struct WidgetBackground: View {
    @Environment(\.colorScheme) private var scheme

    var body: some View { Palette.of(scheme).background }
}

// 사분면 배치는 src/renderer/session.ts의 QUADRANTS(행: 미래, 과거·현재 / 열: 분산, 집중)를 따른다
private let quadrantRows = [["옵션", "가설"], ["지도", "액관해"]]

struct StageWidgetView: View {
    let stage: Stage?
    let family: WidgetFamily
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let palette = Palette.of(scheme)
        if let stage {
            if family == .systemMedium {
                HStack(spacing: 14) {
                    QuadrantGrid(current: stage.stage, palette: palette)
                    StageSummary(stage: stage, palette: palette)
                }
            } else {
                StageSummary(stage: stage, palette: palette)
            }
        } else {
            VStack(spacing: 6) {
                Text("야생학습").font(.system(size: 15, weight: .bold)).foregroundStyle(palette.text)
                Text("앱을 실행해 주세요").font(.system(size: 12)).foregroundStyle(palette.muted)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

private struct StageSummary: View {
    let stage: Stage
    let palette: Palette

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(stage.stage)
                .font(.system(size: 36, weight: .bold))
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .foregroundStyle(palette.accent)
                .widgetAccentable()
            Text(stage.substep ?? " ")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(palette.text)
            Spacer(minLength: 4)
            Button(intent: AdvanceIntent()) {
                Text("다음 →")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(palette.text)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 5)
                    .background(palette.cell, in: Capsule())
            }
            .buttonStyle(.plain)
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

private struct QuadrantGrid: View {
    let current: String
    let palette: Palette

    var body: some View {
        Grid(horizontalSpacing: 4, verticalSpacing: 4) {
            ForEach(quadrantRows, id: \.self) { row in
                GridRow {
                    ForEach(row, id: \.self) { label in
                        let on = label == current
                        Text(label)
                            .font(.system(size: 13, weight: on ? .bold : .semibold))
                            .foregroundStyle(on ? Color.white : palette.muted)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(on ? palette.accent : palette.cell, in: RoundedRectangle(cornerRadius: 8))
                            .widgetAccentable(on)
                    }
                }
            }
        }
        .frame(width: 150)
    }
}
