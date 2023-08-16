use crate::cnb::user::UserReq;
use crate::http::body_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::{HomoResult, ResultExt};
use crate::{openapi, panic_hook};
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = UserReq)]
impl UserReq {
    #[wasm_bindgen(js_name = getInfo)]
    pub async fn export_get_info(&self) -> HomoResult<String> {
        panic_hook!();
        let url = openapi!("/users");

        let client = reqwest::Client::new().get(url);

        let req = setup_auth(client, &self.token, self.is_pat_token);

        let result: Result<String> = try {
            let resp = req.send().await?;
            body_or_err(resp).await?
        };

        result.homo_string()
    }
}
