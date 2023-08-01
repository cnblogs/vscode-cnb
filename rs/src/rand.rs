use crate::panic_hook;
use alloc::string::String;
use rand::distributions::Alphanumeric;
use rand::Rng;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(js_name = RsRand)]
struct RsRand;

#[wasm_bindgen(js_class = RsRand)]
impl RsRand {
    #[wasm_bindgen(js_name = string)]
    pub fn export_string(len: usize) -> String {
        panic_hook!();
        rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(len)
            .map(char::from)
            .collect()
    }
}

#[test]
fn test_export_string() {
    let r = RsRand::export_string(10);
    assert_eq!(r.len(), 10);
}
