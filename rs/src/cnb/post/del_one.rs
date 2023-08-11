use crate::cnb::post::{PostReq, API_BASE_URL};
use crate::http::unit_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::ResultExt;
use crate::panic_hook;
use alloc::format;
use alloc::string::String;
use anyhow::Result;
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
            unit_or_err(resp).await?
        };

        result.err_to_string()
    }
}
