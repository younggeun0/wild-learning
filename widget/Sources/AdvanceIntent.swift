import AppIntents
import Foundation

// 위젯은 앱 웹뷰의 세션을 바꿀 수 없어서 요청 파일만 남긴다. 앱(src-tauri/src/widget.rs)이 1초마다 가져가 다음 정거장으로 넘긴다
struct AdvanceIntent: AppIntent {
    static let title: LocalizedStringResource = "다음 정거장"
    static let isDiscoverable = false

    func perform() async throws -> some IntentResult {
        guard let container = AppGroup.container else { throw CocoaError(.fileNoSuchFile) }
        let before = Stage.load()
        let requests = container.appendingPathComponent("requests", isDirectory: true)
        try FileManager.default.createDirectory(at: requests, withIntermediateDirectories: true)
        try Data().write(to: requests.appendingPathComponent("\(UUID().uuidString).advance"))
        // perform이 끝나면 WidgetKit이 위젯을 다시 그린다. 앱이 stage.json을 고칠 때까지 기다려야 새 단계가 그려진다
        let deadline = Date.now.addingTimeInterval(2.5)
        while Stage.load() == before, Date.now < deadline {
            try await Task.sleep(for: .milliseconds(100))
        }
        return .result()
    }
}
