use crate::panic_hook;
use alloc::string::String;
use alloc::vec::Vec;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(js_name = RsText)]
struct RsText;

#[wasm_bindgen(js_class = RsText)]
impl RsText {
    #[wasm_bindgen(js_name = replaceWithByteOffset)]
    pub fn export_replace_with_byte_offset(
        raw: String,
        start: usize,
        end: usize,
        replace_with: String,
    ) -> String {
        panic_hook!();
        let mut vec: Vec<u8> = raw.as_bytes().to_vec();
        let replace_with = replace_with.as_bytes().iter().copied();
        vec.splice(start..end, replace_with);
        String::from_utf8(vec).unwrap()
    }
}
