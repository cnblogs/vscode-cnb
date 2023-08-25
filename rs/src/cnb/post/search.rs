use crate::cnb::post::PostReq;
use crate::infra::http::{cons_query_string, setup_auth};
use crate::infra::result::{HomoResult, IntoResult, ResultExt};
use crate::{blog_backend, panic_hook};
use alloc::string::{String, ToString};
use alloc::{format, vec};
use anyhow::{bail, Result};
use core::ops::Not;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = search)]
    pub async fn export_search(
        &self,
        page_index: usize,
        page_cap: usize,
        keyword: Option<String>,
        cat_id: Option<usize>,
    ) -> HomoResult<String> {
        panic_hook!();
        let json = search(self, page_index, page_cap, keyword, cat_id).await;
        json.homo_string()
    }
}

async fn search(
    req: &PostReq,
    page_index: usize,
    page_cap: usize,
    keyword: Option<String>,
    cat_id: Option<usize>,
) -> Result<String> {
    let query = {
        let mut query = vec![
            ("t", "1".to_string()),
            ("p", page_index.to_string()),
            ("s", page_cap.to_string()),
        ];
        if let Some(kw) = keyword {
            query.push(("search", kw))
        }
        if let Some(id) = cat_id {
            query.push(("cid", id.to_string()))
        }

        cons_query_string(query)
    };

    let url = blog_backend!("/posts/list?{}", query);

    let client = reqwest::Client::new().get(url);

    let req = setup_auth(client, &req.token, req.is_pat_token);
    let resp = req.send().await?;

    let code = resp.status();
    let body = resp.text().await?;

    if code.is_success().not() {
        bail!("{}: {}", code, body)
    }

    body.into_ok()
}
