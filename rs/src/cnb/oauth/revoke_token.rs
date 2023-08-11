use crate::cnb::oauth::OauthReq;
use crate::cnb::oauth::OAUTH_API_BASE_URL;
use crate::http::unit_or_err;
use crate::infra::http::{cons_query_string, APPLICATION_X3WFU};
use crate::infra::result::ResultExt;
use crate::{basic, panic_hook};
use alloc::string::String;
use alloc::{format, vec};
use anyhow::Result;
use base64::engine::general_purpose;
use base64::Engine;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = OauthReq)]
impl OauthReq {
    #[wasm_bindgen(js_name = revokeToken)]
    pub async fn export_revoke_token(&self, token: &str) -> Result<(), String> {
        panic_hook!();
        let credentials = format!("{}:{}", self.client_id, self.client_secret);
        let credentials = general_purpose::STANDARD.encode(credentials);
        let url = format!("{}/connect/revocation", OAUTH_API_BASE_URL);

        let client = reqwest::Client::new().post(url);

        let queries = vec![
            ("client_id", self.client_id.as_str()),
            ("token", token),
            ("token_type_hint", "refresh_token"),
        ];

        let req = client
            .header(CONTENT_TYPE, APPLICATION_X3WFU)
            .header(AUTHORIZATION, basic!(credentials))
            .body(cons_query_string(queries));

        let result: Result<()> = try {
            let resp = req.send().await?;
            unit_or_err(resp).await?
        };

        result.err_to_string()
    }
}
