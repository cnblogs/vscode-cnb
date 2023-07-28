use wasm_bindgen::prelude::*;
use regex::Regex;

#[wasm_bindgen(js_name = RsRegex)]
pub struct RsRegex;

#[wasm_bindgen(js_class = RsRegex)]
impl RsRegex {
    #[wasm_bindgen(js_name = isMatch)]
    pub fn is_match(regex: &str, text: &str) -> bool {
        let regex = Regex::new(regex);
        let Ok(regex) = regex else { return false; };

        regex.is_match(text)
    }
}

