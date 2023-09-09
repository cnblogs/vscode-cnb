mod get_info;

use crate::cnb::oauth::Token;
use crate::panic_hook;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = UserReq)]
pub struct UserReq {
    token: Token,
}

#[wasm_bindgen(js_class = UserReq)]
impl UserReq {
    #[wasm_bindgen(constructor)]
    pub fn new(token: Token) -> UserReq {
        panic_hook!();
        UserReq { token }
    }
}
