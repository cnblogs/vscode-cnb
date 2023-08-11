use crate::http::{body_or_err, header_json_to_header_map, RsHttp};
use crate::infra::result::{HomoResult, ResultExt};
use crate::panic_hook;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(js_class = RsHttp)]
impl RsHttp {
    #[wasm_bindgen(js_name = get)]
    pub async fn export_get(url: &str, header_json: &str) -> HomoResult<String> {
        panic_hook!();
        let body = get(url, header_json).await;

        body.homo_string()
    }
}

async fn get(url: &str, header_json: &str) -> Result<String> {
    let header_map = header_json_to_header_map(header_json)?;

    let client = reqwest::Client::new();

    let resp = client.get(url).headers(header_map).send().await?;

    body_or_err(resp).await
}
