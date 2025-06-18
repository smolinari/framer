// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri_plugin_log::{Target, TargetKind};

fn main() {
    let mut tauri_builder = tauri::Builder::default().plugin(tauri_plugin_shell::init());

    // Conditional logging setup (moved from lib.rs)
    if cfg!(debug_assertions) {
        log::info!("Framer application backend is starting up (Debug Build)...");
        let debug_targets = [
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::LogDir {
                file_name: Some("framer_debug".into()),
            }),
            Target::new(TargetKind::Webview),
        ];
        tauri_builder = tauri_builder.plugin(
            tauri_plugin_log::Builder::default()
                .targets(debug_targets)
                .level(log::LevelFilter::Info)
                .build(),
        );
    } else {
        log::info!("Framer application backend is starting up (Production Build)...");
        let release_targets = [
            Target::new(TargetKind::LogDir {
                file_name: Some("framer_prod".into()),
            }),
            // Optionally add TargetKind::Stdout for release if needed, but usually just LogDir
        ];
        tauri_builder = tauri_builder.plugin(
            tauri_plugin_log::Builder::default()
                .targets(release_targets)
                .level(log::LevelFilter::Warn)
                .build(),
        );
    }

    tauri_builder
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        // .plugin(tauri_plugin_global_shortcut::init()) // Remove direct init if using setup
        .setup(|app| {
            #[cfg(desktop)] // Ensure this plugin is only initialized on desktop
            app.handle()
                .plugin(tauri_plugin_global_shortcut::Builder::new().build())?;
            // Add other setup logic here if needed
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
