pub mod del;
pub mod get;
pub mod post;
pub mod put;

use crate::infra::result::IntoResult;
use crate::panic_hook;
use alloc::string::String;
use anyhow::{bail, Result};
use core::convert::TryFrom;
use core::str::FromStr;
use reqwest::header::HeaderMap;
use reqwest::Response;
use serde_json::Value;
use wasm_bindgen::__rt::std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = RsHttp)]
pub struct RsHttp;

fn header_json_to_header_map(header_json: &str) -> Result<HeaderMap> {
    panic_hook!();
    let header_json = Value::from_str(header_json)?;
    let header = serde_json::from_value::<HashMap<String, String>>(header_json)?;
    let header_map = HeaderMap::try_from(&header)?;

    header_map.into_ok()
}

async fn body_or_err(resp: Response) -> Result<String> {
    let code = resp.status();
    let body = resp.text().await?;

    if code.is_success() {
        body.into_ok()
    } else {
        bail!("{}: {}", code, body)
    }
}
