#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Emitter;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

const ADVANCE_SHORTCUT: &str = "CmdOrCtrl+Shift+Space";

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
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
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
