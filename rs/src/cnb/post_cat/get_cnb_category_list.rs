use crate::cnb::post_cat::PostCatReq;
use crate::http::body_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::{HomoResult, ResultExt};
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = PostCatReq)]
impl PostCatReq {
    #[wasm_bindgen(js_name = getSitePresetList)]
    pub async fn export_get_site_preset_list(&self) -> HomoResult<String> {
        panic_hook!();
        let url = blog_backend!("/category/site");

        let client = reqwest::Client::new();

        let req = {
            let req = client.get(url);
            setup_auth(req, &self.token.token, self.token.is_pat)
        };

        let result: Result<String> = try {
            let resp = req.send().await?;
            body_or_err(resp).await?
        };

        result.err_to_string()
    }
}
