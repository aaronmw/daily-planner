fn main() {
    println!("cargo:rerun-if-changed=icons/dev-icon.png");
    tauri_build::build()
}
