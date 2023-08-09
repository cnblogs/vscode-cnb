use crate::cnb::ing::IngReq;
use crate::infra::http::{setup_auth, APPLICATION_JSON};
use crate::infra::result::IntoResult;
use crate::panic_hook;
use alloc::string::{String, ToString};
use anyhow::{anyhow, Result};
use core::ops::Not;
use reqwest::header::CONTENT_TYPE;
use serde_json::json;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = IngReq)]
impl IngReq {
    #[wasm_bindgen(js_name = pub)]
    pub async fn export_pub(&self, content: &str, is_private: bool) -> Result<(), String> {
        panic_hook!();
        let url = "https://api.cnblogs.com/api/statuses";

        let body = json!({
            "content": content,
            "isPrivate": is_private,
        })
        .to_string();

        let client = reqwest::Client::new().post(url);

        let req = setup_auth(client, &self.token, self.is_pat_token)
            .header(CONTENT_TYPE, APPLICATION_JSON)
            .body(body);

        let result: Result<()> = try {
            let resp = req.send().await?;
            let code = resp.status();

            if code.is_success().not() {
                let text = resp.text().await?;
                anyhow!("{}: {}", code, text).into_err()?
            }
        };

        result.map_err(|e| e.to_string())
    }
}
