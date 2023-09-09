use crate::cnb::oauth::Token;
use crate::cnb::post::PostReq;
use crate::infra::http::{cons_query_string, setup_auth};
use crate::infra::result::ResultExt;
use crate::{blog_backend, panic_hook};
use alloc::string::String;
use alloc::{format, vec};
use anyhow::{anyhow, bail, Result};
use serde_json::Value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = getCount)]
    pub async fn export_get_count(&self) -> Result<usize, String> {
        panic_hook!();
        let result = get_count(&self.token).await;
        result.err_to_string()
    }
}

async fn get_count(token: &Token) -> Result<usize> {
    let query = vec![('p', 1), ('s', 1)];
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

    if code.is_success() {
        let obj: Value = serde_json::from_str(&body)?;
        let val = obj
            .get("postsCount")
            .and_then(|v| v.as_i64())
            .map(|v| v as usize);
        val.ok_or(anyhow!("Unable to parse resp json"))
    } else {
        bail!("{}: {}", code, body)
    }
}
