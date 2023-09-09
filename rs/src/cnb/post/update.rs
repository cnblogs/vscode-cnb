use crate::cnb::oauth::Token;
use crate::cnb::post::PostReq;
use crate::http::body_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::{HomoResult, ResultExt};
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::{String, ToString};
use anyhow::Result;
use mime::APPLICATION_JSON;
use reqwest::header::CONTENT_TYPE;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = update)]
    pub async fn export_update(&self, post_json: &str) -> HomoResult<String> {
        panic_hook!();
        let result = update(&self.token, post_json).await;
        result.homo_string()
    }
}

async fn update(token: &Token, post_json: &str) -> Result<String> {
    let url = blog_backend!("/posts");

    let client = reqwest::Client::new();

    let req = {
        let req = client
            .post(url)
            .header(CONTENT_TYPE, APPLICATION_JSON.to_string())
            .body(post_json.to_string());
        setup_auth(req, &token.token, token.is_pat)
    };

    let resp = req.send().await?;
    body_or_err(resp).await
}
