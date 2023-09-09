use crate::cnb::oauth::OauthReq;
use crate::http::unit_or_err;
use crate::infra::http::cons_query_string;
use crate::infra::result::ResultExt;
use crate::{basic, oauth, panic_hook};
use alloc::string::{String, ToString};
use alloc::{format, vec};
use anyhow::Result;
use base64::engine::general_purpose;
use base64::Engine;
use mime::APPLICATION_WWW_FORM_URLENCODED;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = OauthReq)]
impl OauthReq {
    #[wasm_bindgen(js_name = revokeToken)]
    pub async fn export_revoke_token(&self, token: &str) -> Result<(), String> {
        panic_hook!();
        let result = revoke_token(&self.client_id, &self.client_sec, token).await;
        result.err_to_string()
    }
}

async fn revoke_token(client_id: &str, client_sec: &str, token: &str) -> Result<()> {
    let credentials = format!("{}:{}", client_id, client_sec);
    let credentials = general_purpose::STANDARD.encode(credentials);
    let url = oauth!("/connect/revocation");

    let client = reqwest::Client::new();

    let queries = vec![
        ("client_id", client_id),
        ("token", token),
        ("token_type_hint", "refresh_token"),
    ];

    let req = client
        .post(url)
        .header(CONTENT_TYPE, APPLICATION_WWW_FORM_URLENCODED.to_string())
        .header(AUTHORIZATION, basic!(credentials))
        .body(cons_query_string(queries));

    let resp = req.send().await?;
    unit_or_err(resp).await
}
