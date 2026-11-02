import Foundation
import WidgetKit

@_cdecl("wl_reload_widgets")
public func reloadWidgets() {
    WidgetCenter.shared.reloadAllTimelines()
}

// 컨테이너가 없으면 만든다. 돌려준 문자열은 호출한 쪽이 free로 지운다
@_cdecl("wl_group_container")
public func groupContainer(_ group: UnsafePointer<CChar>) -> UnsafeMutablePointer<CChar>? {
    FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: String(cString: group))
        .flatMap { strdup($0.path) }
}
