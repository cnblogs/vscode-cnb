mod create;
mod del;
mod get_all;
mod get_cnb_category_list;
mod get_one;
mod update;

use crate::cnb::oauth::Token;
use crate::panic_hook;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = PostCatReq)]
pub struct PostCatReq {
    token: Token,
}

#[wasm_bindgen(js_class = PostCatReq)]
impl PostCatReq {
    #[wasm_bindgen(constructor)]
    pub fn new(token: Token) -> PostCatReq {
        panic_hook!();
        PostCatReq { token }
    }
}
