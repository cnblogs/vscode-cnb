mod comment;
mod get_comment;
mod get_list;
mod publish;

use crate::cnb::oauth::Token;
use crate::panic_hook;
use alloc::string::{String, ToString};
use lazy_static::lazy_static;
use regex::Regex;
use serde_repr::{Deserialize_repr, Serialize_repr};
use wasm_bindgen::prelude::*;

#[derive(Clone, Debug, Serialize_repr, Deserialize_repr)]
#[repr(u8)]
pub enum IngSendFrom {
    None = 0,
    Ms = 1,
    GTalk = 2,
    Qq = 3,
    Sms = 5,
    CellPhone = 6,
    Web = 8,
    VsCode = 9,
    Cli = 13,
}

#[wasm_bindgen(js_name = IngReq)]
pub struct IngReq {
    token: Token,
}

#[wasm_bindgen(js_class = IngReq)]
impl IngReq {
    #[wasm_bindgen(constructor)]
    pub fn new(token: Token) -> IngReq {
        panic_hook!();
        IngReq { token }
    }
}

#[wasm_bindgen(js_name = ingStarIconToText)]
pub fn ing_star_tag_to_text(icon: &str) -> String {
    lazy_static! {
        static ref REGEX: Regex = Regex::new(r#"<img.*alt="\[(.*?)]"(\n|.)*>"#).unwrap();
    }
    let caps = REGEX.captures(icon).unwrap();
    let star_text = caps.get(1).unwrap().as_str();
    star_text.to_string()
}
