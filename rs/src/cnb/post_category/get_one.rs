use crate::cnb::post_category::PostCategoryReq;
use crate::http::body_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::{HomoResult, ResultExt};
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostCategoryReq)]
impl PostCategoryReq {
    #[wasm_bindgen(js_name = getOne)]
    pub async fn export_get_one(&self, category_id: usize) -> HomoResult<String> {
        panic_hook!();
        let query = format!("parent={}", category_id);
        let url = blog_backend!("/api/v2/blog-category-types/1/categories?{}", query);

        let client = reqwest::Client::new().get(url);

        let req = setup_auth(client, &self.token, self.is_pat_token);

        let result: Result<String> = try {
            let resp = req.send().await?;
            body_or_err(resp).await?
        };

        result.homo_string()
    }
}