mod del_one;
mod del_some;
mod get_count;
mod get_list;
mod get_one;
mod get_template;
mod search;
mod update;

use crate::panic_hook;
use alloc::string::String;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = PostReq)]
pub struct PostReq {
    token: String,
    is_pat_token: bool,
}

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(constructor)]
    pub fn new(token: String, is_pat_token: bool) -> PostReq {
        panic_hook!();
        PostReq {
            token,
            is_pat_token,
        }
    }
}
