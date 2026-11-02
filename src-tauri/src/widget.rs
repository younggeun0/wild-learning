use std::ffi::{c_char, c_void, CStr, CString};
use std::fs;
use std::io;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

// widget/Sources의 AppGroup과 두 entitlements 파일이 같은 값을 쓴다
const APP_GROUP: &str = "TFLHLW3C9D.wild-learning";

extern "C" {
    fn wl_reload_widgets();
    fn wl_group_container(group: *const c_char) -> *mut c_char;
    fn free(ptr: *mut c_void);
}

// renderer의 Stage(session.ts). 위젯이 읽는 stage.json 모양 그대로다
#[derive(Clone, Serialize, Deserialize)]
pub struct Stage {
    pub mode: String,
    pub stage: String,
    pub substep: Option<String>,
    pub since: f64,
}

// macOS 위젯(widget/)과 앱 그룹 컨테이너로 주고받는다
pub struct Widget {
    container: PathBuf,
}

impl Widget {
    // 앱 그룹 entitlement는 scripts/build-mac.sh가 위젯 확장을 넣을 때만 붙는다.
    // entitlement 없이 그룹 컨테이너를 건드리면 macOS가 권한을 묻기 때문에 dev 빌드와 확장 없는 빌드에서는 끈다
    pub fn detect() -> Option<Widget> {
        let exe = std::env::current_exe().ok()?;
        if !exe.parent()?.parent()?.join("PlugIns/WildLearningWidget.appex").is_dir() {
            return None;
        }
        Some(Widget { container: group_container()? })
    }

    // 위젯이 반쯤 쓴 파일을 읽지 않도록 옆에 쓰고 바꿔 끼운다
    pub fn publish(&self, stage: &Stage) -> io::Result<()> {
        let tmp = self.container.join("stage.json.tmp");
        fs::write(&tmp, serde_json::to_vec(stage)?)?;
        fs::rename(&tmp, self.container.join("stage.json"))?;
        unsafe { wl_reload_widgets() };
        Ok(())
    }

    // 앱이 꺼지면 위젯은 시간을 멈추고 "앱을 실행해 주세요"를 보인다. 다시 켜면 renderer가 set_stage로 새로 쓴다
    pub fn clear(&self) {
        let _ = fs::remove_file(self.container.join("stage.json"));
        unsafe { wl_reload_widgets() };
    }

    // 위젯의 다음 버튼(widget/Sources/AdvanceIntent.swift)이 남긴 요청을 지운 만큼 센다.
    // 지우기는 한 번만 성공하므로 요청 하나가 두 번 넘기는 일은 없다
    pub fn take_advance_requests(&self) -> usize {
        let Ok(entries) = fs::read_dir(self.container.join("requests")) else {
            return 0;
        };
        entries
            .filter_map(|entry| entry.ok().map(|entry| entry.path()))
            .filter(|path| path.extension().is_some_and(|ext| ext == "advance"))
            .filter(|path| fs::remove_file(path).is_ok())
            .count()
    }
}

fn group_container() -> Option<PathBuf> {
    let group = CString::new(APP_GROUP).unwrap();
    unsafe {
        let ptr = wl_group_container(group.as_ptr());
        if ptr.is_null() {
            return None;
        }
        let path = PathBuf::from(CStr::from_ptr(ptr).to_string_lossy().into_owned());
        free(ptr.cast());
        Some(path)
    }
}
