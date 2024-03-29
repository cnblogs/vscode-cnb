use crate::http::{body_or_err, header_json_to_header_map, RsHttp};
use crate::infra::result::{HomoResult, ResultExt};
use crate::panic_hook;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(js_class = RsHttp)]
impl RsHttp {
    #[wasm_bindgen(js_name = del)]
    pub async fn export_del(url: &str, header_json: &str) -> HomoResult<String> {
        panic_hook!();
        let body = del(url, header_json).await;
        body.homo_string()
    }
}

async fn del(url: &str, header_json: &str) -> Result<String> {
    let header_map = header_json_to_header_map(header_json)?;

    let client = reqwest::Client::new();

    let req = client.delete(url).headers(header_map);
    let resp = req.send().await?;

    body_or_err(resp).await
}
