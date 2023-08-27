use crate::cnb::ing::IngReq;
use crate::cnb::oauth::Token;
use crate::http::body_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::{HomoResult, ResultExt};
use crate::{openapi, panic_hook};
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = IngReq)]
impl IngReq {
    #[wasm_bindgen(js_name = getComment)]
    pub async fn export_get_comment(&self, ing_id: usize) -> HomoResult<String> {
        panic_hook!();
        let result = get_comment(&self.token, ing_id).await;
        result.homo_string()
    }
}

async fn get_comment(token: &Token, ing_id: usize) -> Result<String> {
    let url = openapi!("/statuses/{}/comments", ing_id);

    let client = reqwest::Client::new();

    let req = {
        let req = client.get(url);
        setup_auth(req, &token.token, token.is_pat)
    };

    let resp = req.send().await?;
    body_or_err(resp).await
}
