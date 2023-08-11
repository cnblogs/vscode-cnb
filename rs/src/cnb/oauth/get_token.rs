use crate::cnb::oauth::OauthReq;
use crate::cnb::oauth::OAUTH_API_BASE_URL;
use crate::http::body_or_err;
use crate::infra::http::{cons_query_string, APPLICATION_X3WFU};
use crate::infra::result::{HomoResult, ResultExt};
use crate::panic_hook;
use alloc::string::String;
use alloc::{format, vec};
use anyhow::Result;
use reqwest::header::CONTENT_TYPE;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = OauthReq)]
impl OauthReq {
    #[wasm_bindgen(js_name = getToken)]
    pub async fn export_get_token(
        &self,
        auth_code: &str,
        verify_code: &str,
        callback_url: &str,
    ) -> HomoResult<String> {
        panic_hook!();
        let url = format!("{}/connect/token", OAUTH_API_BASE_URL);

        let client = reqwest::Client::new().post(url);

        let queries = vec![
            ("code", auth_code),
            ("code_verifier", verify_code),
            ("grant_type", "authorization_code"),
            ("client_id", &self.client_id),
            ("client_secret", &self.client_secret),
            ("redirect_uri", callback_url),
        ];

        let req = client
            .header(CONTENT_TYPE, APPLICATION_X3WFU)
            .body(cons_query_string(queries));

        let result: Result<String> = try {
            let resp = req.send().await?;
            body_or_err(resp).await?
        };

        result.homo_string()
    }
}
