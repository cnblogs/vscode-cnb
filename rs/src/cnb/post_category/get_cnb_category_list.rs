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
    #[wasm_bindgen(js_name = getSiteCategoryList)]
    pub async fn export_get_site_category_list(&self) -> HomoResult<String> {
        panic_hook!();
        let url = blog_backend!("/category/site");

        let client = reqwest::Client::new().get(url);

        let req = setup_auth(client, &self.token, self.is_pat_token);

        let result: Result<String> = try {
            let resp = req.send().await?;
            body_or_err(resp).await?
        };

        result.err_to_string()
    }
}
