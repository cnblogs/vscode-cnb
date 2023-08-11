use crate::cnb::post_category::PostCategoryReq;
use crate::http::unit_or_err;
use crate::infra::http::{setup_auth, APPLICATION_JSON};
use crate::infra::result::ResultExt;
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use reqwest::header::CONTENT_TYPE;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostCategoryReq)]
impl PostCategoryReq {
    #[wasm_bindgen(js_name = create)]
    pub async fn export_create(&self, category_dto_json: String) -> Result<(), String> {
        panic_hook!();

        let url = blog_backend!("/category/blog/1");

        let client = reqwest::Client::new().post(url);

        let req = setup_auth(client, &self.token, self.is_pat_token)
            .header(CONTENT_TYPE, APPLICATION_JSON)
            .body(category_dto_json);

        let result: Result<()> = try {
            let resp = req.send().await?;
            unit_or_err(resp).await?
        };

        result.err_to_string()
    }
}
