use crate::cnb::ing::IngReq;
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
        let url = openapi!("/statuses/@{}", ing_type);

        let client = reqwest::Client::new().get(url);

        let queries = vec![("pageIndex", page_index), ("pageSize", page_size)];
        let req = setup_auth(client, &self.token, self.is_pat_token).query(&queries);

        let result: Result<String> = try {
            let resp = req.send().await?;
            body_or_err(resp).await?
        };

        result.homo_string()
    }
}
