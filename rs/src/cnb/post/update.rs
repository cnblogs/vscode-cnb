use crate::cnb::post::{PostReq, API_BASE_URL};
use crate::infra::http::{setup_auth, APPLICATION_JSON};
use crate::infra::result::{homo_result_string, HomoResult, IntoResult};
use crate::panic_hook;
use alloc::format;
use alloc::string::String;
use anyhow::{anyhow, Result};
use reqwest::header::CONTENT_TYPE;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = update)]
    pub async fn export_update(&self, post_json: String) -> HomoResult<String> {
        panic_hook!();
        let url = format!("{}/posts", API_BASE_URL);

        let client = reqwest::Client::new().post(url);

        let req = setup_auth(client, &self.token, self.is_pat_token)
            .header(CONTENT_TYPE, APPLICATION_JSON)
            .body(post_json);

        let result: Result<String> = try {
            let resp = req.send().await?;
            let code = resp.status();

            if code.is_success() {
                resp.text().await?
            } else {
                let text = resp.text().await?;
                anyhow!("{}: {}", code, text).into_err()?
            }
        };

        homo_result_string(result)
    }
}
