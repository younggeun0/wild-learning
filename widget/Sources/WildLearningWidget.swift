import SwiftUI
import WidgetKit

struct StageEntry: TimelineEntry {
    let date: Date
    let stage: Stage?
}

// 단계가 바뀌면 앱이 다시 읽으라고 알려 주므로 새 타임라인을 예약하지 않는다
struct StageProvider: TimelineProvider {
    func placeholder(in context: Context) -> StageEntry {
        StageEntry(date: .now, stage: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (StageEntry) -> Void) {
        completion(StageEntry(date: .now, stage: Stage.load() ?? (context.isPreview ? .sample : nil)))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StageEntry>) -> Void) {
        completion(Timeline(entries: [StageEntry(date: .now, stage: Stage.load())], policy: .never))
    }
}

struct StageEntryView: View {
    let entry: StageEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        StageWidgetView(stage: entry.stage, family: family)
            .containerBackground(for: .widget) { WidgetBackground() }
    }
}

@main
struct WildLearningWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "WildLearningStage", provider: StageProvider()) { entry in
            StageEntryView(entry: entry)
        }
        .configurationDisplayName("야생학습")
        .description("지금 주의가 머문 모드")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
