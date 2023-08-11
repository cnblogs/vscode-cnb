use crate::cnb::post::{PostReq, API_BASE_URL};
use crate::infra::http::setup_auth;
use crate::infra::result::IntoResult;
use crate::panic_hook;
use alloc::format;
use alloc::string::{String, ToString};
use anyhow::{anyhow, Result};
use core::ops::Not;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = delOne)]
    pub async fn export_del_one(&self, post_id: usize) -> Result<(), String> {
        panic_hook!();
        let url = format!("{}/posts/{}", API_BASE_URL, post_id);

        let client = reqwest::Client::new().delete(url);

        let req = setup_auth(client, &self.token, self.is_pat_token);

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
