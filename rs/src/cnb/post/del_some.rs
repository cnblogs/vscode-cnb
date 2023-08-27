use crate::cnb::oauth::Token;
use crate::cnb::post::PostReq;
use crate::http::unit_or_err;
use crate::infra::http::{cons_query_string, setup_auth};
use crate::infra::result::ResultExt;
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::String;
use alloc::vec::Vec;
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = delSome)]
    pub async fn export_del_some(&self, post_ids: &[usize]) -> Result<(), String> {
        panic_hook!();
        let result = del_some(&self.token, post_ids).await;
        result.err_to_string()
    }
}

async fn del_some(token: &Token, post_ids: &[usize]) -> Result<()> {
    let post_ids: Vec<(&str, &usize)> = post_ids.iter().map(|id| ("postIds", id)).collect();
    let query = cons_query_string(post_ids);
    let url = blog_backend!("/bulk-operation/post?{}", query);

    let client = reqwest::Client::new();

    let req = {
        let req = client.delete(url);
        setup_auth(req, &token.token, token.is_pat)
    };

    let resp = req.send().await?;
    unit_or_err(resp).await
}
