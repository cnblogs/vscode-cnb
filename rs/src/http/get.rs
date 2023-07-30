use crate::http::{header_json_to_header_map, RsHttp};
use crate::infra::result::IntoResult;
use alloc::string::{String, ToString};
use anyhow::Result;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(js_class = RsHttp)]
impl RsHttp {
    #[wasm_bindgen(js_name = get)]
    pub async fn export_get(url: &str, header_json: &str) -> Result<String, String> {
        let body = get(url, header_json).await;
        let Ok(body) = body else { return body.unwrap_err().to_string().into_err(); };

        body.into_ok()
    }
}

async fn get(url: &str, header_json: &str) -> Result<String> {
    let header_map = header_json_to_header_map(header_json)?;

    let client = reqwest::Client::new();

    let resp = client.get(url).headers(header_map).send().await?;

    let body = resp.text().await?;

    body.into_ok()
}
