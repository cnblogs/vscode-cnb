use crate::cnb::post::{PostReq, API_BASE_URL};
use crate::http::unit_or_err;
use crate::infra::http::{cons_query_string, setup_auth};
use crate::infra::result::ResultExt;
use crate::panic_hook;
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
        let post_ids: Vec<(&str, &usize)> = post_ids.iter().map(|id| ("postIds", id)).collect();
        let query = cons_query_string(post_ids);
        let url = format!("{}/bulk-operation/post?{}", API_BASE_URL, query);

        let client = reqwest::Client::new().delete(url);

        let req = setup_auth(client, &self.token, self.is_pat_token);

        let result: Result<()> = try {
            let resp = req.send().await?;
            unit_or_err(resp).await?
        };

        result.err_to_string()
    }
}
