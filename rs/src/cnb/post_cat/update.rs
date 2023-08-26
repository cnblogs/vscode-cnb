use crate::cnb::post_cat::PostCatReq;
use crate::http::unit_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::ResultExt;
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::{String, ToString};
use anyhow::Result;
use mime::APPLICATION_JSON;
use reqwest::header::CONTENT_TYPE;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostCatReq)]
impl PostCatReq {
    #[wasm_bindgen(js_name = update)]
    pub async fn export_update(
        &self,
        category_id: usize,
        category_json: String,
    ) -> Result<(), String> {
        panic_hook!();

        let url = blog_backend!("/category/blog/{}", category_id);

        let client = reqwest::Client::new().put(url);

        let req = setup_auth(client, &self.token, self.is_pat_token)
            .header(CONTENT_TYPE, APPLICATION_JSON.to_string())
            .body(category_json);

        let result: Result<()> = try {
            let resp = req.send().await?;
            unit_or_err(resp).await?
        };

        result.err_to_string()
    }
}