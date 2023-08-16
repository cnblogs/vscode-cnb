use crate::panic_hook;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use regex::Regex;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(typescript_custom_section)]
const _: &str = r"
export type RsMatch = { byte_offset: number, groups: string[] }
";

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct RsMatch {
    byte_offset: usize,
    groups: Vec<String>,
}

#[wasm_bindgen(js_name = RsRegex)]
pub struct RsRegex;

#[wasm_bindgen(js_class = RsRegex)]
impl RsRegex {
    #[wasm_bindgen(js_name = isMatch)]
    pub fn export_is_match(regex: &str, text: &str) -> bool {
        panic_hook!();
        let regex = Regex::new(regex);
        let Ok(regex) = regex else { return false; };

        regex.is_match(text)
    }

    #[wasm_bindgen(js_name = matches)]
    pub fn export_matches(regex: &str, text: &str) -> JsValue {
        panic_hook!();
        let ret = matches(regex, text);
        serde_wasm_bindgen::to_value(&ret).unwrap()
    }
}

fn matches(regex: &str, text: &str) -> Vec<RsMatch> {
    let regex = Regex::new(regex);
    let Ok(regex) = regex else { return vec![]; };

    regex
        .captures_iter(text)
        .map(|caps| {
            let byte_offset = caps.get(0).unwrap().start();
            let groups = caps
                .iter()
                .map(|m| m.map(|s| s.as_str()).unwrap_or("").to_string())
                .collect();

            RsMatch {
                byte_offset,
                groups,
            }
        })
        .collect()
}

#[test]
fn test_matches() {
    let text = "![img](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAQCAYAAADNo/U5AAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAAtdEVYdENyZWF0aW9uIFRpbWUARnJpIDE0IEp1bCAyMDIzIDExOjAzOjAwIEFNIENTVCKwI9kAAACwSURBVCiR7dK/DsFwFMXx76WNLrUR7Jq+hcRTGD2C0XuYvISIRYLEKDFLTBYmpP41oaXyM4iIomnMznhOPtO9cvTOilC8yZRZpYpeyGP12uGZxFsTI38UhZT8gCSVumPvFB/p2QwAwWbH9eDGQ8m0iWEXAdi2Oq+jUsinNwJwB0PmtTqIYJZLGLYFvo87Gn9HAPtun1WjyXm+eJYi0eiRYLnm4jiIpqEXcvFQOD8d9wYk9T77dSRnWwAAAABJRU5ErkJggg==)";
    let regex = r#"(!\[.*?]\()(data:image\/.*?,[a-zA-Z0-9+/]*?=?=?)\)"#;
    let mgs = matches(regex, text);
    let expect = vec![RsMatch {
        byte_offset: 0,
        groups: vec![
            "![img](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAQCAYAAADNo/U5AAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAAtdEVYdENyZWF0aW9uIFRpbWUARnJpIDE0IEp1bCAyMDIzIDExOjAzOjAwIEFNIENTVCKwI9kAAACwSURBVCiR7dK/DsFwFMXx76WNLrUR7Jq+hcRTGD2C0XuYvISIRYLEKDFLTBYmpP41oaXyM4iIomnMznhOPtO9cvTOilC8yZRZpYpeyGP12uGZxFsTI38UhZT8gCSVumPvFB/p2QwAwWbH9eDGQ8m0iWEXAdi2Oq+jUsinNwJwB0PmtTqIYJZLGLYFvo87Gn9HAPtun1WjyXm+eJYi0eiRYLnm4jiIpqEXcvFQOD8d9wYk9T77dSRnWwAAAABJRU5ErkJggg==)".to_string(),
            "![img](".to_string(),
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAQCAYAAADNo/U5AAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAAtdEVYdENyZWF0aW9uIFRpbWUARnJpIDE0IEp1bCAyMDIzIDExOjAzOjAwIEFNIENTVCKwI9kAAACwSURBVCiR7dK/DsFwFMXx76WNLrUR7Jq+hcRTGD2C0XuYvISIRYLEKDFLTBYmpP41oaXyM4iIomnMznhOPtO9cvTOilC8yZRZpYpeyGP12uGZxFsTI38UhZT8gCSVumPvFB/p2QwAwWbH9eDGQ8m0iWEXAdi2Oq+jUsinNwJwB0PmtTqIYJZLGLYFvo87Gn9HAPtun1WjyXm+eJYi0eiRYLnm4jiIpqEXcvFQOD8d9wYk9T77dSRnWwAAAABJRU5ErkJggg==".to_string(),
        ],
    }];
    assert_eq!(mgs, expect);
}
