mod download;
mod from_data_url;
mod upload;

use crate::cnb::oauth::Token;
use crate::panic_hook;
use alloc::boxed::Box;
use alloc::string::String;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = ImgReq)]
pub struct ImgReq {
    token: Token,
}

#[wasm_bindgen(js_class = ImgReq)]
impl ImgReq {
    #[wasm_bindgen(constructor)]
    pub fn new(token: Token) -> ImgReq {
        panic_hook!();
        ImgReq { token }
    }
}

#[wasm_bindgen(js_name = ImgBytes, getter_with_clone)]
#[derive(Debug, PartialEq)]
pub struct ImgBytes {
    pub bytes: Box<[u8]>,
    pub mime: String,
}

#[wasm_bindgen(js_class = ImgBytes)]
impl ImgBytes {
    #[wasm_bindgen(constructor)]
    pub fn new(bytes: Box<[u8]>, mime: String) -> ImgBytes {
        panic_hook!();
        ImgBytes { bytes, mime }
    }
}
