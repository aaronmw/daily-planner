use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::ShortcutState;

fn deep_link_scheme_for_bundle_identifier(bundle_identifier: &str) -> &'static str {
    if bundle_identifier.ends_with(".dev") {
        "daily-planner-dev://"
    } else {
        "daily-planner://"
    }
}

fn show_planner_window(app: &AppHandle) {
    #[cfg(target_os = "macos")]
    let _ = app.show();

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            show_planner_window(app);
            let deep_link_scheme = deep_link_scheme_for_bundle_identifier(&app.config().identifier);
            let deep_links: Vec<String> = args
                .into_iter()
                .filter(|argument| argument.starts_with(deep_link_scheme))
                .collect();
            if !deep_links.is_empty() {
                let _ = app.emit("daily-planner://single-instance-deep-links", deep_links);
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        show_planner_window(app);
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running Daily Planner");
}

#[cfg(test)]
mod tests {
    use super::deep_link_scheme_for_bundle_identifier;

    #[test]
    fn production_and_development_deep_links_are_isolated() {
        assert_eq!(
            deep_link_scheme_for_bundle_identifier("com.aaronwright.dailyplanner"),
            "daily-planner://"
        );
        assert_eq!(
            deep_link_scheme_for_bundle_identifier("com.aaronwright.dailyplanner.dev"),
            "daily-planner-dev://"
        );
    }
}
