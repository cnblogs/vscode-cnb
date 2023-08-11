mod get_token;
mod revoke_token;

use crate::panic_hook;
use alloc::string::String;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = OauthReq)]
pub struct OauthReq {
    client_id: String,
    client_secret: String,
}

#[wasm_bindgen(js_class = OauthReq)]
impl OauthReq {
    #[wasm_bindgen(constructor)]
    pub fn new(client_id: String, client_secret: String) -> OauthReq {
        panic_hook!();
        OauthReq {
            client_id,
            client_secret,
        }
    }
}
