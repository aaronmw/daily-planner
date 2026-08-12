use serde::Deserialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::ShortcutState;

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
enum DockIconAccent {
    Amber,
    Cyan,
    Emerald,
    Green,
    Lime,
    Orange,
    Red,
    Sky,
    Teal,
    Yellow,
}

fn dock_icon_bytes(accent: Option<DockIconAccent>, development: bool) -> &'static [u8] {
    use DockIconAccent::*;

    match (accent, development) {
        (None, false) => include_bytes!("../icons/dock/default.png"),
        (None, true) => include_bytes!("../icons/dock/default-dev.png"),
        (Some(Amber), false) => include_bytes!("../icons/dock/amber.png"),
        (Some(Amber), true) => include_bytes!("../icons/dock/amber-dev.png"),
        (Some(Cyan), false) => include_bytes!("../icons/dock/cyan.png"),
        (Some(Cyan), true) => include_bytes!("../icons/dock/cyan-dev.png"),
        (Some(Emerald), false) => include_bytes!("../icons/dock/emerald.png"),
        (Some(Emerald), true) => include_bytes!("../icons/dock/emerald-dev.png"),
        (Some(Green), false) => include_bytes!("../icons/dock/green.png"),
        (Some(Green), true) => include_bytes!("../icons/dock/green-dev.png"),
        (Some(Lime), false) => include_bytes!("../icons/dock/lime.png"),
        (Some(Lime), true) => include_bytes!("../icons/dock/lime-dev.png"),
        (Some(Orange), false) => include_bytes!("../icons/dock/orange.png"),
        (Some(Orange), true) => include_bytes!("../icons/dock/orange-dev.png"),
        (Some(Red), false) => include_bytes!("../icons/dock/red.png"),
        (Some(Red), true) => include_bytes!("../icons/dock/red-dev.png"),
        (Some(Sky), false) => include_bytes!("../icons/dock/sky.png"),
        (Some(Sky), true) => include_bytes!("../icons/dock/sky-dev.png"),
        (Some(Teal), false) => include_bytes!("../icons/dock/teal.png"),
        (Some(Teal), true) => include_bytes!("../icons/dock/teal-dev.png"),
        (Some(Yellow), false) => include_bytes!("../icons/dock/yellow.png"),
        (Some(Yellow), true) => include_bytes!("../icons/dock/yellow-dev.png"),
    }
}

#[cfg(target_os = "macos")]
fn set_macos_dock_icon(development: bool, accent: Option<DockIconAccent>) -> Result<(), String> {
    use objc2::{AllocAnyThread, MainThreadMarker};
    use objc2_app_kit::{NSApplication, NSImage};
    use objc2_foundation::NSData;

    let main_thread = unsafe { MainThreadMarker::new_unchecked() };
    let application = NSApplication::sharedApplication(main_thread);
    let icon_data = NSData::with_bytes(dock_icon_bytes(accent, development));
    let icon = NSImage::initWithData(NSImage::alloc(), &icon_data)
        .ok_or_else(|| "Dock icon artwork could not be decoded".to_string())?;

    unsafe { application.setApplicationIconImage(Some(&icon)) };
    Ok(())
}

#[tauri::command]
fn set_dock_icon_accent(app: AppHandle, accent: Option<DockIconAccent>) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let development = app.config().identifier.ends_with(".dev");
        app.run_on_main_thread(move || {
            if let Err(error) = set_macos_dock_icon(development, accent) {
                eprintln!("failed to set Dock icon: {error}");
            }
        })
        .map_err(|error| error.to_string())
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, accent);
        Ok(())
    }
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
        .invoke_handler(tauri::generate_handler![set_dock_icon_accent])
        .build(tauri::generate_context!())
        .expect("error while running Daily Planner");

    app.run(|app, event| {
        #[cfg(target_os = "macos")]
        if matches!(event, tauri::RunEvent::Ready) && app.config().identifier.ends_with(".dev") {
            // Tauri selects the production ICNS whenever a development config
            // is merged with the bundle icon list. Override it after Tauri's
            // Ready handler so the unbundled development process has a framed
            // Dock icon without changing the production artwork.
            if let Err(error) = set_macos_dock_icon(true, None) {
                eprintln!("failed to set development Dock icon: {error}");
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::{deep_link_scheme_for_bundle_identifier, dock_icon_bytes, DockIconAccent};

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

    #[test]
    fn dock_icons_cover_fallback_accent_and_development_artwork() {
        let fallback = dock_icon_bytes(None, false);
        let red = dock_icon_bytes(Some(DockIconAccent::Red), false);
        let red_dev = dock_icon_bytes(Some(DockIconAccent::Red), true);

        assert_eq!(&fallback[1..4], b"PNG");
        assert_eq!(&red[1..4], b"PNG");
        assert_eq!(&red_dev[1..4], b"PNG");
        assert_ne!(fallback, red);
        assert_ne!(red, red_dev);
    }
}
