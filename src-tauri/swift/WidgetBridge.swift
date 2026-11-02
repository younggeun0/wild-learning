import WidgetKit

@_cdecl("wl_reload_widgets")
public func reloadWidgets() {
    WidgetCenter.shared.reloadAllTimelines()
}
