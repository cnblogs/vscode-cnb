mod comment;
mod get_comment;
mod get_list;
mod r#pub;

use crate::panic_hook;
use alloc::string::{String, ToString};
use lazy_static::lazy_static;
use regex::Regex;
use wasm_bindgen::prelude::*;

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

#[wasm_bindgen(js_name = ingStarIconToText)]
pub fn ing_star_icon_to_text(icon: &str) -> String {
    lazy_static! {
        static ref REGEX: Regex = Regex::new(r#"<img.*alt="\[(.*?)]".*>"#).unwrap();
    }
    let caps = REGEX.captures(icon).unwrap();
    let star_text = caps.get(1).unwrap().as_str();
    star_text.to_string()
}
