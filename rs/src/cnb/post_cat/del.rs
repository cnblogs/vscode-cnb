use crate::cnb::post_cat::PostCatReq;
use crate::http::unit_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::ResultExt;
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostCatReq)]
impl PostCatReq {
    #[wasm_bindgen(js_name = del)]
    pub async fn export_del(&self, category_id: usize) -> Result<(), String> {
        panic_hook!();

        let url = blog_backend!("/category/blog/{}", category_id);

        let client = reqwest::Client::new();

        let req = {
            let req = client.delete(url);
            setup_auth(req, &self.token.token, self.token.is_pat)
        };

        let result: Result<()> = try {
            let resp = req.send().await?;
            unit_or_err(resp).await?
        };

        result.err_to_string()
    }
}
