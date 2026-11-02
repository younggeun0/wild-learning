import Foundation

enum AppGroup {
    // src-tauri/src/widget.rs의 APP_GROUP, 두 entitlements 파일과 같은 값
    static let id = "TFLHLW3C9D.wild-learning"
    static var container: URL? { FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: id) }
}

// 앱(src-tauri/src/widget.rs)이 단계가 바뀔 때마다 쓰고, 꺼질 때 지우는 stage.json
struct Stage: Decodable, Equatable {
    let stage: String
    let substep: String?

    static func load() -> Stage? {
        guard let url = AppGroup.container?.appendingPathComponent("stage.json"),
              let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(Stage.self, from: data)
    }

    static let sample = Stage(stage: "액관해", substep: "관찰")
}
