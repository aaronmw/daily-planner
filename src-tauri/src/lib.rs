use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::ShortcutState;

#[cfg(target_os = "macos")]
fn set_development_dock_icon(app: &AppHandle) {
    if !app.config().identifier.ends_with(".dev") {
        return;
    }

    use objc2::{AllocAnyThread, MainThreadMarker};
    use objc2_app_kit::{NSApplication, NSImage};
    use objc2_foundation::NSData;

    let main_thread = unsafe { MainThreadMarker::new_unchecked() };
    let application = NSApplication::sharedApplication(main_thread);
    let icon_data = NSData::with_bytes(include_bytes!("../icons/dev-icon.png"));
    let icon = NSImage::initWithData(NSImage::alloc(), &icon_data)
        .expect("development Dock icon must be a valid image");

    unsafe { application.setApplicationIconImage(Some(&icon)) };
}

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
    let app = tauri::Builder::default()
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
        .build(tauri::generate_context!())
        .expect("error while running Daily Planner");

    app.run(|app, event| {
        #[cfg(target_os = "macos")]
        if matches!(event, tauri::RunEvent::Ready) {
            // Tauri selects the production ICNS whenever a development config
            // is merged with the bundle icon list. Override it after Tauri's
            // Ready handler so the unbundled development process has a framed
            // Dock icon without changing the production artwork.
            set_development_dock_icon(app);
        }
    });
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
