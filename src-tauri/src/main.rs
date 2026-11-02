#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod widget;

use std::time::Duration;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use widget::{Stage, Widget};

const ADVANCE_SHORTCUT: &str = "CmdOrCtrl+Shift+Space";
const TRAY_ID: &str = "main";

#[tauri::command]
fn set_stage(app: AppHandle, widget: State<Option<Widget>>, label: String, stage: Stage) {
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let _ = tray.set_title(Some(label));
    }
    if let Some(Err(error)) = widget.inner().as_ref().map(|widget| widget.publish(&stage)) {
        eprintln!("widget stage write failed: {error}");
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
    Ok(())
}

// 위젯의 다음 버튼 요청을 매초 가져가 전역 단축키와 같은 advance 이벤트로 넘긴다
fn spawn_request_poller(app: AppHandle) {
    std::thread::spawn(move || {
        let Some(widget) = app.state::<Option<Widget>>().inner() else {
            return;
        };
        // 앱이 꺼져 있을 때 누른 요청은 어느 단계에서 누른 것인지 알 수 없어 버린다
        widget.take_advance_requests();
        loop {
            std::thread::sleep(Duration::from_secs(1));
            for _ in 0..widget.take_advance_requests() {
                let _ = app.emit_to("main", "advance", ());
            }
        }
    });
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
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
            spawn_request_poller(app.handle().clone());
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(widget) = app.state::<Option<Widget>>().inner() {
                    widget.clear();
                }
            }
        })
}
