extern "C" {
    fn wl_reload_widgets();
}

// macOS 위젯(widget/)에 지금 단계를 알린다
pub struct Widget;

impl Widget {
    // 앱 그룹 entitlement는 scripts/build-mac.sh가 위젯 확장을 넣을 때만 붙는다.
    // entitlement 없이 그룹 컨테이너를 건드리면 macOS가 권한을 묻기 때문에 dev 빌드와 확장 없는 빌드에서는 끈다
    pub fn detect() -> Option<Widget> {
        let exe = std::env::current_exe().ok()?;
        exe.parent()?.parent()?.join("PlugIns/WildLearningWidget.appex").is_dir().then_some(Widget)
    }

    pub fn reload(&self) {
        unsafe { wl_reload_widgets() }
    }
}
