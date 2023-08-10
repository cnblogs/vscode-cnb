use crate::cnb::ing::{IngReq, ING_API_BASE_URL};
use crate::infra::http::setup_auth;
use crate::infra::result::{homo_result_string, HomoResult, IntoResult};
use crate::panic_hook;
use alloc::string::String;
use alloc::{format, vec};
use anyhow::{anyhow, Result};
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
        let url = format!("{ING_API_BASE_URL}/@{ing_type}");

        let client = reqwest::Client::new().get(url);

        let query = vec![("pageIndex", page_index), ("pageSize", page_size)];
        let req = setup_auth(client, &self.token, self.is_pat_token).query(&query);

        let result: Result<String> = try {
            let resp = req.send().await?;
            let code = resp.status();

            if code.is_success() {
                resp.text().await?
            } else {
                let text = resp.text().await?;
                anyhow!("{}: {}", code, text).into_err()?
            }
        };

        homo_result_string(result)
    }
}
