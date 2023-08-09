use crate::cnb::ing::IngReq;
use crate::infra::http::setup_auth;
use crate::infra::result::{homo_result_string, HomoResult, IntoResult};
use crate::panic_hook;
use alloc::format;
use alloc::string::String;
use anyhow::{anyhow, Result};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = IngReq)]
impl IngReq {
    #[wasm_bindgen(js_name = getComment)]
    pub async fn export_get_comment(&self, ing_id: usize) -> HomoResult<String> {
        panic_hook!();
        let url = format!("https://api.cnblogs.com/api/statuses/{}/comments", ing_id);

        let client = reqwest::Client::new().get(url);

        let req = setup_auth(client, &self.token, self.is_pat_token);

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
