use std::ops::Not;
use wasm_bindgen::prelude::*;
use regex::Regex;

#[wasm_bindgen(js_name = "isRegMatch")]
pub fn is_reg_match(reg: &str, str: &str) -> bool {
    let reg = Regex::new(reg);
    if reg.is_err() {
        return false;
    }
    reg.unwrap().is_match(str)
}

#[test]
fn test_is_reg_match() {
    let text = "https://img2023.cnblogs.com/blog/2993952/202307/2993952-20230726164744582-682495539.png";
    let reg = r"\.cnblogs\.com\/";
    assert!(is_reg_match(reg, text))
}


#[wasm_bindgen(js_name = "notRegMatch")]
pub fn not_reg_match(reg: &str, str: &str) -> bool {
    is_reg_match(reg, str).not()
}
