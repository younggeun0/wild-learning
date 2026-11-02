#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod widget;

use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use widget::{Stage, Widget};

const ADVANCE_SHORTCUT: &str = "CmdOrCtrl+Shift+Space";
const TRAY_ID: &str = "main";

// renderer는 단계가 바뀔 때만 알려 준다. 웹뷰가 숨겨지거나 느려져도 메뉴 막대 시간은 여기서 계속 센다
#[derive(Default)]
struct TrayStage(Mutex<Option<(String, f64)>>);

#[tauri::command]
fn set_stage(app: AppHandle, tray: State<TrayStage>, widget: State<Option<Widget>>, label: String, stage: Stage) {
    *tray.0.lock().unwrap() = Some((label.clone(), stage.since));
    refresh_tray(&app, &label, stage.since);
    if let Some(Err(error)) = widget.inner().as_ref().map(|widget| widget.publish(&stage)) {
        eprintln!("widget stage write failed: {error}");
    }
}

fn refresh_tray(app: &AppHandle, label: &str, since: f64) {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).map_or(since, |d| d.as_millis() as f64);
    let s = ((now - since) / 1000.0).max(0.0) as u64;
    let (h, m, sec) = (s / 3600, s / 60 % 60, s % 60);
    let title = if h > 0 { format!("{label} {h}:{m:02}:{sec:02}") } else { format!("{label} {m}:{sec:02}") };
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let _ = tray.set_title(Some(title));
    }
}

// 작은 위젯 안에 띄우면 잘리므로 따로 창을 연다. async여야 명령 안에서 창을 만들 때 막히지 않는다
#[tauri::command]
async fn open_guide(app: AppHandle) {
    show_guide(&app);
}

fn show_guide(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("guide") {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }
    let built = WebviewWindowBuilder::new(app, "guide", WebviewUrl::App("index.html".into()))
        .title("야생 학습 사용법")
        .inner_size(360.0, 380.0)
        .min_inner_size(240.0, 200.0)
        .always_on_top(true)
        .center()
        .build();
    if let Err(error) = built {
        eprintln!("guide window failed: {error}");
    }
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let toggle = MenuItem::with_id(app, "toggle", "위젯 보이기/숨기기", true, None::<&str>)?;
    let guide = MenuItem::with_id(app, "guide", "사용법", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
    TrayIconBuilder::with_id(TRAY_ID)
        .title("야생 학습")
        .menu(&Menu::with_items(app, &[&toggle, &guide, &quit])?)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "toggle" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = if window.is_visible().unwrap_or(true) { window.hide() } else { window.show() };
                }
            }
            "guide" => show_guide(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;

    let app = app.clone();
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(1));
        let stage = app.state::<TrayStage>().0.lock().unwrap().clone();
        if let Some((label, since)) = stage {
            refresh_tray(&app, &label, since);
        }
    });
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(TrayStage::default())
        .manage(Widget::detect())
        .invoke_handler(tauri::generate_handler![set_stage, open_guide])
        .setup(|app| {
            let registered = app.global_shortcut().on_shortcut(ADVANCE_SHORTCUT, |app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    let _ = app.emit_to("main", "advance", ());
                }
            });
            match registered {
                Ok(()) => eprintln!("global shortcut registered: {ADVANCE_SHORTCUT}"),
                Err(error) => eprintln!("global shortcut {ADVANCE_SHORTCUT} failed: {error}"),
            }
            setup_tray(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
