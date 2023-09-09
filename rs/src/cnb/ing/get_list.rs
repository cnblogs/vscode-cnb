use crate::cnb::ing::IngReq;
use crate::cnb::oauth::Token;
use crate::http::body_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::{HomoResult, ResultExt};
use crate::{openapi, panic_hook};
use alloc::string::String;
use alloc::{format, vec};
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = IngReq)]
impl IngReq {
    #[wasm_bindgen(js_name = getList)]
    pub async fn export_get_list(
        &self,
        page_index: usize,
        page_size: usize,
        ing_type: usize,
    ) -> HomoResult<String> {
        panic_hook!();
        let result = get_list(&self.token, page_index, page_size, ing_type).await;
        result.homo_string()
    }
}

async fn get_list(
    token: &Token,
    page_index: usize,
    page_size: usize,
    ing_type: usize,
) -> Result<String> {
    let url = openapi!("/statuses/@{}", ing_type);

    let client = reqwest::Client::new();

    let req = {
        let req = client.get(url);

        let queries = vec![("pageIndex", page_index), ("pageSize", page_size)];
        let req = req.query(&queries);

        setup_auth(req, &token.token, token.is_pat)
    };

    let resp = req.send().await?;
    body_or_err(resp).await
}
