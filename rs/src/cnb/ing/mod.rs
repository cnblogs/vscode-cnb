mod comment;
mod get_comment;
mod get_list;
mod r#pub;

use crate::panic_hook;
use alloc::string::{String, ToString};
use wasm_bindgen::prelude::*;

const ING_API_BASE_URL: &str = "https://api.cnblogs.com/api/statuses";

#[wasm_bindgen(js_name = IngReq)]
pub struct IngReq {
    token: String,
    is_pat_token: bool,
}

#[wasm_bindgen(js_class = IngReq)]
impl IngReq {
    #[wasm_bindgen(constructor)]
    pub fn new(token: &str, is_pat_token: bool) -> IngReq {
        panic_hook!();
        IngReq {
            token: token.to_string(),
            is_pat_token,
        }
    }
}
