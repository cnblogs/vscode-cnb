use crate::cnb::oauth::Token;
use crate::cnb::post_cat::PostCatReq;
use crate::http::unit_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::ResultExt;
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::{String, ToString};
use anyhow::Result;
use mime::APPLICATION_JSON;
use reqwest::header::CONTENT_TYPE;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostCatReq)]
impl PostCatReq {
    #[wasm_bindgen(js_name = update)]
    pub async fn export_update(&self, cat_id: usize, cat_json: String) -> Result<(), String> {
        panic_hook!();
        let result = update(&self.token, cat_id, cat_json).await;
        result.err_to_string()
    }
}

async fn update(token: &Token, cat_id: usize, cat_json: String) -> Result<()> {
    let url = blog_backend!("/category/blog/{}", cat_id);

    let client = reqwest::Client::new();

    let req = {
        let req = client.put(url);
        let req = req
            .header(CONTENT_TYPE, APPLICATION_JSON.to_string())
            .body(cat_json);
        setup_auth(req, &token.token, token.is_pat)
    };

    let resp = req.send().await?;
    unit_or_err(resp).await
}
