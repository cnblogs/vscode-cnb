pub mod get;
pub mod post;
pub mod delete;

use alloc::string::String;
use core::convert::TryFrom;
use core::str::FromStr;
use reqwest::header::HeaderMap;
use serde_json::Value;
use wasm_bindgen::prelude::*;
use anyhow::Result;
use wasm_bindgen::__rt::std::collections::HashMap;
use crate::infra::result::IntoResult;

#[wasm_bindgen(js_name = RsHttp)]
pub struct RsHttp;

fn header_json_to_header_map(header_json: &str) -> Result<HeaderMap> {
    let header_json = Value::from_str(header_json)?;
    let header = serde_json::from_value::<HashMap<String, String>>(header_json)?;
    let header_map = HeaderMap::try_from(&header)?;

    header_map.into_ok()
}