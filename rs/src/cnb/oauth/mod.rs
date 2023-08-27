mod get_token;
mod revoke_token;

use crate::panic_hook;
use alloc::string::String;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = OauthReq)]
pub struct OauthReq {
    client_id: String,
    client_sec: String,
}

#[wasm_bindgen(js_class = OauthReq)]
impl OauthReq {
    #[wasm_bindgen(constructor)]
    pub fn new(client_id: String, client_sec: String) -> OauthReq {
        panic_hook!();
        OauthReq {
            client_id,
            client_sec,
        }
    }
}

#[wasm_bindgen(getter_with_clone)]
pub struct Token {
    pub token: String,
    pub is_pat: bool,
}

#[wasm_bindgen(js_class = Token)]
impl Token {
    #[wasm_bindgen(constructor)]
    pub fn new(token: String, is_pat_token: bool) -> Token {
        panic_hook!();
        Token {
            token,
            is_pat: is_pat_token,
        }
    }
}
