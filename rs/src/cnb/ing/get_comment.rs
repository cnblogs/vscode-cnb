use crate::cnb::ing::{IngReq, ING_API_BASE_URL};
use crate::http::body_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::{HomoResult, ResultExt};
use crate::panic_hook;
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = IngReq)]
impl IngReq {
    #[wasm_bindgen(js_name = getComment)]
    pub async fn export_get_comment(&self, ing_id: usize) -> HomoResult<String> {
        panic_hook!();
        let url = format!("{}/{}/comments", ING_API_BASE_URL, ing_id);

        let client = reqwest::Client::new().get(url);

        let req = setup_auth(client, &self.token, self.is_pat_token);

        let result: Result<String> = try {
            let resp = req.send().await?;
            body_or_err(resp).await?
        };

        result.homo_string()
    }
}
