mod download;
mod from_data_url;
mod upload;

use crate::panic_hook;
use alloc::boxed::Box;
use alloc::string::{String, ToString};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = ImgReq)]
pub struct ImgReq {
    token: String,
    is_pat_token: bool,
}

#[wasm_bindgen(js_class = ImgReq)]
impl ImgReq {
    #[wasm_bindgen(constructor)]
    pub fn new(token: &str, is_pat_token: bool) -> ImgReq {
        panic_hook!();
        ImgReq {
            token: token.to_string(),
            is_pat_token,
        }
    }
}

#[wasm_bindgen(js_name = ImgBytes)]
#[derive(Debug, PartialEq)]
pub struct ImgBytes {
    bytes: Box<[u8]>,
    mime: String,
}

#[wasm_bindgen(js_class = ImgBytes)]
impl ImgBytes {
    #[wasm_bindgen(constructor)]
    pub fn new(bytes: Box<[u8]>, mime: String) -> ImgBytes {
        panic_hook!();
        ImgBytes { bytes, mime }
    }
    #[wasm_bindgen(getter, js_name = bytes)]
    pub fn bytes(&self) -> Box<[u8]> {
        panic_hook!();
        self.bytes.clone()
    }
    #[wasm_bindgen(getter, js_name = mime)]
    pub fn mime(&self) -> String {
        panic_hook!();
        self.mime.clone()
    }
}
