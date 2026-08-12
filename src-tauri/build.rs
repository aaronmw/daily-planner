fn main() {
    println!("cargo:rerun-if-changed=icons/app-icon.svg");
    println!("cargo:rerun-if-changed=icons/dev-icon.png");
    println!("cargo:rerun-if-changed=icons/dock");
    tauri_build::build()
}
