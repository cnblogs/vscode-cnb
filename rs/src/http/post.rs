use crate::http::{body_or_err, header_json_to_header_map, RsHttp};
use crate::infra::result::IntoResult;
use alloc::string::{String, ToString};
use anyhow::Result;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(js_class = RsHttp)]
impl RsHttp {
    #[wasm_bindgen(js_name = post)]
    pub async fn export_post(url: &str, header_json: &str, body: String) -> Result<String, String> {
        let body = post(url, header_json, body).await;
        let Ok(body) = body else { return body.unwrap_err().to_string().into_err(); };

        body.into_ok()
    }
}

async fn post(url: &str, header_json: &str, body: String) -> Result<String> {
    let header_map = header_json_to_header_map(header_json)?;

    let client = reqwest::Client::new();

    let resp = client
        .post(url)
        .headers(header_map)
        .body(body)
        .send()
        .await?;

    body_or_err(resp).await
}
