mod get_all;

use crate::cnb::oauth::Token;
use crate::panic_hook;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = PostTagReq)]
pub struct PostTagReq {
    token: Token,
}

#[wasm_bindgen(js_class = PostTagReq)]
impl PostTagReq {
    #[wasm_bindgen(constructor)]
    pub fn new(token: Token) -> PostTagReq {
        panic_hook!();
        PostTagReq { token }
    }
}
