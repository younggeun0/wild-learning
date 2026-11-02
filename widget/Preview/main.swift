import AppKit
import SwiftUI
import WidgetKit

// ImageRenderer는 containerBackground와 위젯 여백을 그리지 않아서 직접 깐다. 크기는 macOS 위젯 대략값
let out = URL(fileURLWithPath: CommandLine.arguments[1])
let loop = Stage(stage: "액관해", substep: "관찰", since: (Date.now.timeIntervalSince1970 - 724) * 1000)
let hypothesis = Stage(stage: "가설", substep: nil, since: (Date.now.timeIntervalSince1970 - 3725) * 1000)
let cases: [(String, Stage?, WidgetFamily, CGSize)] = [
    ("small", loop, .systemSmall, CGSize(width: 170, height: 170)),
    ("small-hypothesis", hypothesis, .systemSmall, CGSize(width: 170, height: 170)),
    ("small-empty", nil, .systemSmall, CGSize(width: 170, height: 170)),
    ("medium", loop, .systemMedium, CGSize(width: 364, height: 170)),
]

@MainActor func render() throws {
for (name, stage, family, size) in cases {
    for (schemeName, scheme) in [("light", ColorScheme.light), ("dark", ColorScheme.dark)] {
        let view = StageWidgetView(stage: stage, family: family)
            .padding(16)
            .frame(width: size.width, height: size.height)
            .background(WidgetBackground())
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .environment(\.colorScheme, scheme)
        let renderer = ImageRenderer(content: view)
        renderer.scale = 2
        guard let image = renderer.cgImage,
              let png = NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:]) else {
            fatalError("render failed: \(name)-\(schemeName)")
        }
        let file = out.appendingPathComponent("widget-\(name)-\(schemeName).png")
        try png.write(to: file)
        print(file.path)
    }
}
}

try MainActor.assumeIsolated { try render() }
