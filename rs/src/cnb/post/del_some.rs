use crate::cnb::post::{PostReq, API_BASE_URL};
use crate::infra::http::{cons_query_string, setup_auth};
use crate::infra::result::IntoResult;
use crate::panic_hook;
use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec::Vec;
use anyhow::{anyhow, Result};
use core::ops::Not;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = delSome)]
    pub async fn export_del_some(&self, post_ids: &[usize]) -> Result<(), String> {
        panic_hook!();
        let post_ids: Vec<(&str, &usize)> = post_ids.iter().map(|id| ("postIds", id)).collect();
        let query = cons_query_string(post_ids);
        let url = format!("{}/bulk-operation/post?{}", API_BASE_URL, query);

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
