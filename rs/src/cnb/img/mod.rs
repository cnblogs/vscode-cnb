mod download;
mod upload;

use crate::panic_hook;
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
