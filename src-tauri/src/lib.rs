use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, Url, WebviewUrl, WebviewWindow};
use tauri_plugin_global_shortcut::ShortcutState;

const HOSTED_ORIGIN: &str = "https://aaronmw.github.io";
const HOSTED_PATH_PREFIX: &str = "/daily-planner";
const HOSTED_SHELL_GUARD: &str = r#"
(() => {
  const hosted = location.origin === 'https://aaronmw.github.io'
    && (location.pathname === '/daily-planner'
      || location.pathname.startsWith('/daily-planner/'));
  if (!hosted) return;

  let settled = false;
  let timer;
  const reveal = () => {
    settled = true;
    if (timer) clearTimeout(timer);
    document.documentElement.style.visibility = '';
  };
  const fail = message => {
    settled = true;
    if (timer) clearTimeout(timer);
    const render = () => {
      document.documentElement.style.visibility = '';
      document.body.replaceChildren();
      const main = document.createElement('main');
      main.setAttribute('role', 'alert');
      main.style.cssText = 'box-sizing:border-box;max-width:48rem;margin:10vh auto;padding:2rem;font:16px/1.5 system-ui,sans-serif';
      const title = document.createElement('h1');
      title.textContent = 'Daily Planner could not open safely';
      const detail = document.createElement('p');
      detail.textContent = message;
      const reassurance = document.createElement('p');
      reassurance.textContent = 'Your existing local data has not been deleted or reset.';
      main.append(title, detail, reassurance);
      document.body.append(main);
    };
    if (document.body) render();
    else document.addEventListener('DOMContentLoaded', render, { once: true });
  };

  Object.defineProperty(window, '__DAILY_PLANNER_HOSTED_SHELL__', {
    configurable: false,
    value: { fail, ready: reveal },
    writable: false,
  });
  document.addEventListener('DOMContentLoaded', () => {
    if (settled) return;
    document.documentElement.style.visibility = 'hidden';
    timer = setTimeout(() => fail(
      'The hosted Daily Planner build is not compatible with this desktop shell yet.'
    ), 35000);
  }, { once: true });
})();
"#;

#[derive(Debug)]
enum LegacyMigrationStage {
    Complete,
    Error(String),
    Pending,
    Ready(serde_json::Value),
}

#[derive(Debug)]
struct LegacyMigrationState {
    stage: Mutex<LegacyMigrationStage>,
}

impl Default for LegacyMigrationState {
    fn default() -> Self {
        Self {
            stage: Mutex::new(LegacyMigrationStage::Pending),
        }
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "status", rename_all = "lowercase")]
enum LegacyMigrationClaim {
    Complete,
    Error { message: String },
    Pending,
    Ready { payload: serde_json::Value },
}

impl LegacyMigrationState {
    fn claim(&self) -> LegacyMigrationClaim {
        match &*self.stage.lock().expect("legacy migration state poisoned") {
            LegacyMigrationStage::Complete => LegacyMigrationClaim::Complete,
            LegacyMigrationStage::Error(message) => LegacyMigrationClaim::Error {
                message: message.clone(),
            },
            LegacyMigrationStage::Pending => LegacyMigrationClaim::Pending,
            LegacyMigrationStage::Ready(payload) => LegacyMigrationClaim::Ready {
                payload: payload.clone(),
            },
        }
    }

    fn complete(&self) {
        *self.stage.lock().expect("legacy migration state poisoned") =
            LegacyMigrationStage::Complete;
    }

    fn fail(&self, message: String) {
        *self.stage.lock().expect("legacy migration state poisoned") =
            LegacyMigrationStage::Error(message);
    }

    fn publish(&self, payload: serde_json::Value) {
        *self.stage.lock().expect("legacy migration state poisoned") =
            LegacyMigrationStage::Ready(payload);
    }
}

fn is_allowed_webview_navigation(label: &str, url: &Url, development: bool) -> bool {
    if label == "legacy-migration" {
        return !development
            && url.scheme() == "tauri"
            && url.host_str() == Some("localhost")
            && url.path() == "/migration.html";
    }
    if label != "main" {
        return false;
    }
    if development {
        return url.scheme() == "http"
            && url.host_str() == Some("127.0.0.1")
            && url.port() == Some(1420);
    }
    url.origin().ascii_serialization() == HOSTED_ORIGIN
        && (url.path() == HOSTED_PATH_PREFIX
            || url.path().starts_with(&format!("{HOSTED_PATH_PREFIX}/")))
}

fn require_webview_label(window: &WebviewWindow, expected: &str) -> Result<(), String> {
    if window.label() == expected {
        Ok(())
    } else {
        Err("This command is not available to the requesting webview.".to_string())
    }
}

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

#[tauri::command]
fn publish_legacy_migration(
    payload: serde_json::Value,
    state: tauri::State<'_, LegacyMigrationState>,
    window: WebviewWindow,
) -> Result<(), String> {
    require_webview_label(&window, "legacy-migration")?;
    state.publish(payload);
    Ok(())
}

#[tauri::command]
fn publish_legacy_migration_error(
    message: String,
    state: tauri::State<'_, LegacyMigrationState>,
    window: WebviewWindow,
) -> Result<(), String> {
    require_webview_label(&window, "legacy-migration")?;
    state.fail(message);
    Ok(())
}

#[tauri::command]
fn claim_legacy_migration(
    state: tauri::State<'_, LegacyMigrationState>,
    window: WebviewWindow,
) -> Result<LegacyMigrationClaim, String> {
    require_webview_label(&window, "main")?;
    Ok(state.claim())
}

#[tauri::command]
fn complete_legacy_migration(
    app: AppHandle,
    state: tauri::State<'_, LegacyMigrationState>,
    window: WebviewWindow,
) -> Result<(), String> {
    require_webview_label(&window, "main")?;
    state.complete();
    if let Some(migration_window) = app.get_webview_window("legacy-migration") {
        migration_window
            .close()
            .map_err(|error| error.to_string())?;
    }
    Ok(())
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

fn hosted_shell_security_plugin<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new("hosted-shell-security")
        .js_init_script(HOSTED_SHELL_GUARD)
        .on_navigation(|webview, url| {
            let development = webview.app_handle().config().identifier.ends_with(".dev");
            is_allowed_webview_navigation(webview.label(), url, development)
        })
        .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(LegacyMigrationState::default())
        .plugin(hosted_shell_security_plugin())
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
        .setup(|app| {
            if !app.config().identifier.ends_with(".dev") {
                tauri::WebviewWindowBuilder::new(
                    app,
                    "legacy-migration",
                    WebviewUrl::App("migration.html".into()),
                )
                .title("Daily Planner data migration")
                .visible(false)
                .build()?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_dock_icon_accent,
            publish_legacy_migration,
            publish_legacy_migration_error,
            claim_legacy_migration,
            complete_legacy_migration
        ])
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
    use super::{
        deep_link_scheme_for_bundle_identifier, dock_icon_bytes, is_allowed_webview_navigation,
        DockIconAccent, LegacyMigrationClaim, LegacyMigrationState,
    };
    use serde_json::json;
    use tauri::Url;

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

    #[test]
    fn production_navigation_is_confined_to_the_hosted_app_path() {
        assert!(is_allowed_webview_navigation(
            "main",
            &Url::parse("https://aaronmw.github.io/daily-planner/").unwrap(),
            false,
        ));
        assert!(!is_allowed_webview_navigation(
            "main",
            &Url::parse("https://aaronmw.github.io/another-app/").unwrap(),
            false,
        ));
        assert!(!is_allowed_webview_navigation(
            "main",
            &Url::parse("https://example.com/daily-planner/").unwrap(),
            false,
        ));
        assert!(is_allowed_webview_navigation(
            "main",
            &Url::parse("http://127.0.0.1:1420/").unwrap(),
            true,
        ));
        assert!(!is_allowed_webview_navigation(
            "main",
            &Url::parse("https://aaronmw.github.io/daily-planner/").unwrap(),
            true,
        ));
        assert!(is_allowed_webview_navigation(
            "legacy-migration",
            &Url::parse("tauri://localhost/migration.html").unwrap(),
            false,
        ));
    }

    #[test]
    fn legacy_migration_state_is_explicit_and_one_way() {
        let state = LegacyMigrationState::default();
        assert!(matches!(state.claim(), LegacyMigrationClaim::Pending));

        state.publish(json!({ "version": 1, "records": [] }));
        assert!(matches!(state.claim(), LegacyMigrationClaim::Ready { .. }));

        state.complete();
        assert!(matches!(state.claim(), LegacyMigrationClaim::Complete));
    }
}
