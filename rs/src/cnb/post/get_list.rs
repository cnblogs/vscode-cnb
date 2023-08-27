use crate::cnb::oauth::Token;
use crate::cnb::post::PostReq;
use crate::infra::http::{cons_query_string, setup_auth};
use crate::infra::result::{HomoResult, ResultExt};
use crate::{blog_backend, panic_hook};
use alloc::string::{String, ToString};
use alloc::{format, vec};
use anyhow::{anyhow, bail, Result};
use core::ops::Not;
use serde_json::Value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = getList)]
    pub async fn export_get_list(&self, page_index: usize, page_cap: usize) -> HomoResult<String> {
        panic_hook!();
        let post_list_json = get_list(&self.token, page_index, page_cap).await;
        post_list_json.homo_string()
    }
}

async fn get_list(token: &Token, page_index: usize, page_cap: usize) -> Result<String> {
    let query = vec![('t', 1), ('p', page_index), ('s', page_cap)];
    let query = cons_query_string(query);
    let url = blog_backend!("/posts/list?{}", query);

    let client = reqwest::Client::new();

    let req = {
        let req = client.get(url);
        setup_auth(req, &token.token, token.is_pat)
    };
    let resp = req.send().await?;

    let code = resp.status();
    let body = resp.text().await?;

    if code.is_success().not() {
        bail!("{}: {}", code, body)
    }

    let obj: Value = serde_json::from_str(&body)?;
    let val = obj.get("postList").map(|v| v.to_string());
    val.ok_or(anyhow!("Unable to parse resp json"))
}
