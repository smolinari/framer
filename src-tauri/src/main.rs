// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build()) // Assuming you want to keep the logger plugin
    // .invoke_handler(tauri::generate_handler![setup_control_window_from_rust]) // Command removed
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
