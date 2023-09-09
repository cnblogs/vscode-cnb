use crate::cnb::oauth::Token;
use crate::cnb::post::PostReq;
use crate::http::body_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::{HomoResult, ResultExt};
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = getTemplate)]
    pub async fn export_get_template(&self) -> HomoResult<String> {
        panic_hook!();
        let result = get_template(&self.token).await;
        result.homo_string()
    }
}

async fn get_template(token: &Token) -> Result<String> {
    let url = blog_backend!("/posts/-1");

    let client = reqwest::Client::new();

    let req = {
        let req = client.get(url);
        setup_auth(req, &token.token, token.is_pat)
    };

    let resp = req.send().await?;
    body_or_err(resp).await
}
