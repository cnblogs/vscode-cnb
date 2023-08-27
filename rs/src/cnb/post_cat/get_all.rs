use crate::cnb::oauth::Token;
use crate::cnb::post_cat::PostCatReq;
use crate::http::body_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::{HomoResult, ResultExt};
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostCatReq)]
impl PostCatReq {
    #[wasm_bindgen(js_name = getAll)]
    pub async fn export_get_all(&self) -> HomoResult<String> {
        panic_hook!();
        let result = get_all(&self.token).await;
        result.homo_string()
    }
}

async fn get_all(token: &Token) -> Result<String> {
    let url = blog_backend!("/v2/blog-category-types/1/categories");

    let client = reqwest::Client::new();

    let req = {
        let req = client.get(url);
        setup_auth(req, &token.token, token.is_pat)
    };

    let resp = req.send().await?;
    body_or_err(resp).await
}
