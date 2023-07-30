use crate::infra::result::IntoResult;
use alloc::string::{String, ToString};
use anyhow::Result;
use core::convert::TryFrom;
use core::str::FromStr;
use reqwest::header::HeaderMap;
use serde_json::Value;
use wasm_bindgen::__rt::std::collections::HashMap;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(js_name = RsHttp)]
struct RsHttp;

#[wasm_bindgen(js_class = RsHttp)]
impl RsHttp {
    #[wasm_bindgen(js_name = get)]
    pub async fn export_get(url: &str, header_json: &str) -> Result<String, String> {
        let body = get(url, header_json).await;
        let Ok(body) = body else { return body.unwrap_err().to_string().into_err(); };

        Ok(body)
    }
}

async fn get(url: &str, header_json: &str) -> Result<String> {
    let header_json = Value::from_str(header_json)?;
    let header = serde_json::from_value::<HashMap<String, String>>(header_json)?;
    let header = HeaderMap::try_from(&header)?;

    let client = reqwest::Client::new();

    let resp = client.get(url).headers(header).send().await?;

    let body = resp.text().await?;

    Ok(body)
}
