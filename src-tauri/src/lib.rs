use tauri::{WebviewUrl, WebviewWindowBuilder};

// The app opens the real YouTube site and injects inject.js into it:
// ad blocking, SponsorBlock, themes, Shorts hiding, update notice.
const INJECT: &str = include_str!("inject.js");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let script = format!(
                "window.__YTPRO_VERSION__=\"{}\";\n{}",
                env!("CARGO_PKG_VERSION"),
                INJECT
            );
            let url = "https://www.youtube.com/".parse().unwrap();
            let builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
                .initialization_script(&script);

            #[cfg(desktop)]
            let builder = builder
                .title("YouTube Pro")
                .inner_size(1280.0, 800.0)
                .min_inner_size(400.0, 600.0);

            builder.build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running YouTube Pro");
}
