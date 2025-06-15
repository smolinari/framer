// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager; // Required for app_handle().get_webview_window()

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build()) // Assuming you want to keep the logger plugin
    .on_window_event(|window, event| {
        // Listen for the close request on the "control" window
        println!("Window event on label: {}, event: {:?}", window.label(), event);
        if window.label() == "control" {
            println!("Event is on 'control' window.");
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                println!("'control' window: CloseRequested event received.");
                // Attempt to get and close the main window
                if let Some(main_window) = window.app_handle().get_webview_window("main") {
                    println!("Found 'main' window. Attempting to close it.");
                    let _ = main_window.close(); // This will close the main framer window
                } else {
                    println!("'main' window not found when 'control' window close was requested.");
                }
                // The control window will then close, and if it's the last one, the app will exit.
            }
        }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
