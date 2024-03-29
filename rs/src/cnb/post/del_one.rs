use crate::cnb::oauth::Token;
use crate::cnb::post::PostReq;
use crate::http::unit_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::ResultExt;
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = delOne)]
    pub async fn export_del_one(&self, post_id: usize) -> Result<(), String> {
        panic_hook!();
        let result = del_one(&self.token, post_id).await;
        result.err_to_string()
    }
}

async fn del_one(token: &Token, post_id: usize) -> Result<()> {
    let url = blog_backend!("/posts/{}", post_id);

    let client = reqwest::Client::new();

    let req = {
        let req = client.delete(url);
        setup_auth(req, &token.token, token.is_pat)
    };

    let resp = req.send().await?;
    unit_or_err(resp).await
}
