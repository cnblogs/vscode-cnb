mod create;
mod del;
mod get_cnb_category_list;
mod update;

use crate::panic_hook;
use alloc::string::String;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = PostCategoryReq)]
pub struct PostCategoryReq {
    token: String,
    is_pat_token: bool,
}

#[wasm_bindgen(js_class = PostCategoryReq)]
impl PostCategoryReq {
    #[wasm_bindgen(constructor)]
    pub fn new(token: String, is_pat_token: bool) -> PostCategoryReq {
        panic_hook!();
        PostCategoryReq {
            token,
            is_pat_token,
        }
    }
}
