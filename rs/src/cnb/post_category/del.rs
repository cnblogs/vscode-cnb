use crate::cnb::post_category::PostCategoryReq;
use crate::http::unit_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::ResultExt;
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostCategoryReq)]
impl PostCategoryReq {
    #[wasm_bindgen(js_name = del)]
    pub async fn export_del(&self, category_id: usize) -> Result<(), String> {
        panic_hook!();

        let url = blog_backend!("/category/blog/{}", category_id);

        let client = reqwest::Client::new().delete(url);

        let req = setup_auth(client, &self.token, self.is_pat_token);

        let result: Result<()> = try {
            let resp = req.send().await?;
            unit_or_err(resp).await?
        };

        result.err_to_string()
    }
}
