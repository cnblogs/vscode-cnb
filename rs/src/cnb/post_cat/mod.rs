mod create;
mod del;
mod get_all;
mod get_cnb_category_list;
mod get_one;
mod update;

use crate::panic_hook;
use alloc::string::String;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = PostCatReq)]
pub struct PostCatReq {
    token: String,
    is_pat_token: bool,
}

#[wasm_bindgen(js_class = PostCatReq)]
impl PostCatReq {
    #[wasm_bindgen(constructor)]
    pub fn new(token: String, is_pat_token: bool) -> PostCatReq {
        panic_hook!();
        PostCatReq {
            token,
            is_pat_token,
        }
    }
}
