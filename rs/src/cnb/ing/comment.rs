use crate::cnb::ing::{IngReq, ING_API_BASE_URL};
use crate::http::unit_or_err;
use crate::infra::http::{setup_auth, APPLICATION_JSON};
use crate::infra::result::ResultExt;
use crate::panic_hook;
use alloc::format;
use alloc::string::String;
use anyhow::Result;
use reqwest::header::CONTENT_TYPE;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[allow(non_camel_case_types)]
#[serde_with::skip_serializing_none]
#[derive(Serialize, Deserialize, Debug, Default)]
struct Body {
    #[serde(rename(serialize = "replyTo"))]
    reply_to: Option<usize>,
    #[serde(rename(serialize = "parentCommentId"))]
    parent_comment_id: Option<usize>,
    content: String,
}

#[wasm_bindgen(js_class = IngReq)]
impl IngReq {
    #[wasm_bindgen(js_name = comment)]
    pub async fn export_comment(
        &self,
        ing_id: usize,
        content: String,
        reply_to: Option<usize>,
        parent_comment_id: Option<usize>,
    ) -> Result<(), String> {
        panic_hook!();
        let url = format!("{}/{}/comments", ING_API_BASE_URL, ing_id);

        let client = reqwest::Client::new().post(url);

        let body = Body {
            reply_to,
            parent_comment_id,
            content,
        };
        let req = setup_auth(client, &self.token, self.is_pat_token)
            .header(CONTENT_TYPE, APPLICATION_JSON);

        let result: Result<()> = try {
            let body = serde_json::to_string_pretty(&body)?;
            let req = req.body(body);
            let resp = req.send().await?;
            unit_or_err(resp).await?
        };

        result.err_to_string()
    }
}
