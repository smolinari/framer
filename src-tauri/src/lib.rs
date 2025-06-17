use tauri_plugin_log::{Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    if cfg!(debug_assertions) {
            let targets = [
                Target::new(TargetKind::Stdout),
                Target::new(TargetKind::LogDir { file_name: None }), // None uses default "app.log"
                // Target::new(TargetKind::Webview), // Uncomment to send logs to webview console too
            ];
        builder = builder.plugin(
            tauri_plugin_log::Builder::default()
                    .targets(targets)
                .level(log::LevelFilter::Info) // Set log level for debug builds
                .build(),
        );
    } else {
        // Optionally, configure a different logger for release builds or no logger
        // builder = builder.plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Warn).build());
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
