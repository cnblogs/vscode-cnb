use crate::cnb::oauth::OauthReq;
use crate::http::body_or_err;
use crate::infra::http::cons_query_string;
use crate::infra::result::{HomoResult, IntoResult, ResultExt};
use crate::{oauth, panic_hook};
use alloc::string::{String, ToString};
use alloc::{format, vec};
use anyhow::Result;
use mime::APPLICATION_WWW_FORM_URLENCODED;
use reqwest::header::CONTENT_TYPE;
use serde::{Deserialize, Serialize};
use serde_json::Value;
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
        let result = get_token(
            &self.client_id,
            &self.client_sec,
            auth_code,
            verify_code,
            callback_url,
        )
        .await;
        result.homo_string()
    }
}

async fn get_token(
    client_id: &str,
    client_sec: &str,
    auth_code: &str,
    verify_code: &str,
    callback_url: &str,
) -> Result<String> {
    let url = oauth!("/connect/token");

    let client = reqwest::Client::new();

    let queries = vec![
        ("code", auth_code),
        ("code_verifier", verify_code),
        ("grant_type", "authorization_code"),
        ("client_id", client_id),
        ("client_secret", client_sec),
        ("redirect_uri", callback_url),
    ];

    let req = client
        .post(url)
        .header(CONTENT_TYPE, APPLICATION_WWW_FORM_URLENCODED.to_string())
        .body(cons_query_string(queries));

    let resp = req.send().await?;
    let body = {
        let json = body_or_err(resp).await?;

        let val: Value = serde_json::from_str(&json)?;

        #[derive(Serialize, Deserialize, Debug, Default)]
        struct Body {
            #[serde(rename = "access_token")]
            pub token: String,
            pub expires_in: usize,
            pub id_token: String,
            pub scope: String,
            pub token_type: String,
        }

        serde_json::from_value::<Body>(val)?
    };

    body.token.into_ok()
}
