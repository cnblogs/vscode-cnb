use crate::cnb::post::PostReq;
use crate::infra::http::{cons_query_string, setup_auth};
use crate::infra::result::{HomoResult, IntoResult, ResultExt};
use crate::{blog_backend, panic_hook};
use alloc::string::{String, ToString};
use alloc::{format, vec};
use anyhow::{anyhow, Result};
use serde_json::Value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = getList)]
    pub async fn export_get_list(&self, page_index: usize, page_cap: usize) -> HomoResult<String> {
        panic_hook!();
        let query = vec![('p', page_index), ('s', page_cap)];
        let query = cons_query_string(query);
        let url = blog_backend!("/posts/list?{}", query);

        let client = reqwest::Client::new().get(url);

        let req = setup_auth(client, &self.token, self.is_pat_token);

        let result: Result<String> = try {
            let resp = req.send().await?;
            let code = resp.status();
            let body = resp.text().await?;

            if code.is_success() {
                let obj: Value = serde_json::from_str(&body)?;
                let val = obj.get("postList").map(|v| v.to_string());
                val.expect("Unable to parse resp json")
            } else {
                anyhow!("{}: {}", code, body).into_err()?
            }
        };

        result.homo_string()
    }
}
