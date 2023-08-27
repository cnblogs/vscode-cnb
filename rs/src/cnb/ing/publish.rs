use crate::cnb::ing::IngReq;
use crate::cnb::oauth::Token;
use crate::http::unit_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::ResultExt;
use crate::{openapi, panic_hook};
use alloc::string::{String, ToString};
use anyhow::Result;
use mime::APPLICATION_JSON;
use reqwest::header::CONTENT_TYPE;
use serde_json::json;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = IngReq)]
impl IngReq {
    #[wasm_bindgen(js_name = publish)]
    pub async fn export_publish(&self, content: &str, is_private: bool) -> Result<(), String> {
        panic_hook!();
        let result = publish(&self.token, content, is_private).await;
        result.err_to_string()
    }
}

async fn publish(token: &Token, content: &str, is_private: bool) -> Result<()> {
    let url = openapi!("/statuses");

    let body = json!({
        "content": content,
        "isPrivate": is_private,
    })
    .to_string();

    let client = reqwest::Client::new();

    let req = {
        let req = client.post(url);
        let req = req.header(CONTENT_TYPE, APPLICATION_JSON.to_string());
        let req = req.body(body);
        setup_auth(req, &token.token, token.is_pat)
    };

    let resp = req.send().await?;
    unit_or_err(resp).await
}
