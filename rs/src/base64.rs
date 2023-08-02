use crate::infra::result::{homo_result_string, HomoResult, IntoResult};
use crate::panic_hook;
use alloc::string::String;
use anyhow::Result;
use base64::{engine::general_purpose, Engine as _};
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(js_name = RsBase64)]
struct RsBase64;

#[wasm_bindgen(js_class = RsBase64)]
impl RsBase64 {
    #[wasm_bindgen(js_name = encode)]
    pub fn export_encode(text: String) -> String {
        panic_hook!();
        general_purpose::STANDARD.encode(text)
    }
    #[wasm_bindgen(js_name = decode)]
    pub fn export_decode(base64: &str) -> HomoResult<String> {
        panic_hook!();
        let text = decode(base64);

        homo_result_string(text)
    }

    #[wasm_bindgen(js_name = encodeUrl)]
    pub fn export_encode_url(text: String) -> String {
        panic_hook!();
        base64url::encode(text)
    }
    #[wasm_bindgen(js_name = decodeUrl)]
    pub fn export_decode_url(base64url: &str) -> HomoResult<String> {
        panic_hook!();
        let text = decode_url(base64url);

        homo_result_string(text)
    }
}

pub fn decode(base64: &str) -> Result<String> {
    let vec = general_purpose::STANDARD.decode(base64)?;
    let text = String::from_utf8(vec)?;

    text.into_ok()
}

pub fn decode_url(base64url: &str) -> Result<String> {
    let vec = base64url::decode(base64url)?;
    let text = String::from_utf8(vec)?;

    text.into_ok()
}

#[test]
fn test_encode_decode() {
    use alloc::string::ToString;
    let text = "hola".to_string();
    let base64 = RsBase64::export_encode(text.clone());
    assert_eq!(base64, "aG9sYQ==");
    let decoded = RsBase64::export_decode(&base64);
    assert_eq!(decoded, Ok(text));
}
