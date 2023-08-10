mod get_info;

use crate::panic_hook;
use alloc::string::{String, ToString};
use wasm_bindgen::prelude::*;

const OAUTH_API_BASE_URL: &str = "https://oauth.cnblogs.com";

#[wasm_bindgen(js_name = UserReq)]
pub struct UserReq {
    token: String,
    is_pat_token: bool,
}

#[wasm_bindgen(js_class = UserReq)]
impl UserReq {
    #[wasm_bindgen(constructor)]
    pub fn new(token: &str, is_pat_token: bool) -> UserReq {
        panic_hook!();
        UserReq {
            token: token.to_string(),
            is_pat_token,
        }
    }
}
