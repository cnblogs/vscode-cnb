use crate::cnb::post::PostReq;
use crate::infra::http::{cons_query_string, setup_auth};
use crate::infra::result::{IntoResult, ResultExt};
use crate::{blog_backend, panic_hook};
use alloc::string::String;
use alloc::{format, vec};
use anyhow::{anyhow, Result};
use serde_json::Value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostReq)]
impl PostReq {
    #[wasm_bindgen(js_name = getCount)]
    pub async fn export_get_count(&self) -> Result<usize, String> {
        panic_hook!();
        let query = vec![('p', 1), ('s', 1)];
        let query = cons_query_string(query);
        let url = blog_backend!("/posts/list?{}", query);

        let client = reqwest::Client::new().get(url);

        let req = setup_auth(client, &self.token, self.is_pat_token);

        let result: Result<usize> = try {
            let resp = req.send().await?;
            let code = resp.status();
            let body = resp.text().await?;

            if code.is_success() {
                let obj: Value = serde_json::from_str(&body)?;
                let val = obj
                    .get("postsCount")
                    .and_then(|v| v.as_i64())
                    .map(|v| v as usize);
                val.expect("Unable to parse resp json")
            } else {
                anyhow!("{}: {}", code, body).into_err()?
            }
        };

        result.err_to_string()
    }
}
